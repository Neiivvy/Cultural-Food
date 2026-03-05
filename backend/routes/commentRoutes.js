import { Router } from "express";
import { updateComment, deleteComment } from "../controllers/commentController.js";
import protect from "../middleware/authMiddleware.js";

const router = Router();

router.put("/:id",    protect, updateComment);
router.delete("/:id", protect, deleteComment);

export default router;