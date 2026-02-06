export const getBestSellers = async (req, res) => {
  try {
    const bestSellers = await Order.aggregate([
      { $unwind: "$items" }, // نفك الـ items لكل أوردر
      { 
        $group: {
          _id: "$items.product", // نجمّع على حسب المنتج
          totalSold: { $sum: "$items.quantity" }, // مجموع الكميات المباعة
        }
      },
      { $sort: { totalSold: -1 } }, // ترتيب تنازلي حسب المبيعات
      { $limit: 5 }, // أفضل 5 منتجات
      {
        $lookup: {
          from: "products", // اسم collection المنتجات
          localField: "_id",
          foreignField: "_id",
          as: "product",
        }
      },
      { $unwind: "$product" }, // نفك المصفوفة
      {
        $project: {
          _id: 0,
          productId: "$product._id",
          name: "$product.name",
          image: "$product.image",
          price: "$product.price",
          totalSold: 1,
        }
      }
    ]);

    res.json(bestSellers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
