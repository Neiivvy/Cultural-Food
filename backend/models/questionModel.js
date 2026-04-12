import db from "../config/db.js";

const Question = {
  getAll: async () => {
    const [rows] = await db.execute(
      `SELECT q.question_id, q.title, q.description, q.culture_id, q.created_at,
              u.user_id, u.name AS author_name, u.profile_picture,
              c.culture_name,
              COUNT(DISTINCT a.answer_id) AS answers_count
       FROM   questions q
       JOIN   users u ON q.user_id = u.user_id
       LEFT JOIN cultures c ON q.culture_id = c.culture_id
       LEFT JOIN answers a  ON q.question_id = a.question_id
       GROUP BY q.question_id, q.title, q.description, q.culture_id, q.created_at,
                u.user_id, u.name, u.profile_picture, c.culture_name
       ORDER BY COUNT(DISTINCT a.answer_id) DESC, q.created_at DESC`
    );
    return rows;
  },

  findById: async (questionId) => {
    const [rows] = await db.execute(
      "SELECT * FROM questions WHERE question_id = ? LIMIT 1",
      [questionId]
    );
    return rows[0] || null;
  },

  create: async ({ userId, title, description, cultureId }) => {
    const [result] = await db.execute(
      "INSERT INTO questions (user_id, title, description, culture_id) VALUES (?, ?, ?, ?)",
      [userId, title, description || null, cultureId || null]
    );
    return result.insertId;
  },

  delete: async (questionId) => {
    await db.execute("DELETE FROM questions WHERE question_id = ?", [questionId]);
  },

  update: async (questionId, userId, { title, description }) => {
    const [rows] = await db.execute(
      "SELECT user_id FROM questions WHERE question_id = ? LIMIT 1",
      [questionId]
    );
    if (!rows[0]) return { notFound: true };
    if (String(rows[0].user_id) !== String(userId)) return { forbidden: true };

    await db.execute(
      "UPDATE questions SET title = ?, description = ? WHERE question_id = ?",
      [title, description || null, questionId]
    );
    return { ok: true };
  },
};

export default Question;