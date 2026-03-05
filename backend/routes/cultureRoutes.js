import { Router } from "express";
import db from "../config/db.js";

const router = Router();

// GET /api/cultures — return all culture tags
router.get("/", async (_req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT culture_id, culture_name FROM cultures ORDER BY culture_name ASC"
    );
    return res.status(200).json({ success: true, data: { cultures: rows } });
  } catch (err) {
    console.error("cultures error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

export default router;