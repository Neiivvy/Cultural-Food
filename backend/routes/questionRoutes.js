import { Router } from "express";
import { getQuestions, createQuestion, deleteQuestion, updateQuestion} from "../controllers/questionController.js";
import { addAnswer } from "../controllers/answerController.js";
import protect from "../middleware/authMiddleware.js";

const router = Router();

router.get("/",    getQuestions);
router.post("/",   protect, createQuestion);
router.delete("/:id", protect, deleteQuestion);

router.post("/:id/answers", protect, addAnswer);
router.put("/:id", protect, updateQuestion);

export default router;