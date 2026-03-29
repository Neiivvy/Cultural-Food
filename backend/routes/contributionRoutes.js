import express from "express";
import protect from "../middleware/authMiddleware.js";
import adminProtect from "../middleware/adminMiddleware.js";
import { uploadPostMedia } from "../config/cloudinary.js";
import {
  submitContribution,
  getMyContributions,
  getAllContributions,
  getContributionById,
  updateContribution,
  approveContribution,
  rejectContribution,
} from "../controllers/contributionController.js";

const router = express.Router();

// ── User routes (require login) ────────────────────────────────
// uploadPostMedia is already a .single("media") middleware — use directly
router.post("/",    protect, uploadPostMedia, submitContribution);
router.get("/mine", protect, getMyContributions);

// ── Admin routes (require admin token) ────────────────────────
router.get("/",             adminProtect, getAllContributions);
router.get("/:id",          adminProtect, getContributionById);
router.put("/:id",          adminProtect, uploadPostMedia, updateContribution);
router.post("/:id/approve", adminProtect, approveContribution);
router.post("/:id/reject",  adminProtect, rejectContribution);

export default router;