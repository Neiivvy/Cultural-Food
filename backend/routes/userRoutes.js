import { Router } from "express";
import {
  getProfile,
  updateProfile,
  searchUsers,
  getTopUsers,
  getContributors,
} from "../controllers/userController.js";
import protect        from "../middleware/authMiddleware.js";
import optionalAuth   from "../middleware/OptionalAuthMiddleware.js";
import { uploadProfilePic } from "../config/cloudinary.js";

const router = Router();

// Search public users (authenticated only)
router.get("/search",       protect, searchUsers);

// Top engaging users sidebar
router.get("/top",          protect, getTopUsers);

// Contributors list
router.get("/contributors", protect, getContributors);

// Public profile — use optionalAuth so private check works for both logged-in and guests
router.get("/:id",          optionalAuth, getProfile);

// Update own profile
router.put("/:id",          protect, uploadProfilePic, updateProfile);

export default router;