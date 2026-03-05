import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { Readable } from "stream";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key:    process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

// ── Custom Multer storage engine using cloudinary upload_stream ─
class CloudinaryStorage {
  constructor(options) {
    this.options = options; // { folder, allowedFormats, transformation? }
  }

  // Called by multer to save the file
  _handleFile(_req, file, cb) {
    const isVideo     = file.mimetype.startsWith("video/");
    const folder      = this.options.folder;
    const uploadOpts  = {
      folder,
      resource_type:   isVideo ? "video" : "image",
      allowed_formats: isVideo
        ? ["mp4", "mov", "webm"]
        : ["jpg", "jpeg", "png", "webp"],
      ...(this.options.transformation && { transformation: this.options.transformation }),
      ...(isVideo && { transformation: [{ duration: "60" }] }),
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOpts,
      (error, result) => {
        if (error) return cb(error);
        // Attach cloudinary info to req.file
        cb(null, {
          fieldname:    file.fieldname,
          originalname: file.originalname,
          mimetype:     file.mimetype,
          path:         result.secure_url,   // this is what we save to DB
          size:         result.bytes,
          filename:     result.public_id,
        });
      }
    );

    // Pipe the incoming file stream into cloudinary
    Readable.from(file.stream).pipe(uploadStream);
  }

  // Called by multer when a file is removed (e.g. on error)
  _removeFile(_req, file, cb) {
    if (file.filename) {
      cloudinary.uploader.destroy(file.filename, cb);
    } else {
      cb(null);
    }
  }
}

// ── File filter helper ──────────────────────────────────────────
const fileFilter = (allowedTypes) => (_req, file, cb) => {
  allowedTypes.test(file.mimetype)
    ? cb(null, true)
    : cb(new Error(`Invalid file type: ${file.mimetype}`), false);
};

// ── Profile picture upload middleware ───────────────────────────
export const uploadProfilePic = multer({
  storage: new CloudinaryStorage({
    folder:         "khana_sanskriti/profiles",
    transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
  }),
  limits:     { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter(/^image\/(jpeg|jpg|png|webp)$/),
}).single("profile_picture");

// ── Post media upload middleware ────────────────────────────────
export const uploadPostMedia = multer({
  storage: new CloudinaryStorage({
    folder: "khana_sanskriti/posts",
  }),
  limits:     { fileSize: 100 * 1024 * 1024 },
  fileFilter: fileFilter(/^(image\/(jpeg|jpg|png|webp)|video\/(mp4|mov|webm))$/),
}).single("media");

// ── Delete an asset from Cloudinary by its URL ──────────────────
export const deleteCloudinaryAsset = async (url) => {
  if (!url) return;
  try {
    const parts    = url.split("/");
    const file     = parts.at(-1).split(".")[0];
    const folder   = parts.at(-2);
    await cloudinary.uploader.destroy(`${folder}/${file}`);
  } catch (err) {
    console.error("Cloudinary delete error:", err.message);
  }
};

export default cloudinary;