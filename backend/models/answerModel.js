import db from "../config/db.js";

const Answer = {
  getByQuestion: async (questionId) => {
    const [rows] = await db.execute(
      `SELECT a.answer_id, a.answer_text, a.created_at,
              u.user_id, u.name AS author_name, u.profile_picture
       FROM   answers a
       JOIN   users u ON a.user_id = u.user_id
       WHERE  a.question_id = ?
       ORDER  BY a.created_at ASC`,
      [questionId]
    );
    return rows;
  },

  findById: async (answerId) => {
    const [rows] = await db.execute(
      "SELECT * FROM answers WHERE answer_id = ? LIMIT 1",
      [answerId]
    );
    return rows[0] || null;
  },

  create: async ({ questionId, userId, answerText }) => {
    const [result] = await db.execute(
      "INSERT INTO answers (question_id, user_id, answer_text) VALUES (?, ?, ?)",
      [questionId, userId, answerText]
    );
    return result.insertId;
  },

  delete: async (answerId) => {
    await db.execute("DELETE FROM answers WHERE answer_id = ?", [answerId]);
  },
};

export default Answer;