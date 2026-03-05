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
      `SELECT user_id, name, email, bio, profile_picture, created_at
       FROM users WHERE user_id = ? LIMIT 1`,
      [userId]
    );
    return rows[0] || null;
  },

  create: async ({ name, email, hashedPassword }) => {
    const [result] = await db.execute(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword]
    );
    return result.insertId;
  },

  update: async (userId, fields) => {
    // fields: { name?, bio?, profile_picture? }
    const allowed = ["name", "bio", "profile_picture"];
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
    await db.execute(
      `UPDATE users SET ${sets.join(", ")} WHERE user_id = ?`,
      values
    );
    return true;
  },
};

export default User;