import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import protect from "../middleware/authMiddleware.js";
import adminOnly from "../middleware/adminMiddleware.js";
import {
  getApprovedFoods, getFoodById, submitFood,
} from "../controllers/foodController.js";

const router = Router();

// ── Food image upload middleware ───────────────────────────────
class CloudinaryStorage {
  _handleFile(_req, file, cb) {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "khana_sanskriti/foods", allowed_formats: ["jpg","jpeg","png","webp"] },
      (err, result) => err ? cb(err) : cb(null, { path: result.secure_url, filename: result.public_id })
    );
    Readable.from(file.stream).pipe(stream);
  }
  _removeFile(_req, file, cb) {
    file.filename ? cloudinary.uploader.destroy(file.filename, cb) : cb(null);
  }
}
const uploadFoodImage = multer({
  storage: new CloudinaryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    /^image\/(jpeg|jpg|png|webp)$/.test(file.mimetype) ? cb(null,true) : cb(new Error("Images only"))
}).single("image");

// ── Public ────────────────────────────────────────────────────
router.get("/",    getApprovedFoods);
router.get("/:id", getFoodById);

// ── Authenticated: submit food ────────────────────────────────
router.post("/", protect, (req, res, next) => {
  uploadFoodImage(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    next();
  });
}, submitFood);

export default router;