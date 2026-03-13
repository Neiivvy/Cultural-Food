import db from "../config/db.js";

// Must run AFTER authMiddleware (protect)
// Checks that req.user.userId has role='admin'
const adminOnly = async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      "SELECT role FROM users WHERE user_id = ? LIMIT 1",
      [req.user.userId]
    );
    if (!rows[0] || rows[0].role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required." });
    }
    next();
  } catch (err) {
    console.error("Admin check error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export default adminOnly;