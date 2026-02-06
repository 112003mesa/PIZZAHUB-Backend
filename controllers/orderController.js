import Order from "../models/Order.js";

export const createOrder = async (req, res) => {
  try {
    const { items, address, paymentMethod } = req.body;

    if (!items || items.length === 0)
      return res.status(400).json({ message: "Cart is empty" });

    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const deliveryFee = 20;
    const totalAmount = subtotal + deliveryFee;

    const order = await Order.create({
      user: req.user.id,
      items,
      subtotal,
      deliveryFee,
      totalAmount,
      paymentMethod,
      address,
    });

    res.status(200).json({
      status: 200,
      message: "Order created successfully",
      order,
    });
  } catch (err) {
    console.error("ORDER CREATE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 }).populate("user", "name email address").populate("deliveryMan", "name");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate("user", "name email address").populate("deliveryMan", "name");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAvailableOrdersForDelivery = async (req, res) => {
  try {
    const orders = await Order.find({
      status: "pending",
      deliveryMan: null,
    }).populate("user", "name email");

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const acceptOrderByDelivery = async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      {
        _id: req.params.id,
        status: "pending",
        deliveryMan: null,
      },
      {
        deliveryMan: req.user.id,
        status: "accepted",
      },
      { new: true }
    );

    if (!order)
      return res.status(400).json({ message: "Order not available" });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateOrderStatusByDelivery = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["on_the_way", "delivered"].includes(status))
      return res.status(400).json({ message: "Invalid status" });

    const order = await Order.findOneAndUpdate(
      {
        _id: req.params.id,
        deliveryMan: req.user.id,
      },
      { status },
      { new: true }
    );

    if (!order)
      return res.status(404).json({ message: "Order not found" });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getOrderByIdForUser = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.id,
    }).populate("deliveryMan", "name phone");

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
