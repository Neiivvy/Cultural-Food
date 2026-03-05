import Question from "../models/questionModel.js";
import Answer   from "../models/answerModel.js";

// GET /api/questions
export const getQuestions = async (req, res) => {
  try {
    const questions = await Question.getAll();

    const withAnswers = await Promise.all(
      questions.map(async (q) => {
        const answers = await Answer.getByQuestion(q.question_id);
        return { ...q, answers };
      })
    );

    return res.status(200).json({ success: true, data: { questions: withAnswers } });
  } catch (err) {
    console.error("getQuestions error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// POST /api/questions
export const createQuestion = async (req, res) => {
  try {
    const { title, description, culture_id } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: "Title is required." });
    }

    const id = await Question.create({
      userId:     req.user.userId,
      title:      title.trim(),
      description: description?.trim() || null,
      cultureId:  culture_id || null,
    });

    const q = await Question.findById(id);
    return res.status(201).json({
      success: true,
      message: "Question posted.",
      data: { question: { ...q, answers: [], answers_count: 0 } },
    });
  } catch (err) {
    console.error("createQuestion error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// DELETE /api/questions/:id
export const deleteQuestion = async (req, res) => {
  try {
    const q = await Question.findById(req.params.id);
    if (!q) return res.status(404).json({ success: false, message: "Question not found." });
    if (q.user_id !== req.user.userId)
      return res.status(403).json({ success: false, message: "Forbidden." });

    await Question.delete(req.params.id);
    return res.status(200).json({ success: true, message: "Question deleted." });
  } catch (err) {
    console.error("deleteQuestion error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};