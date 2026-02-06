import Cart from "../models/Cart.js";
import Order from "../models/Order.js";

// تحويل الكارت إلى أوردر
export const checkout = async (req, res) => {
  try {
    const { address, paymentMethod } = req.body;

    // نجيب الكارت الحالي
    const cart = await Cart.findOne({ user: req.user.id }).populate("items.product");
    if (!cart || cart.items.length === 0)
      return res.status(400).json({ message: "Cart is empty" });

    // نحسب subtotal
    const subtotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);

    const deliveryFee = 20; // ممكن نغير حسب المنطق
    const totalAmount = subtotal + deliveryFee;

    // نعمل أوردر جديد
    const order = await Order.create({
      user: req.user.id,
      items: cart.items,
      subtotal,
      deliveryFee,
      totalAmount,
      paymentMethod,
      address,
      status: "pending", // أول ما يتعمل أوردر يبقى pending
    });

    // بعد ما الأوردر اتعمل نمسح الكارت
    cart.items = [];
    cart.subtotal = 0;
    await cart.save();

    res.status(201).json({ message: "Order placed successfully", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
