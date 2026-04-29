import User from "../models/userModel.js";
import { deleteCloudinaryAsset } from "../config/cloudinary.js";

// GET /api/users/:id  — public profile (blocked if private and not own)
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    // If profile is private, only owner can see it
    const requesterId = req.user?.userId; // may be undefined (unauthenticated)
    if (!user.is_public && Number(requesterId) !== Number(user.user_id)) {
      return res.status(403).json({ success: false, message: "This profile is private." });
    }

    // Remove password just in case
    const { password: _, ...safe } = user;
    return res.status(200).json({ success: true, data: { user: safe } });
  } catch (err) {
    console.error("getProfile error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// PUT /api/users/:id  — update own profile (name, bio, pic, is_public)
export const updateProfile = async (req, res) => {
  try {
    const targetId = Number(req.params.id);
    if (req.user.userId !== targetId) {
      return res.status(403).json({ success: false, message: "Forbidden." });
    }

    const { name, bio, is_public } = req.body;
    const fields = {};

    if (name      !== undefined) fields.name      = name;
    if (bio       !== undefined) fields.bio        = bio;
    if (is_public !== undefined) fields.is_public  = is_public === "true" || is_public === true ? 1 : 0;

    if (req.file) {
      const current = await User.findById(targetId);
      if (current?.profile_picture) {
        await deleteCloudinaryAsset(current.profile_picture).catch(() => {});
      }
      fields.profile_picture = req.file.path;
    }

    await User.update(targetId, fields);
    const updated = await User.findById(targetId);
    return res.status(200).json({ success: true, message: "Profile updated.", data: { user: updated } });
  } catch (err) {
    console.error("updateProfile error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// GET /api/users/search?q=  — search public users by name/email
export const searchUsers = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q || q.length < 2) {
      return res.json({ success: true, data: { users: [] } });
    }
    const users = await User.searchPublic(q);
    return res.json({ success: true, data: { users } });
  } catch (err) {
    console.error("searchUsers error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// GET /api/users/top  — top engaging public users
export const getTopUsers = async (req, res) => {
  try {
    const users = await User.getTopUsers(6);
    return res.json({ success: true, data: { users } });
  } catch (err) {
    console.error("getTopUsers error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// GET /api/users/contributors  — approved food contributors
export const getContributors = async (req, res) => {
  try {
    const contributors = await User.getContributors(12);
    return res.json({ success: true, data: { contributors } });
  } catch (err) {
    console.error("getContributors error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};