import db from "../config/db.js";

const Food = {

  // ── Submit a new food (pending) ────────────────────────────────
  create: async ({ food_name, food_name_nepali, culture_id, location,
                   description, cultural_significance, preparation_summary,
                   image_url, submitted_by }) => {
    const [result] = await db.execute(
      `INSERT INTO foods
         (food_name, food_name_nepali, culture_id, location, description,
          cultural_significance, preparation_summary, image_url, submitted_by, status)
       VALUES (?,?,?,?,?,?,?,?,?,'pending')`,
      [food_name, food_name_nepali||null, culture_id||null, location||null,
       description, cultural_significance||null, preparation_summary||null,
       image_url||null, submitted_by||null]
    );
    return result.insertId;
  },

  // ── All approved foods with attribute-based filters ────────────
  // Filters come from food_attributes table (taste, season, festival, meal_type, occasion, ingredient)
  // category_slug filters via culture_categories → cultures join
  getApproved: async ({
    search, culture_id, category_slug,
    taste, season, festival, meal_type, occasion, ingredient,
    veg_status
  } = {}) => {

    // Build attribute filters as EXISTS subqueries
    const attrFilters = [];
    const params      = [];

    const addAttr = (type, value) => {
      attrFilters.push(
        `EXISTS (SELECT 1 FROM food_attributes fa
                 WHERE fa.food_id = f.food_id
                   AND fa.attribute_type = ?
                   AND fa.attribute_value = ?)`
      );
      params.push(type, value);
    };

    if (taste)     addAttr('taste',     taste);
    if (season)    addAttr('season',    season);
    if (festival)  addAttr('festival',  festival);
    if (meal_type) addAttr('meal_type', meal_type);
    if (occasion)  addAttr('occasion',  occasion);
    if (ingredient)addAttr('ingredient',ingredient);

    let q = `
      SELECT
        f.food_id, f.food_name, f.food_name_nepali,
        f.culture_id, f.location, f.description,
        f.cultural_significance, f.preparation_summary,
        f.image_url, f.veg_status, f.created_at,
        c.culture_name,
        cc.category_slug, cc.category_name
      FROM foods f
      LEFT JOIN cultures c          ON f.culture_id = c.culture_id
      LEFT JOIN culture_categories cc ON c.category_id = cc.category_id
      WHERE f.status = 'approved'
    `;

    // Category filter (via slug)
    if (category_slug) {
      q += ` AND cc.category_slug = ?`;
      params.push(category_slug);
    }

    // Specific culture
    if (culture_id) {
      q += ` AND f.culture_id = ?`;
      params.push(culture_id);
    }

    // Text search
    if (search) {
      q += ` AND (f.food_name LIKE ? OR f.food_name_nepali LIKE ? OR f.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Veg status
    if (veg_status) {
      q += ` AND f.veg_status = ?`;
      params.push(veg_status);
    }

    // Attribute filters
    if (attrFilters.length) {
      q += ` AND ` + attrFilters.join(` AND `);
    }

    q += ` ORDER BY f.food_id ASC`;

    const [rows] = await db.execute(q, params);
    return rows;
  },

  // ── Single food with all attributes ───────────────────────────
 // ONLY getById changes — replace this function in your foodModel.js

  getById: async (foodId) => {
    const [[food]] = await db.execute(
      `SELECT f.*,
              c.culture_name,
              cc.category_slug, cc.category_name,
              u.name            AS contributor_name,
              u.profile_picture AS contributor_picture,
              u.user_id         AS contributor_id
       FROM foods f
       LEFT JOIN cultures          c  ON f.culture_id  = c.culture_id
       LEFT JOIN culture_categories cc ON c.category_id = cc.category_id
       LEFT JOIN users              u  ON f.submitted_by = u.user_id
       WHERE f.food_id = ? AND f.status = 'approved'
       LIMIT 1`,
      [foodId]
    );
    if (!food) return null;

    const [attrs] = await db.execute(
      `SELECT attribute_type, attribute_value FROM food_attributes WHERE food_id = ?`,
      [foodId]
    );
    const [ings] = await db.execute(
      `SELECT ingredient_name FROM food_ingredients WHERE food_id = ?`,
      [foodId]
    );
    const [tags] = await db.execute(
      `SELECT tag FROM food_tags WHERE food_id = ?`,
      [foodId]
    );

    return {
      ...food,
      attributes:  attrs,
      ingredients: ings.map(r => r.ingredient_name),
      tags:        tags.map(r => r.tag),
    };
  },

  // ── Admin: all foods ──────────────────────────────────────────
  getAll: async (status = null) => {
    let q = `
      SELECT f.*, c.culture_name, cc.category_name,
             u.name AS submitter_name, u.email AS submitter_email
      FROM foods f
      LEFT JOIN cultures c ON f.culture_id = c.culture_id
      LEFT JOIN culture_categories cc ON c.category_id = cc.category_id
      LEFT JOIN users u ON f.submitted_by = u.user_id
    `;
    const params = [];
    if (status) { q += ` WHERE f.status = ?`; params.push(status); }
    q += ` ORDER BY f.created_at DESC`;
    const [rows] = await db.execute(q, params);
    return rows;
  },

  approve: async (foodId) => {
    await db.execute(`UPDATE foods SET status='approved', rejection_note=NULL WHERE food_id=?`, [foodId]);
  },

  reject: async (foodId, note = '') => {
    await db.execute(`UPDATE foods SET status='rejected', rejection_note=? WHERE food_id=?`, [note, foodId]);
  },

  delete: async (foodId) => {
    await db.execute(`DELETE FROM foods WHERE food_id=?`, [foodId]);
  },

  countByStatus: async () => {
    const [rows] = await db.execute(`SELECT status, COUNT(*) as count FROM foods GROUP BY status`);
    return rows;
  },

  // ── Content-Based Recommendation Algorithm ────────────────────
  // Scores every other approved food against the target food using:
  //   Taste match    → +3 per matching value  (strongest flavour signal)
  //   Culture match  → +2 if same community   (shared culinary tradition)
  //   Festival match → +2 per matching value  (shared ritual context)
  //   Season match   → +1 per matching value  (seasonal availability)
  //   Occasion match → +1 per matching value  (use-case similarity)
  // Returns top 6 foods with similarity_score > 0, ordered descending.
  getRecommendations: async (foodId) => {
    // Step 1: fetch the target food's culture_id
    const [[target]] = await db.execute(
      `SELECT culture_id FROM foods WHERE food_id = ? AND status = 'approved' LIMIT 1`,
      [foodId]
    );
    if (!target) return [];

    const targetCultureId = target.culture_id;

    // Step 2: run the scoring query
    // COALESCE handles foods with no matching attribute rows (returns 0 not NULL)
    const [rows] = await db.execute(
      `SELECT
        f.food_id,
        f.food_name,
        f.food_name_nepali,
        f.image_url,
        f.veg_status,
        c.culture_name,
        (
          COALESCE((
            SELECT COUNT(*) * 3
            FROM food_attributes fa_t
            WHERE fa_t.food_id = f.food_id
              AND fa_t.attribute_type = 'taste'
              AND fa_t.attribute_value IN (
                SELECT attribute_value FROM food_attributes
                WHERE food_id = ? AND attribute_type = 'taste'
              )
          ), 0)
          +
          (CASE WHEN f.culture_id = ? THEN 2 ELSE 0 END)
          +
          COALESCE((
            SELECT COUNT(*) * 2
            FROM food_attributes fa_f
            WHERE fa_f.food_id = f.food_id
              AND fa_f.attribute_type = 'festival'
              AND fa_f.attribute_value IN (
                SELECT attribute_value FROM food_attributes
                WHERE food_id = ? AND attribute_type = 'festival'
              )
          ), 0)
          +
          COALESCE((
            SELECT COUNT(*) * 1
            FROM food_attributes fa_s
            WHERE fa_s.food_id = f.food_id
              AND fa_s.attribute_type = 'season'
              AND fa_s.attribute_value IN (
                SELECT attribute_value FROM food_attributes
                WHERE food_id = ? AND attribute_type = 'season'
              )
          ), 0)
          +
          COALESCE((
            SELECT COUNT(*) * 1
            FROM food_attributes fa_o
            WHERE fa_o.food_id = f.food_id
              AND fa_o.attribute_type = 'occasion'
              AND fa_o.attribute_value IN (
                SELECT attribute_value FROM food_attributes
                WHERE food_id = ? AND attribute_type = 'occasion'
              )
          ), 0)
        ) AS similarity_score
      FROM foods f
      LEFT JOIN cultures c ON f.culture_id = c.culture_id
      WHERE f.food_id  != ?
        AND f.status    = 'approved'
      HAVING similarity_score > 0
      ORDER BY similarity_score DESC
      LIMIT 6`,
      [foodId, targetCultureId, foodId, foodId, foodId, foodId]
    );

    return rows;
  },

  // ── Distinct filter values for a category (for filter chips) ──
  getFilterOptions: async (category_slug) => {
    let categoryFilter = '';
    const params = [];
    if (category_slug && category_slug !== 'all') {
      categoryFilter = `AND cc.category_slug = ?`;
      params.push(category_slug);
    }

    const [attrs] = await db.execute(`
      SELECT DISTINCT fa.attribute_type, fa.attribute_value
      FROM food_attributes fa
      JOIN foods f ON fa.food_id = f.food_id
      JOIN cultures c ON f.culture_id = c.culture_id
      JOIN culture_categories cc ON c.category_id = cc.category_id
      WHERE f.status = 'approved' ${categoryFilter}
      ORDER BY fa.attribute_type, fa.attribute_value
    `, params);

    // Group by type
    const options = {};
    attrs.forEach(({ attribute_type, attribute_value }) => {
      if (!options[attribute_type]) options[attribute_type] = [];
      options[attribute_type].push(attribute_value);
    });
    return options;
  },
};

export default Food;