import db from "../config/db.js";

const Post = {
  // Paginated feed with author info + likes + comment count
  getFeed: async ({ limit = 20, offset = 0, cultureId = null, type = null, userId = null } = {}) => {
    const where  = [];
    const params = [];

    if (cultureId) { where.push("p.culture_id = ?"); params.push(cultureId); }
    if (type)      { where.push("p.post_type  = ?"); params.push(type); }
    if (userId)    { where.push("p.user_id    = ?"); params.push(userId); }

    const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows] = await db.execute(
      `SELECT p.post_id, p.title, p.description, p.media_url, p.post_type, p.created_at,
              u.user_id AS author_id, u.name AS author_name, u.profile_picture,
              c.culture_name,
              COUNT(DISTINCT pl.like_id)   AS likes_count,
              COUNT(DISTINCT cm.comment_id) AS comments_count
       FROM   posts p
       JOIN   users u   ON p.user_id    = u.user_id
       LEFT JOIN cultures c   ON p.culture_id = c.culture_id
       LEFT JOIN post_likes pl ON p.post_id   = pl.post_id
       LEFT JOIN comments   cm ON p.post_id   = cm.post_id
       ${whereSQL}
       GROUP BY p.post_id, p.title, p.description, p.media_url, p.post_type, p.created_at,
                u.user_id, u.name, u.profile_picture, c.culture_name
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    return rows;
  },

  // Single post detail
  findById: async (postId) => {
    const [rows] = await db.execute(
      `SELECT p.post_id, p.title, p.description, p.media_url, p.post_type, p.created_at,
              u.user_id AS author_id, u.name AS author_name, u.profile_picture,
              c.culture_name,
              COUNT(DISTINCT pl.like_id) AS likes_count
       FROM   posts p
       JOIN   users u   ON p.user_id    = u.user_id
       LEFT JOIN cultures c   ON p.culture_id = c.culture_id
       LEFT JOIN post_likes pl ON p.post_id   = pl.post_id
       WHERE  p.post_id = ?
       GROUP BY p.post_id, p.title, p.description, p.media_url, p.post_type, p.created_at,
                u.user_id, u.name, u.profile_picture, c.culture_name`,
      [postId]
    );
    return rows[0] || null;
  },

  create: async (conn, { userId, title, description, cultureId, postType, mediaUrl }) => {
    const [result] = await conn.execute(
      `INSERT INTO posts (user_id, title, description, culture_id, post_type, media_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, title, description || null, cultureId || null, postType, mediaUrl || null]
    );
    return result.insertId;
  },

  update: async (postId, fields) => {
    const allowed = ["title", "description", "culture_id", "media_url"];
    const sets    = [];
    const values  = [];

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        sets.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }
    if (!sets.length) return false;

    values.push(postId);
    await db.execute(
      `UPDATE posts SET ${sets.join(", ")} WHERE post_id = ?`,
      values
    );
    return true;
  },

  delete: async (postId) => {
    await db.execute("DELETE FROM posts WHERE post_id = ?", [postId]);
  },

  getOwner: async (postId) => {
    const [rows] = await db.execute(
      "SELECT user_id FROM posts WHERE post_id = ? LIMIT 1",
      [postId]
    );
    return rows[0]?.user_id ?? null;
  },

  // ── Ingredients ──────────────────────────────────────────────
  getIngredients: async (postId) => {
    const [rows] = await db.execute(
      "SELECT ingredient_id, ingredient_text FROM ingredients WHERE post_id = ? ORDER BY ingredient_id",
      [postId]
    );
    return rows;
  },

  setIngredients: async (conn, postId, items) => {
    await conn.execute("DELETE FROM ingredients WHERE post_id = ?", [postId]);
    if (!items?.length) return;
    const values = items.filter(t => t?.trim()).map(t => [postId, t.trim()]);
    if (!values.length) return;
    await conn.query(
      "INSERT INTO ingredients (post_id, ingredient_text) VALUES ?",
      [values]
    );
  },

  // ── Steps ────────────────────────────────────────────────────
  getSteps: async (postId) => {
    const [rows] = await db.execute(
      "SELECT step_id, step_number, step_description FROM steps WHERE post_id = ? ORDER BY step_number",
      [postId]
    );
    return rows;
  },

  setSteps: async (conn, postId, items) => {
    await conn.execute("DELETE FROM steps WHERE post_id = ?", [postId]);
    if (!items?.length) return;
    const values = items
      .filter(d => d?.trim())
      .map((desc, idx) => [postId, idx + 1, desc.trim()]);
    if (!values.length) return;
    await conn.query(
      "INSERT INTO steps (post_id, step_number, step_description) VALUES ?",
      [values]
    );
  },

  // ── Likes ────────────────────────────────────────────────────
  isLikedBy: async (postId, userId) => {
    const [rows] = await db.execute(
      "SELECT like_id FROM post_likes WHERE post_id = ? AND user_id = ? LIMIT 1",
      [postId, userId]
    );
    return rows.length > 0;
  },

  like: async (postId, userId) => {
    await db.execute(
      "INSERT IGNORE INTO post_likes (post_id, user_id) VALUES (?, ?)",
      [postId, userId]
    );
  },

  unlike: async (postId, userId) => {
    await db.execute(
      "DELETE FROM post_likes WHERE post_id = ? AND user_id = ?",
      [postId, userId]
    );
  },

  getLikesCount: async (postId) => {
    const [rows] = await db.execute(
      "SELECT COUNT(*) AS cnt FROM post_likes WHERE post_id = ?",
      [postId]
    );
    return rows[0].cnt;
  },
};

export default Post;