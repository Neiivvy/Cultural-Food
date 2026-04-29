import db from "../config/db.js";

const User = {
  findByEmail: async (email) => {
    const [rows] = await db.execute(
      "SELECT * FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    return rows[0] || null;
  },

  findById: async (userId) => {
    const [rows] = await db.execute(
      `SELECT user_id, name, email, bio, profile_picture, is_public, created_at
       FROM users WHERE user_id = ? LIMIT 1`,
      [userId]
    );
    return rows[0] || null;
  },

  create: async ({ name, email, hashedPassword }) => {
    const [result] = await db.execute(
      "INSERT INTO users (name, email, password, is_public) VALUES (?, ?, ?, TRUE)",
      [name, email, hashedPassword]
    );
    return result.insertId;
  },

  update: async (userId, fields) => {
    const allowed = ["name", "bio", "profile_picture", "is_public"];
    const sets    = [];
    const values  = [];
    for (const key of allowed) {
      if (fields[key] !== undefined) {
        sets.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }
    if (!sets.length) return false;
    values.push(userId);
    await db.execute(`UPDATE users SET ${sets.join(", ")} WHERE user_id = ?`, values);
    return true;
  },

  // Search public users by name or email
  searchPublic: async (query) => {
    const like = `%${query}%`;
    const [rows] = await db.execute(
      `SELECT user_id, name, email, bio, profile_picture, is_public, created_at
       FROM users
       WHERE name LIKE ? OR email LIKE ?
       LIMIT 10`,
      [like, like]
    );
    return rows;
  },

  // Top engaging public users — uses post_likes (correct table name)
  getTopUsers: async (limit = 6) => {
    const [rows] = await db.execute(
      `SELECT
         u.user_id,
         u.name,
         u.profile_picture,
         u.bio,
         COUNT(DISTINCT CASE WHEN p.post_type = 'recipe' THEN p.post_id END) AS recipe_count,
         COUNT(DISTINCT CASE WHEN p.post_type = 'reel'   THEN p.post_id END) AS reel_count,
         COUNT(DISTINCT q.question_id) AS question_count,
         COUNT(DISTINCT a.answer_id)   AS answer_count,
         COALESCE((
           SELECT COUNT(*) FROM post_likes pl
           JOIN posts lp ON pl.post_id = lp.post_id
           WHERE lp.user_id = u.user_id
         ), 0) AS total_likes,
         COALESCE((
           SELECT COUNT(*) FROM comments cm
           JOIN posts cp ON cm.post_id = cp.post_id
           WHERE cp.user_id = u.user_id
         ), 0) AS total_comments,
         COUNT(DISTINCT a2.answer_id) AS total_answers_received
       FROM users u
       LEFT JOIN posts     p  ON p.user_id = u.user_id
       LEFT JOIN questions q  ON q.user_id = u.user_id
       LEFT JOIN answers   a  ON a.user_id = u.user_id
       LEFT JOIN answers   a2 ON a2.question_id IN (
                                   SELECT question_id FROM questions WHERE user_id = u.user_id
                                 )
       WHERE u.is_public = TRUE
       GROUP BY u.user_id, u.name, u.profile_picture, u.bio
       HAVING
         COUNT(DISTINCT CASE WHEN p.post_type = 'recipe' THEN p.post_id END) >= 1
         AND COUNT(DISTINCT CASE WHEN p.post_type = 'reel' THEN p.post_id END) >= 1
         AND COUNT(DISTINCT q.question_id) >= 1
         AND COUNT(DISTINCT a.answer_id)   >= 1
       ORDER BY (
         COALESCE((SELECT COUNT(*) FROM post_likes pl JOIN posts lp ON pl.post_id = lp.post_id WHERE lp.user_id = u.user_id), 0)
         + COALESCE((SELECT COUNT(*) FROM comments cm JOIN posts cp ON cm.post_id = cp.post_id WHERE cp.user_id = u.user_id), 0)
         + COUNT(DISTINCT a2.answer_id)
       ) DESC
       LIMIT ?`,
      [limit]
    );
    return rows;
  },

  // Contributors: approved food contributions (public or private — all show here)
  getContributors: async (limit = 12) => {
    const [rows] = await db.execute(
      `SELECT
         u.user_id,
         u.name,
         u.profile_picture,
         u.is_public,
         f.food_id,
         f.food_name,
         f.image_url AS food_image
       FROM foods f
       JOIN users u ON f.submitted_by = u.user_id
       WHERE f.status = 'approved'
       ORDER BY f.created_at DESC
       LIMIT ?`,
      [limit]
    );
    return rows;
  },
};

export default User;