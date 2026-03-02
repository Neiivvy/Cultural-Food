import db from "../config/db.js";

const User = {
  // Find user by email
  findByEmail: async (email) => {
    const [rows] = await db.execute(
      "SELECT * FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    return rows[0] || null;
  },

  // Find user by ID
  findById: async (userId) => {
    const [rows] = await db.execute(
      "SELECT user_id, name, email, created_at FROM users WHERE user_id = ? LIMIT 1",
      [userId]
    );
    return rows[0] || null;
  },

  // Create new user
  create: async ({ name, email, hashedPassword }) => {
    const [result] = await db.execute(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword]
    );
    return result.insertId;
  },
};

export default User;