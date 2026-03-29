import db from "../config/db.js";

const Contribution = {

  // ── User: create a new submission ──────────────────────────
  create: async ({ userId, foodName, foodNameNepali, cultureId, location,
                   description, culturalSignificance, preparationSummary,
                   imageUrl, vegStatus }) => {
    const [result] = await db.execute(
      `INSERT INTO food_contributions
         (user_id, food_name, food_name_nepali, culture_id, location,
          description, cultural_significance, preparation_summary,
          image_url, veg_status, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [userId, foodName, foodNameNepali || null, cultureId || null,
       location || null, description, culturalSignificance || null,
       preparationSummary || null, imageUrl || null, vegStatus || 'veg']
    );
    return result.insertId;
  },

  // ── Add attributes for a contribution ──────────────────────
  addAttributes: async (contributionId, attributes) => {
    // attributes = [{ type, value }, ...]
    if (!attributes || attributes.length === 0) return;
    const values = attributes.map(a => [contributionId, a.type, a.value]);
    await db.query(
      `INSERT INTO contribution_attributes (contribution_id, attribute_type, attribute_value) VALUES ?`,
      [values]
    );
  },

  // ── Add ingredients for a contribution ─────────────────────
  addIngredients: async (contributionId, ingredients) => {
    // ingredients = ['Rice flour', 'Jaggery', ...]
    if (!ingredients || ingredients.length === 0) return;
    const values = ingredients.filter(i => i.trim()).map(i => [contributionId, i.trim()]);
    if (values.length === 0) return;
    await db.query(
      `INSERT INTO contribution_ingredients (contribution_id, ingredient_name) VALUES ?`,
      [values]
    );
  },

  // ── User: get all their own submissions ────────────────────
  getByUser: async (userId) => {
    const [rows] = await db.execute(
      `SELECT fc.*, c.culture_name
       FROM   food_contributions fc
       LEFT JOIN cultures c ON fc.culture_id = c.culture_id
       WHERE  fc.user_id = ?
       ORDER  BY fc.created_at DESC`,
      [userId]
    );
    return rows;
  },

  // ── Admin: get all submissions (with submitter info) ───────
  getAll: async (status = null) => {
    let where = '';
    const params = [];
    if (status) { where = 'WHERE fc.status = ?'; params.push(status); }

    const [rows] = await db.execute(
      `SELECT fc.*,
              c.culture_name,
              u.name  AS submitter_name,
              u.email AS submitter_email,
              u.profile_picture AS submitter_picture
       FROM   food_contributions fc
       LEFT JOIN cultures c ON fc.culture_id = c.culture_id
       LEFT JOIN users    u ON fc.user_id    = u.user_id
       ${where}
       ORDER  BY fc.created_at DESC`,
      params
    );
    return rows;
  },

  // ── Get one contribution with attributes + ingredients ─────
  getById: async (contributionId) => {
    const [[contrib]] = await db.execute(
      `SELECT fc.*,
              c.culture_name,
              u.name  AS submitter_name,
              u.email AS submitter_email,
              u.profile_picture AS submitter_picture
       FROM   food_contributions fc
       LEFT JOIN cultures c ON fc.culture_id = c.culture_id
       LEFT JOIN users    u ON fc.user_id    = u.user_id
       WHERE  fc.contribution_id = ?`,
      [contributionId]
    );
    if (!contrib) return null;

    const [attrs] = await db.execute(
      `SELECT attribute_type, attribute_value
       FROM   contribution_attributes WHERE contribution_id = ?`,
      [contributionId]
    );
    const [ings] = await db.execute(
      `SELECT ingredient_name
       FROM   contribution_ingredients WHERE contribution_id = ?`,
      [contributionId]
    );
    return { ...contrib, attributes: attrs, ingredients: ings.map(i => i.ingredient_name) };
  },

  // ── Admin: update contribution fields before approving ─────
  update: async (contributionId, fields) => {
    const allowed = ['food_name','food_name_nepali','culture_id','location',
                     'description','cultural_significance','preparation_summary',
                     'image_url','veg_status'];
    const sets = [], values = [];
    for (const key of allowed) {
      if (fields[key] !== undefined) { sets.push(`${key} = ?`); values.push(fields[key]); }
    }
    if (!sets.length) return;
    values.push(contributionId);
    await db.execute(
      `UPDATE food_contributions SET ${sets.join(', ')} WHERE contribution_id = ?`,
      values
    );

    // replace attributes if provided
    if (fields.attributes) {
      await db.execute(`DELETE FROM contribution_attributes WHERE contribution_id = ?`, [contributionId]);
      await Contribution.addAttributes(contributionId, fields.attributes);
    }
    // replace ingredients if provided
    if (fields.ingredients) {
      await db.execute(`DELETE FROM contribution_ingredients WHERE contribution_id = ?`, [contributionId]);
      await Contribution.addIngredients(contributionId, fields.ingredients);
    }
  },

  // ── Admin: approve — copies data into foods table ──────────
  approve: async (contributionId, adminId, adminMessage) => {
    const contrib = await Contribution.getById(contributionId);
    if (!contrib) throw new Error('Contribution not found');

    // Insert into foods
    const [result] = await db.execute(
      `INSERT INTO foods
         (food_name, food_name_nepali, culture_id, location, description,
          cultural_significance, preparation_summary, image_url, veg_status,
          status, submitted_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?)`,
      [contrib.food_name, contrib.food_name_nepali, contrib.culture_id,
       contrib.location, contrib.description, contrib.cultural_significance,
       contrib.preparation_summary, contrib.image_url, contrib.veg_status,
       contrib.user_id]
    );
    const newFoodId = result.insertId;

    // Copy attributes into food_attributes
    if (contrib.attributes.length > 0) {
      const attrValues = contrib.attributes.map(a => [newFoodId, a.attribute_type, a.attribute_value]);
      await db.query(
        `INSERT INTO food_attributes (food_id, attribute_type, attribute_value) VALUES ?`,
        [attrValues]
      );
    }

    // Copy ingredients into food_ingredients
    if (contrib.ingredients.length > 0) {
      const ingValues = contrib.ingredients.map(i => [newFoodId, i]);
      await db.query(
        `INSERT INTO food_ingredients (food_id, ingredient_name) VALUES ?`,
        [ingValues]
      );
    }

    // Mark contribution as approved
    await db.execute(
      `UPDATE food_contributions
       SET status='approved', admin_message=?, reviewed_by=?, reviewed_at=NOW()
       WHERE contribution_id=?`,
      [adminMessage || 'Your food has been approved and is now live!', adminId, contributionId]
    );

    // Send notification to the submitter
    await db.execute(
      `INSERT INTO notifications
         (recipient_id, actor_id, type, message, contribution_id, is_read)
       VALUES (?, ?, 'contribution_approved', ?, ?, 0)`,
      [contrib.user_id, adminId,
       adminMessage || `Your contribution "${contrib.food_name}" has been approved and is now live on Khana Sanskriti!`,
       contributionId]
    );

    return newFoodId;
  },

  // ── Admin: reject ───────────────────────────────────────────
  reject: async (contributionId, adminId, adminMessage) => {
    const contrib = await Contribution.getById(contributionId);
    if (!contrib) throw new Error('Contribution not found');

    await db.execute(
      `UPDATE food_contributions
       SET status='rejected', admin_message=?, reviewed_by=?, reviewed_at=NOW()
       WHERE contribution_id=?`,
      [adminMessage || 'Your contribution was not approved at this time.', adminId, contributionId]
    );

    // Send notification to the submitter
    await db.execute(
      `INSERT INTO notifications
         (recipient_id, actor_id, type, message, contribution_id, is_read)
       VALUES (?, ?, 'contribution_rejected', ?, ?, 0)`,
      [contrib.user_id, adminId,
       adminMessage || `Your contribution "${contrib.food_name}" was not approved. Please review and resubmit.`,
       contributionId]
    );
  },
};

export default Contribution;