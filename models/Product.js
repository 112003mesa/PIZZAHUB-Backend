import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  image: String,

  basePrice: Number,

  sizes: [
    {
      name: String,   // Small | Medium | Large
      price: Number,  // 0 | 20 | 40
    },
  ],

  extras: [
    {
      name: String,   // CHEESE | BACON ...
      price: Number, // 10 | 8 ...
    },
  ],

  category: {
    type: String, // pizza, burger...
  },
});

const Product = mongoose.model("Product", productSchema);

export default Product;