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
  getById: async (foodId) => {
    const [[food]] = await db.execute(
      `SELECT f.*, c.culture_name, cc.category_slug, cc.category_name
       FROM foods f
       LEFT JOIN cultures c ON f.culture_id = c.culture_id
       LEFT JOIN culture_categories cc ON c.category_id = cc.category_id
       WHERE f.food_id = ? AND f.status = 'approved'
       LIMIT 1`,
      [foodId]
    );
    if (!food) return null;

    // Fetch attributes, ingredients, tags
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