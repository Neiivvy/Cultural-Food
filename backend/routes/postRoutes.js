import { Router } from "express";
import {
  getFeed, getPost, createPost, updatePost, deletePost, likePost, unlikePost,
} from "../controllers/postController.js";
import { getComments, addComment } from "../controllers/commentController.js";
import protect from "../middleware/authMiddleware.js";
import { uploadPostMedia } from "../config/cloudinary.js";

// Optional auth — attach user if token present but don't reject if missing
const optionalAuth = (req, _res, next) => {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    import("jsonwebtoken").then(({ default: jwt }) => {
      try {
        req.user = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
      } catch { /* ignore */ }
      next();
    });
  } else {
    next();
  }
};

const router = Router();

router.get("/",       optionalAuth, getFeed);
router.get("/:id",    optionalAuth, getPost);
router.post("/",      protect, uploadPostMedia, createPost);
router.put("/:id",    protect, uploadPostMedia, updatePost);
router.delete("/:id", protect, deletePost);

router.post("/:id/like",   protect, likePost);
router.post("/:id/unlike", protect, unlikePost);

// Comments nested under posts
router.get("/:postId/comments",  getComments);
router.post("/:postId/comments", protect, addComment);

export default router;