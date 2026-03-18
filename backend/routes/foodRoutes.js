import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import protect from "../middleware/authMiddleware.js";
import {
  getApprovedFoods, getFoodById, submitFood, getFilterOptions
} from "../controllers/foodController.js";

const router = Router();

// Food image upload middleware
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

// ── Public routes ─────────────────────────────────────────────
router.get("/filters", getFilterOptions);   // MUST be before /:id
router.get("/",        getApprovedFoods);
router.get("/:id",     getFoodById);

// ── Auth: submit food ─────────────────────────────────────────
router.post("/", protect, (req, res, next) => {
  uploadFoodImage(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    next();
  });
}, submitFood);

export default router;