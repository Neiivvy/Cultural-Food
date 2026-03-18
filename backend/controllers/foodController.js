import Food from "../models/foodModel.js";

// ── GET /api/foods ─────────────────────────────────────────────
export const getApprovedFoods = async (req, res) => {
  try {
    const {
      search, culture_id, category_slug,
      taste, season, festival, meal_type, occasion, ingredient,
      veg_status
    } = req.query;

    const foods = await Food.getApproved({
      search, culture_id, category_slug,
      taste, season, festival, meal_type, occasion, ingredient,
      veg_status
    });
    res.json({ success: true, data: { foods, total: foods.length } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ── GET /api/foods/filters?category_slug=newari ────────────────
export const getFilterOptions = async (req, res) => {
  try {
    const { category_slug } = req.query;
    const options = await Food.getFilterOptions(category_slug || null);
    res.json({ success: true, data: { options } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ── GET /api/foods/:id ─────────────────────────────────────────
export const getFoodById = async (req, res) => {
  try {
    const food = await Food.getById(req.params.id);
    if (!food) return res.status(404).json({ success: false, message: "Food not found." });
    res.json({ success: true, data: { food } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ── POST /api/foods ────────────────────────────────────────────
export const submitFood = async (req, res) => {
  try {
    const {
      food_name, food_name_nepali, culture_id, location,
      description, cultural_significance, preparation_summary
    } = req.body;

    if (!food_name?.trim())   return res.status(400).json({ success: false, message: "Food name is required." });
    if (!description?.trim()) return res.status(400).json({ success: false, message: "Description is required." });

    const image_url    = req.file?.path || null;
    const submitted_by = req.user.userId;

    const foodId = await Food.create({
      food_name: food_name.trim(), food_name_nepali: food_name_nepali||null,
      culture_id: culture_id||null, location: location||null,
      description: description.trim(),
      cultural_significance: cultural_significance||null,
      preparation_summary: preparation_summary||null,
      image_url, submitted_by,
    });

    res.status(201).json({
      success: true,
      message: "Food submitted! It will be visible after admin review.",
      data: { food_id: foodId },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};