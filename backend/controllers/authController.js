import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const SALT_ROUNDS = 12;

const generateToken = (userId, email) =>
  jwt.sign({ userId, email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// POST /api/auth/signup
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already in use." });
    }

    const hashed   = await bcrypt.hash(password, SALT_ROUNDS);
    const newId    = await User.create({ name, email, hashedPassword: hashed });
    const token    = generateToken(newId, email);

    return res.status(201).json({
      success: true,
      message: "Account created.",
      data: { user: { user_id: newId, name, email }, token },
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const token = generateToken(user.user_id, user.email);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        user: { user_id: user.user_id, name: user.name, email: user.email },
        token,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    return res.status(200).json({ success: true, data: { user } });
  } catch (err) {
    console.error("GetMe error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};