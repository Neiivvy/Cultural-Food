import { Router } from "express";
import protect from "../middleware/authMiddleware.js";
import adminOnly from "../middleware/adminMiddleware.js";
import db from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = Router();

// POST /api/admin/login — admin signs in with email+password
// Returns token just like regular login, but verifies role=admin
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.execute(
      "SELECT * FROM users WHERE email = ? AND role = 'admin' LIMIT 1",
      [email]
    );
    const admin = rows[0];
    if (!admin) return res.status(401).json({ success: false, message: "Invalid admin credentials." });

    const ok = await bcrypt.compare(password, admin.password);
    if (!ok)  return res.status(401).json({ success: false, message: "Invalid admin credentials." });

    const token = jwt.sign(
      { userId: admin.user_id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.json({
      success: true,
      message: "Admin login successful.",
      data: {
        token,
        user: { user_id: admin.user_id, name: admin.name, email: admin.email, role: "admin" },
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// GET /api/admin/me — verify admin session
router.get("/me", protect, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT user_id, name, email, role FROM users WHERE user_id = ?",
      [req.user.userId]
    );
    res.json({ success: true, data: { user: rows[0] } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// GET /api/admin/stats — dashboard counts
router.get("/stats", protect, adminOnly, async (req, res) => {
  try {
    const [[foodCounts], [userCount], [postCount], [reportCount]] = await Promise.all([
      db.execute("SELECT status, COUNT(*) as count FROM foods GROUP BY status"),
      db.execute("SELECT COUNT(*) as count FROM users WHERE role='user'"),
      db.execute("SELECT COUNT(*) as count FROM posts"),
      db.execute("SELECT COUNT(*) as count FROM reports WHERE status='pending'"),
    ]);
    const foods = { pending: 0, approved: 0, rejected: 0 };
    foodCounts.forEach(r => { foods[r.status] = Number(r.count); });
    res.json({
      success: true,
      data: {
        foods,
        total_users:   Number(userCount[0].count),
        total_posts:   Number(postCount[0].count),
        pending_reports: Number(reportCount[0].count),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// GET /api/admin/foods?status=pending|approved|rejected|all
router.get("/foods", protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.query;
    let q = `SELECT f.*, c.culture_name, u.name AS submitter_name, u.email AS submitter_email
             FROM foods f
             LEFT JOIN cultures c ON f.culture_id = c.culture_id
             LEFT JOIN users u    ON f.submitted_by = u.user_id`;
    const params = [];
    if (status && status !== "all") { q += ` WHERE f.status = ?`; params.push(status); }
    q += ` ORDER BY f.created_at DESC`;
    const [foods] = await db.execute(q, params);
    res.json({ success: true, data: { foods } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// PUT /api/admin/foods/:id/approve
router.put("/foods/:id/approve", protect, adminOnly, async (req, res) => {
  try {
    await db.execute("UPDATE foods SET status='approved', rejection_note=NULL WHERE food_id=?", [req.params.id]);
    res.json({ success: true, message: "Food approved." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// PUT /api/admin/foods/:id/reject
router.put("/foods/:id/reject", protect, adminOnly, async (req, res) => {
  try {
    const { note } = req.body;
    await db.execute("UPDATE foods SET status='rejected', rejection_note=? WHERE food_id=?", [note||'', req.params.id]);
    res.json({ success: true, message: "Food rejected." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// DELETE /api/admin/foods/:id
router.delete("/foods/:id", protect, adminOnly, async (req, res) => {
  try {
    await db.execute("DELETE FROM foods WHERE food_id=?", [req.params.id]);
    res.json({ success: true, message: "Food deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// GET /api/admin/reports
router.get("/reports", protect, adminOnly, async (req, res) => {
  try {
    const [reports] = await db.execute(
      `SELECT r.*, u.name AS reporter_name, p.title AS post_title
       FROM reports r
       LEFT JOIN users u ON r.user_id = u.user_id
       LEFT JOIN posts p ON r.post_id = p.post_id
       WHERE r.status = 'pending'
       ORDER BY r.created_at DESC`
    );
    res.json({ success: true, data: { reports } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// PUT /api/admin/reports/:id — resolve or ignore
router.put("/reports/:id", protect, adminOnly, async (req, res) => {
  try {
    const { action } = req.body; // 'resolved' or 'ignored'
    await db.execute("UPDATE reports SET status=? WHERE report_id=?", [action, req.params.id]);
    res.json({ success: true, message: `Report ${action}.` });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// GET /api/admin/users
router.get("/users", protect, adminOnly, async (req, res) => {
  try {
    const [users] = await db.execute(
      "SELECT user_id, name, email, role, created_at FROM users ORDER BY created_at DESC"
    );
    res.json({ success: true, data: { users } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

export default router;