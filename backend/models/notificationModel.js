import db from "../config/db.js";

// notification_type: 'like' | 'comment' | 'answer'
// actor_id: who triggered it, recipient_id: who receives it

const Notification = {
  create: async ({ recipientId, actorId, type, postId = null, questionId = null, message }) => {
    // Don't notify yourself
    if (Number(recipientId) === Number(actorId)) return;
    const [result] = await db.execute(
      `INSERT INTO notifications (recipient_id, actor_id, type, post_id, question_id, message)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [recipientId, actorId, type, postId || null, questionId || null, message]
    );
    return result.insertId;
  },

  getForUser: async (userId) => {
    const [rows] = await db.execute(
      `SELECT n.notification_id, n.type, n.message, n.is_read, n.created_at,
              n.post_id, n.question_id,
              u.name AS actor_name, u.profile_picture AS actor_pic
       FROM   notifications n
       JOIN   users u ON n.actor_id = u.user_id
       WHERE  n.recipient_id = ?
       ORDER  BY n.created_at DESC
       LIMIT  50`,
      [userId]
    );
    return rows;
  },

  markAllRead: async (userId) => {
    await db.execute(
      "UPDATE notifications SET is_read = 1 WHERE recipient_id = ?",
      [userId]
    );
  },

  getUnreadCount: async (userId) => {
    const [rows] = await db.execute(
      "SELECT COUNT(*) AS cnt FROM notifications WHERE recipient_id = ? AND is_read = 0",
      [userId]
    );
    return rows[0].cnt;
  },
};

export default Notification;