import { Router } from "express";
import { getProfile, updateProfile } from "../controllers/userController.js";
import protect from "../middleware/authMiddleware.js";
import { uploadProfilePic } from "../config/cloudinary.js";

const router = Router();

router.get("/:id", getProfile);
router.put("/:id", protect, uploadProfilePic, updateProfile);

export default router;