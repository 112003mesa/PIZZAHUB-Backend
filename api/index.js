import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoute.js";
import { connectDB } from "./config/db.js";
import cookieParser from "cookie-parser";
import corsOptions from "./config/corsOptions.js";
import orderRoutes from "./routes/orderRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import checkoutRoutes from "./routes/checkoutRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";



const app = express();

/* ================= Middleware ================= */

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

/* ================= Routes ================= */

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes)
app.use("/api/checkout", checkoutRoutes)
app.use("/api/delivery", deliveryRoutes)
app.use("/api/admin", adminRoutes);

/* ================= Database ================= */

await connectDB()

/* ================= Server ================= */


export default app;
