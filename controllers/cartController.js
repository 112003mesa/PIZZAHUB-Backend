import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// إضافة منتج للكارت
export const addToCart = async (req, res) => {
  try {
    const { productId, size, extras, quantity } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const totalPrice =
      (product.basePrice + (size?.price || 0) + extras?.reduce((sum, e) => sum + e.price, 0)) *
    quantity;

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) cart = new Cart({ user: req.user.id, items: [] });

    cart.items.push({ product: product._id, size, extras, quantity, totalPrice });
    cart.subtotal += totalPrice;

    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// حذف منتج من الكارت
export const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });

    cart.subtotal -= item.totalPrice;
    item.remove();

    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// تعديل كمية أو extras
export const updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity, extras } = req.body;

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });

    // تحديث
    item.quantity = quantity ?? item.quantity;
    item.extras = extras ?? item.extras;
    item.totalPrice =
      (item.product.basePrice + (item.size?.price || 0) + (item.extras?.reduce((sum, e) => sum + e.price, 0) || 0)) *
      item.quantity;

    // إعادة حساب subtotal
    cart.subtotal = cart.items.reduce((sum, i) => sum + i.totalPrice, 0);

    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// عرض الكارت الحالي
export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate("items.product");
    res.json(cart || { items: [], subtotal: 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// مسح الكارت بالكامل
export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = [];
    cart.subtotal = 0;

    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
