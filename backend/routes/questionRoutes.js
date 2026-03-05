import { Router } from "express";
import { getQuestions, createQuestion, deleteQuestion } from "../controllers/questionController.js";
import { addAnswer } from "../controllers/answerController.js";
import protect from "../middleware/authMiddleware.js";

const router = Router();

router.get("/",    getQuestions);
router.post("/",   protect, createQuestion);
router.delete("/:id", protect, deleteQuestion);

router.post("/:id/answers", protect, addAnswer);

export default router;