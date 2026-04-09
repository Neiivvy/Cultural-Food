import db from "../config/db.js";

const Report = {
  // Only inserts the column that actually has a value — avoids NOT NULL constraint errors
  create: async ({ userId, postId, questionId, reason }) => {
    let sql, params;
    if (postId) {
      sql    = `INSERT INTO reports (user_id, post_id, reason, status) VALUES (?, ?, ?, 'pending')`;
      params = [userId, Number(postId), reason];
    } else {
      sql    = `INSERT INTO reports (user_id, question_id, reason, status) VALUES (?, ?, ?, 'pending')`;
      params = [userId, Number(questionId), reason];
    }
    const [result] = await db.execute(sql, params);
    return result.insertId;
  },

  getAll: async (status = "pending") => {
    const [rows] = await db.execute(
      `SELECT r.report_id, r.reason, r.status, r.created_at,
              r.post_id, r.question_id,
              u.name  AS reporter_name,
              u.email AS reporter_email,
              u.user_id AS reporter_id,
              p.title    AS post_title,
              p.post_type,
              p.user_id  AS post_owner_id,
              q.title    AS question_title,
              q.user_id  AS question_owner_id,
              owner.name  AS content_owner_name,
              owner.email AS content_owner_email
       FROM reports r
       JOIN  users u     ON r.user_id     = u.user_id
       LEFT JOIN posts     p ON r.post_id     = p.post_id
       LEFT JOIN questions q ON r.question_id = q.question_id
       LEFT JOIN users owner ON owner.user_id  = COALESCE(p.user_id, q.user_id)
       WHERE r.status = ?
       ORDER BY r.created_at DESC`,
      [status]
    );
    return rows;
  },

  findById: async (reportId) => {
    const [rows] = await db.execute(
      `SELECT r.*,
              u.name    AS reporter_name,
              u.user_id AS reporter_id,
              p.title   AS post_title,
              p.user_id AS post_owner_id,
              q.title   AS question_title,
              q.user_id AS question_owner_id
       FROM reports r
       JOIN  users u     ON r.user_id     = u.user_id
       LEFT JOIN posts     p ON r.post_id     = p.post_id
       LEFT JOIN questions q ON r.question_id = q.question_id
       WHERE r.report_id = ? LIMIT 1`,
      [reportId]
    );
    return rows[0] || null;
  },

  updateStatus: async (reportId, status) => {
    await db.execute(
      "UPDATE reports SET status = ? WHERE report_id = ?",
      [status, reportId]
    );
  },

  alreadyReported: async (userId, postId, questionId) => {
    let sql, params;
    if (postId) {
      sql    = "SELECT report_id FROM reports WHERE user_id = ? AND post_id = ? AND status = 'pending' LIMIT 1";
      params = [userId, postId];
    } else {
      sql    = "SELECT report_id FROM reports WHERE user_id = ? AND question_id = ? AND status = 'pending' LIMIT 1";
      params = [userId, questionId];
    }
    const [rows] = await db.execute(sql, params);
    return rows.length > 0;
  },
};

export default Report;