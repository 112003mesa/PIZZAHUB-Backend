import Product from "../models/Product.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";


export const createProduct = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    const { name, description, basePrice, sizes, extras, category } = req.body || {};


    if (!name || !description || !req.file || !category) return res.status(400).json({ message: "Missing required fields" });

    const streamUpload = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "products" },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });

      
      const result = await streamUpload();
      
    const newProduct = await Product.create({
      name,
      description,
      image: result.secure_url,
      basePrice: Number(basePrice),
      sizes: sizes ? JSON.parse(sizes) : [],
      extras: extras ? JSON.parse(extras) : [],
      category,
    });

    res.status(201).json({ status: 200, message: "Product created successfully", data: newProduct });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};


export const getProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json({status: 200, message: "Products fetched successfully", data: products});
      } catch (err) {
        res.status(500).json({status: 500, message: err.message});
      }
}



export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ status: 404, message: "Product not found" });

    // حذف الصورة من Cloudinary
    const publicId = product.image.split("/").pop().split(".")[0]; // استخراج الـ public_id
    await cloudinary.uploader.destroy(`products/${publicId}`);

    await Product.findByIdAndDelete(id);

    res.status(200).json({ status: 200, message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message });
  }
};


export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, basePrice, sizes, extras, category } = req.body;

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ status: 404, message: "Product not found" });

    let imageUrl = product.image;

    // لو الصورة الجديدة موجودة، نرفعها ونحذف القديمة
    if (req.file) {
      // حذف القديمة
      const publicId = product.image.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`products/${publicId}`);

      // رفع الجديدة
      const streamUpload = () =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "products" },
            (error, result) => {
              if (result) resolve(result);
              else reject(error);
            }
          );
          streamifier.createReadStream(req.file.buffer).pipe(stream);
        });

      const result = await streamUpload();
      imageUrl = result.secure_url;
    }

    product.name = name || product.name;
    product.description = description || product.description;
    product.basePrice = basePrice || product.basePrice;
    product.sizes = sizes ? JSON.parse(sizes) : product.sizes;
    product.extras = extras ? JSON.parse(extras) : product.extras;
    product.category = category || product.category;
    product.image = imageUrl;

    await product.save();

    res.status(200).json({ status: 200, message: "Product updated successfully", data: product });
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message });
  }
};

export const getBestSellers = async (req, res) => {
  try {
    const bestSellers = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          // تحويل الـ String لـ ObjectId عشان الـ Lookup يشتغل صح
          _id: { $toObjectId: "$items.product" }, 
          totalSold: { $sum: "$items.quantity" },
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "products", // تأكد إن الـ collection في الـ DB اسمها كدا
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        }
      },
      { $unwind: "$productDetails" },
      {
        $project: {
          _id: "$productDetails._id", // بنرجعه لـ _id عشان الـ frontend محتاجه كدا
          name: "$productDetails.name",
          description: "$productDetails.description",
          image: "$productDetails.image",
          basePrice: "$productDetails.basePrice",
          sizes: "$productDetails.sizes",
          extras: "$productDetails.extras",
          category: "$productDetails.category",
          totalSold: 1,
        }
      }
    ]);

    return res.status(200).json({
      status: 200,
      message: "Best sellers fetched successfully",
      data: bestSellers, 
    });

  } catch (err) {
    console.error("Aggregation Error:", err); // عشان تشوف الخطأ في الـ Terminal بتاعك
    return res.status(500).json({
      status: 500,
      message: err.message,
    });
  }
};


export const getDeliveryStaff = async (req, res) => {
  try {
    const staff = await User.find({ role: "delivery" })
      .populate({
        path: "currentOrderId", // اسم الحقل في موديل اليوزر
        select: "address totalAmount paymentMethod createdAt items orderItems status", // الحقول اللي محتاجها من موديل الـ Order
      })
      .select("-password -refreshToken");

    res.status(200).json(staff);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching delivery staff" });
  }
};