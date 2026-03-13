import Answer        from "../models/answerModel.js";
import Question      from "../models/questionModel.js";
import Notification  from "../models/notificationModel.js";
import db            from "../config/db.js";

// POST /api/questions/:id/answers
export const addAnswer = async (req, res) => {
  try {
    const q = await Question.findById(req.params.id);
    if (!q) return res.status(404).json({ success: false, message: "Question not found." });

    const { answer_text } = req.body;
    if (!answer_text?.trim()) {
      return res.status(400).json({ success: false, message: "Answer text is required." });
    }

    const answerId = await Answer.create({
      questionId: Number(req.params.id),
      userId:     req.user.userId,
      answerText: answer_text.trim(),
    });

    const answer = await Answer.findById(answerId);

    // Notify question owner
    const [actor] = await db.execute("SELECT name FROM users WHERE user_id = ? LIMIT 1", [req.user.userId]);
    const name = actor[0]?.name || "Someone";
    await Notification.create({
      recipientId: q.user_id,
      actorId:     req.user.userId,
      type:        "answer",
      questionId:  Number(req.params.id),
      message:     `${name} answered your question: "${q.title.slice(0, 40)}"`,
    });

    return res.status(201).json({ success: true, message: "Answer posted.", data: { answer } });
  } catch (err) {
    console.error("addAnswer error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// DELETE /api/answers/:id
export const deleteAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) return res.status(404).json({ success: false, message: "Answer not found." });
    if (answer.user_id !== req.user.userId) return res.status(403).json({ success: false, message: "Forbidden." });

    await Answer.delete(req.params.id);
    return res.status(200).json({ success: true, message: "Answer deleted." });
  } catch (err) {
    console.error("deleteAnswer error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};