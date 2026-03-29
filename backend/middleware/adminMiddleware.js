import jwt from "jsonwebtoken";
import db from "../config/db.js";

const adminOnly = async (req, res, next) => {
  try {
    // 1. Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided." });
    }
    const token = authHeader.split(" ")[1];

    // 2. Verify and decode the token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: "Invalid or expired token." });
    }

    // 3. Check user exists and has admin role
    const [rows] = await db.execute(
      "SELECT user_id, name, email, role FROM users WHERE user_id = ? LIMIT 1",
      [decoded.userId]
    );

    if (!rows[0]) {
      return res.status(401).json({ success: false, message: "User not found." });
    }
    if (rows[0].role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required." });
    }

    // 4. Attach admin info to req so controllers can use it
    req.admin = { userId: rows[0].user_id, name: rows[0].name, email: rows[0].email };
    next();
  } catch (err) {
    console.error("Admin check error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export default adminOnly;