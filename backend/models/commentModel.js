import db from "../config/db.js";

const Comment = {
  getByPost: async (postId) => {
    const [rows] = await db.execute(
      `SELECT c.comment_id, c.comment_text, c.parent_comment_id, c.created_at,
              u.user_id, u.name AS author_name, u.profile_picture
       FROM   comments c
       JOIN   users u ON c.user_id = u.user_id
       WHERE  c.post_id = ?
       ORDER  BY c.created_at ASC`,
      [postId]
    );
    return rows;
  },

  create: async ({ userId, postId, commentText, parentCommentId = null }) => {
    const [result] = await db.execute(
      `INSERT INTO comments (user_id, post_id, parent_comment_id, comment_text)
       VALUES (?, ?, ?, ?)`,
      [userId, postId, parentCommentId, commentText]
    );
    return result.insertId;
  },

  findById: async (commentId) => {
    const [rows] = await db.execute(
      "SELECT * FROM comments WHERE comment_id = ? LIMIT 1",
      [commentId]
    );
    return rows[0] || null;
  },

  update: async (commentId, commentText) => {
    await db.execute(
      "UPDATE comments SET comment_text = ? WHERE comment_id = ?",
      [commentText, commentId]
    );
  },

  delete: async (commentId) => {
    await db.execute("DELETE FROM comments WHERE comment_id = ?", [commentId]);
  },
};

export default Comment;