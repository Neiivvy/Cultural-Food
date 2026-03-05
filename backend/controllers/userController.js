import User from "../models/userModel.js";
import { deleteCloudinaryAsset } from "../config/cloudinary.js";

// GET /api/users/:id
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    return res.status(200).json({ success: true, data: { user } });
  } catch (err) {
    console.error("getProfile error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// PUT /api/users/:id   (protected, own profile only)
export const updateProfile = async (req, res) => {
  try {
    const targetId = Number(req.params.id);

    // Only allow updating own profile
    if (req.user.userId !== targetId) {
      return res.status(403).json({ success: false, message: "Forbidden." });
    }

    const { name, bio } = req.body;
    const fields        = {};

    if (name !== undefined)  fields.name = name;
    if (bio  !== undefined)  fields.bio  = bio;

    // If a new profile picture was uploaded via Multer → Cloudinary
    if (req.file) {
      // Delete old one from Cloudinary
      const current = await User.findById(targetId);
      if (current?.profile_picture) {
        await deleteCloudinaryAsset(current.profile_picture);
      }
      fields.profile_picture = req.file.path; // Cloudinary URL
    }

    await User.update(targetId, fields);

    const updated = await User.findById(targetId);
    return res.status(200).json({ success: true, message: "Profile updated.", data: { user: updated } });
  } catch (err) {
    console.error("updateProfile error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};