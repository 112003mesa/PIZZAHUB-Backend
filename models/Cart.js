import mongoose from "mongoose";

const CartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        size: { id: String, name: String, price: Number },
        extras: [
          {
            id: String,
            name: String,
            price: Number,
          },
        ],
        quantity: { type: Number, default: 1 },
        totalPrice: { type: Number, required: true },
      },
    ],
    subtotal: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Cart", CartSchema);
