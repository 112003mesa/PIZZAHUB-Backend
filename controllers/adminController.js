import Order from "../models/Order.js";
import User from "../models/User.js";
import Product from "../models/Product.js";

const getDateBefore = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

export const getDashboardStats = async (req, res) => {
  try {
    const periods = {
      day: 1,
      week: 7,
      month: 30,
      threeMonths: 90,
      sixMonths: 180,
      year: 365,
    };

    // 1. Helper for simple counts
    const buildCount = async (Model, filter = {}) => {
      const result = {};
      for (const [key, days] of Object.entries(periods)) {
        result[key] = await Model.countDocuments({
          ...filter,
          createdAt: { $gte: getDateBefore(days) },
        });
      }
      result.all = await Model.countDocuments(filter);
      return result;
    };

    // 2. Main Stats
    const totalOrders = await buildCount(Order);
    const pendingOrders = await buildCount(Order, { status: "pending" }); // تأكد أن حالة الانتظار في الداتابيز هي "pending"
    const usersCount = await buildCount(User);
    const productsCount = await buildCount(Product);

    // 3. Latest Orders (Table Data)
    const latestOrders = {};
    for (const [key, days] of Object.entries(periods)) {
      latestOrders[key] = await Order.find({
        createdAt: { $gte: getDateBefore(days) },
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("user", "name email");
    }
    latestOrders.all = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10) // Increased limit for the table
      .populate("user", "name email");

    // ==========================================
    // 4. Chart Data (Aggregation)
    // ==========================================

    // A. Revenue Chart (Last 6 Months)
    const sixMonthsAgo = getDateBefore(180);
    const revenueStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          // status: "delivered" // Optional: Uncomment if you only want completed orders
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" }, // Group by Month
          sales: { $sum: 1 }, // Count of orders
          revenue: { $sum: "$totalAmount" }, // Sum of totalAmount
        }
      },
      { $sort: { "_id": 1 } } // Sort by month
    ]);

    // B. Pie Chart (Orders by Status)
    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: "$status", // or "$paymentMethod"
          value: { $sum: 1 }
        }
      }
    ]);

    // C. Bar Chart (Daily Sales - Last 7 Days)
    const sevenDaysAgo = getDateBefore(7);
    const dailyProfit = await Order.aggregate([
      {
        $match: { createdAt: { $gte: sevenDaysAgo } }
      },
      {
        $group: {
          _id: { $dayOfWeek: "$createdAt" },
          value: { $sum: "$totalAmount" } // Using totalAmount as "value"
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    res.json({
      totalOrders,
      pendingOrders,
      usersCount,
      productsCount,
      latestOrders,
      charts: {
        revenueStats,
        ordersByStatus,
        dailyProfit
      }
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};