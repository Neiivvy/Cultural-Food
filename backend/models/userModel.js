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
      `SELECT user_id, name, email, bio, profile_picture, created_at 
     FROM users 
     WHERE user_id = ? LIMIT 1`,
      [userId]
    );
    return rows[0] || null;
  },

  //to update the user
  updateProfile: async ({ userId, bio, profilePicture }) => {
  const [result] = await db.execute(
    `UPDATE users 
     SET bio = ?, profile_picture = ?
     WHERE user_id = ?`,
    [bio, profilePicture, userId]
  );
  return result;
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