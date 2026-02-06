import jwt from "jsonwebtoken";
import User from "../models/User.js";

const authMiddleware = async (req, res, next) => {
  try {
    // 1️⃣ استلام access token من header
    const authHeader = req.headers.authorization;

    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No access token provided" });
    }
    
    const token = authHeader.split(" ")[1];
    
    // 2️⃣ التحقق من التوكن
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // 3️⃣ جلب المستخدم من DB
    const user = await User.findById(decoded.id).select("-password -refreshToken");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // 4️⃣ حفظ المستخدم في req
    req.user = user;

    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    return res.status(401).json({ message: "Invalid or expired access token" });
  }
};

export default authMiddleware;
