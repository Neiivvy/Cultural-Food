import Contribution from "../models/contributionModel.js";

// ── User: submit a new food contribution ───────────────────────
export const submitContribution = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      foodName, foodNameNepali, cultureId, location,
      description, culturalSignificance, preparationSummary,
      vegStatus, attributes, ingredients
    } = req.body;

    if (!foodName || !description) {
      return res.status(400).json({ success: false, message: 'Food name and description are required.' });
    }

    // Handle image — uploaded via multer/cloudinary, URL is in req.file
    const imageUrl = req.file?.path || req.body.imageUrl || null;

    const contributionId = await Contribution.create({
      userId, foodName, foodNameNepali, cultureId, location,
      description, culturalSignificance, preparationSummary,
      imageUrl, vegStatus
    });

    // Parse attributes (sent as JSON string from FormData)
    let parsedAttributes = [];
    if (attributes) {
      try { parsedAttributes = typeof attributes === 'string' ? JSON.parse(attributes) : attributes; }
      catch { parsedAttributes = []; }
    }
    await Contribution.addAttributes(contributionId, parsedAttributes);

    // Parse ingredients (array of strings)
    let parsedIngredients = [];
    if (ingredients) {
      try { parsedIngredients = typeof ingredients === 'string' ? JSON.parse(ingredients) : ingredients; }
      catch { parsedIngredients = []; }
    }
    await Contribution.addIngredients(contributionId, parsedIngredients);

    res.status(201).json({
      success: true,
      message: 'Thank you! Your contribution has been submitted and is pending review by our admin.',
      data: { contributionId }
    });
  } catch (err) {
    console.error('submitContribution error:', err);
    res.status(500).json({ success: false, message: 'Server error submitting contribution.' });
  }
};

// ── User: get their own contributions ─────────────────────────
export const getMyContributions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const contributions = await Contribution.getByUser(userId);
    res.json({ success: true, data: { contributions } });
  } catch (err) {
    console.error('getMyContributions error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Admin: get all contributions (optionally filtered by status) ─
export const getAllContributions = async (req, res) => {
  try {
    const { status } = req.query; // 'pending' | 'approved' | 'rejected' | undefined
    const contributions = await Contribution.getAll(status || null);
    res.json({ success: true, data: { contributions } });
  } catch (err) {
    console.error('getAllContributions error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Admin: get one contribution with full details ──────────────
export const getContributionById = async (req, res) => {
  try {
    const { id } = req.params;
    const contribution = await Contribution.getById(id);
    if (!contribution) return res.status(404).json({ success: false, message: 'Contribution not found.' });
    res.json({ success: true, data: { contribution } });
  } catch (err) {
    console.error('getContributionById error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Admin: update contribution fields ─────────────────────────
export const updateContribution = async (req, res) => {
  try {
    const { id } = req.params;
    const contrib = await Contribution.getById(id);
    if (!contrib) return res.status(404).json({ success: false, message: 'Contribution not found.' });

    const imageUrl = req.file?.path || req.body.imageUrl;
    const fields = { ...req.body };
    if (imageUrl) fields.image_url = imageUrl;

    // Parse nested JSON fields if sent as strings
    if (fields.attributes && typeof fields.attributes === 'string') {
      try { fields.attributes = JSON.parse(fields.attributes); } catch { delete fields.attributes; }
    }
    if (fields.ingredients && typeof fields.ingredients === 'string') {
      try { fields.ingredients = JSON.parse(fields.ingredients); } catch { delete fields.ingredients; }
    }

    await Contribution.update(id, fields);
    const updated = await Contribution.getById(id);
    res.json({ success: true, message: 'Contribution updated.', data: { contribution: updated } });
  } catch (err) {
    console.error('updateContribution error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Admin: approve a contribution ─────────────────────────────
export const approveContribution = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin.userId;
    const { adminMessage } = req.body;

    const newFoodId = await Contribution.approve(id, adminId, adminMessage);
    res.json({
      success: true,
      message: 'Contribution approved and food is now live.',
      data: { newFoodId }
    });
  } catch (err) {
    console.error('approveContribution error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
};

// ── Admin: reject a contribution ──────────────────────────────
export const rejectContribution = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin.userId;
    const { adminMessage } = req.body;

    if (!adminMessage || !adminMessage.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a reason for rejection.' });
    }

    await Contribution.reject(id, adminId, adminMessage);
    res.json({ success: true, message: 'Contribution rejected and user notified.' });
  } catch (err) {
    console.error('rejectContribution error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
};