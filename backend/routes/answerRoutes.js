import { Router } from "express";
import { deleteAnswer } from "../controllers/answerController.js";
import protect from "../middleware/authMiddleware.js";

const router = Router();

router.delete("/:id", protect, deleteAnswer);

export default router;