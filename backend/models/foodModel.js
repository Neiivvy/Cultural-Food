import db from "../config/db.js";

const Food = {

  // Submit a new food (pending)
  create: async ({ food_name, culture_id, location, festival, season, taste,
                   description, cultural_significance, image_url, submitted_by }) => {
    const [result] = await db.execute(
      `INSERT INTO foods
         (food_name, culture_id, location, festival, season, taste,
          description, cultural_significance, image_url, submitted_by, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,'pending')`,
      [food_name, culture_id||null, location||null, festival||null,
       season||null, taste||null, description,
       cultural_significance||null, image_url||null, submitted_by||null]
    );
    return result.insertId;
  },

  // All approved foods (public)
  getApproved: async ({ search, culture_id, season, taste, festival } = {}) => {
    let q = `SELECT f.*, c.culture_name
             FROM foods f
             LEFT JOIN cultures c ON f.culture_id = c.culture_id
             WHERE f.status = 'approved'`;
    const params = [];
    if (search)     { q += ` AND f.food_name LIKE ?`;    params.push(`%${search}%`); }
    if (culture_id) { q += ` AND f.culture_id = ?`;      params.push(culture_id); }
    if (season)     { q += ` AND f.season = ?`;          params.push(season); }
    if (taste)      { q += ` AND f.taste = ?`;           params.push(taste); }
    if (festival)   { q += ` AND f.festival LIKE ?`;     params.push(`%${festival}%`); }
    q += ` ORDER BY f.created_at DESC`;
    const [rows] = await db.execute(q, params);
    return rows;
  },

  // Single approved food by id
  getById: async (foodId) => {
    const [rows] = await db.execute(
      `SELECT f.*, c.culture_name
       FROM foods f
       LEFT JOIN cultures c ON f.culture_id = c.culture_id
       WHERE f.food_id = ? LIMIT 1`,
      [foodId]
    );
    return rows[0] || null;
  },

  // Admin: all foods with submitter info
  getAll: async (status = null) => {
    let q = `SELECT f.*, c.culture_name, u.name AS submitter_name, u.email AS submitter_email
             FROM foods f
             LEFT JOIN cultures c ON f.culture_id = c.culture_id
             LEFT JOIN users u    ON f.submitted_by = u.user_id`;
    const params = [];
    if (status) { q += ` WHERE f.status = ?`; params.push(status); }
    q += ` ORDER BY f.created_at DESC`;
    const [rows] = await db.execute(q, params);
    return rows;
  },

  // Admin: approve
  approve: async (foodId) => {
    await db.execute(
      `UPDATE foods SET status='approved', rejection_note=NULL WHERE food_id=?`,
      [foodId]
    );
  },

  // Admin: reject with optional note
  reject: async (foodId, note = '') => {
    await db.execute(
      `UPDATE foods SET status='rejected', rejection_note=? WHERE food_id=?`,
      [note, foodId]
    );
  },

  // Admin: delete
  delete: async (foodId) => {
    await db.execute(`DELETE FROM foods WHERE food_id=?`, [foodId]);
  },

  countByStatus: async () => {
    const [rows] = await db.execute(
      `SELECT status, COUNT(*) as count FROM foods GROUP BY status`
    );
    return rows;
  },
};

export default Food;