import Order from "../models/Order.js";

// جلب الأوردرز اللي pending
export const getPendingOrders = async (req, res) => {
  try {
    const orders = await Order.find({ status: "pending" }).populate("user", "name email");
    if(!orders) return res.json({message: "Order not found"})
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// قبول الأوردر
export const acceptOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status !== "pending")
      return res.status(400).json({ message: "Order already accepted" });

    order.status = "accepted";
    order.delivery = req.user.id;
    await order.save();

    res.json({ message: "Order accepted", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// تحديث الحالة ("on_the_way", "delivered")
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body; // "on_the_way", "delivered"
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: "Order not found" });
    if (!["on_the_way", "delivered"].includes(status))
      return res.status(400).json({ message: "Invalid status" });

    order.status = status;
    await order.save();

    res.json({ message: "Order status updated", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    
    // تحديد بداية ونهاية اليوم بدقة
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const endOfToday = new Date(now.setHours(23, 59, 59, 999));
    
    // بداية الشهر الحالي
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // قبل 7 أيام
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0); // لضمان دقة الرسم البياني

    // استخدام Promise.all لتشغيل الاستعلامات في نفس الوقت لسرعة أكبر
    const [
      weeklyStats,
      todayOrders,
      totalCounts,
      monthStats
    ] = await Promise.all([
      // 1. Weekly Stats (Graph)
      Order.aggregate([
        { 
          $match: { 
            createdAt: { $gte: sevenDaysAgo },
            status: "delivered" 
          } 
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            orders: { $sum: 1 },
            income: { $sum: "$totalAmount" }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // 2. Today's Orders (List + Populate)
      Order.find({
        createdAt: { $gte: startOfToday, $lte: endOfToday }
      })
      .populate("user", "name email address")
      .sort({ createdAt: -1 }),

      // 3. Global Stats (Counts)
      Order.aggregate([
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalDelivered: { 
              $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] } 
            },
            totalCancelled: { 
              $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } 
            }
          }
        }
      ]),

      // 4. Monthly Earnings (Sum only)
      Order.aggregate([
        {
          $match: {
            status: "delivered",
            createdAt: { $gte: startOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            totalEarnings: { $sum: "$totalAmount" }
          }
        }
      ])
    ]);

    // معالجة البيانات المسترجعة
    const globalStats = totalCounts[0] || { totalOrders: 0, totalDelivered: 0, totalCancelled: 0 };
    const monthEarnings = monthStats[0]?.totalEarnings || 0;

    const deliveredToday = todayOrders.filter(o => o.status === "delivered");
    const todayEarnings = deliveredToday.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    // إرسال الرد
    res.json({
      orders: {
        todayCount: todayOrders.length,
        deliveredTodayCount: deliveredToday.length,
        allDelivered: globalStats.totalDelivered,
        
        percentage: globalStats.totalDelivered > 0 
          ? Number(((deliveredToday.length / globalStats.totalDelivered) * 100).toFixed(1)) 
          : 0,
          
        todayOrders: todayOrders || [],
        
        deliveryCompletionRate: globalStats.totalOrders > 0 
          ? Number(((globalStats.totalDelivered / globalStats.totalOrders) * 100).toFixed(1)) 
          : 0,
          
        orderCancelRate: globalStats.totalOrders > 0 
          ? Number(((globalStats.totalCancelled / globalStats.totalOrders) * 100).toFixed(1)) 
          : 0,
          
        avgDeliveryTime: 25, 
      },
      earnings: {
        today: todayEarnings,
        month: monthEarnings,
        percentage: monthEarnings > 0 
          ? Number(((todayEarnings / monthEarnings) * 100).toFixed(1)) 
          : 0,
      },
      weeklyStats: weeklyStats || []
    });

  } catch (err) {
    console.error("Dashboard Stats Error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getMyDeliveries = async (req, res) => {
  try {
    const orders = await Order.find({
      deliveryMan: req.user.id,
      status: { $in: ["accepted", "on_the_way"] }, // الطلبات اللي أنا شغال عليها
    })
      .populate("user", "name email address")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const getCurrentTrip = async (req, res) => {
  try {
    const order = await Order.findOne({
      deliveryMan: req.user.id,
      status: { $in: ["accepted", "on_the_way"] },
    })
    .populate("user", "name address email lat lng") // fetch only available customer data
    .sort({ createdAt: -1 });

    if (!order) {
      return res.status(404).json({ message: "No active trip found" });
    }

    if (!order.user) {
      return res.status(500).json({ message: "Customer data not linked to this order" });
    }

    res.json({
      orderId: order._id,
      // since restaurant data is not available, we send customer's coordinates as a temporary start point
      customer: {
        lat: order.user.lat || 30.0444, // fallback value if empty
        lng: order.user.lng || 31.2357,
        address: order.user.address || "Customer address",
        name: order.user.name
      },
      distance: "Calculating...", 
      estimatedTime: "..."
    });

  } catch (err) {
    res.status(500).json({ message: "Server error occurred" });
  }
};
