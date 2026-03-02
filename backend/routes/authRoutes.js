import express from "express";
import { signup, login, getMe } from "../controllers/authController.js";
import { validateSignup, validateLogin } from "../middleware/validateAuth.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// POST /api/auth/signup
router.post("/signup", validateSignup, signup);

// POST /api/auth/login
router.post("/login", validateLogin, login);

// GET /api/auth/me  (protected)
router.get("/me", protect, getMe);

export default router;