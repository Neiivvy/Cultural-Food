import Food from "../models/foodModel.js";

// ── Public: GET /api/foods ──────────────────────────────────────
export const getApprovedFoods = async (req, res) => {
  try {
    const { search, culture_id, season, taste, festival } = req.query;
    const foods = await Food.getApproved({ search, culture_id, season, taste, festival });
    res.json({ success: true, data: { foods } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ── Public: GET /api/foods/:id ──────────────────────────────────
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

// ── Auth: POST /api/foods ── submit food (multer runs before this)
export const submitFood = async (req, res) => {
  try {
    const { food_name, culture_id, location, festival, season,
            taste, description, cultural_significance } = req.body;

    if (!food_name?.trim())    return res.status(400).json({ success: false, message: "Food name is required." });
    if (!description?.trim())  return res.status(400).json({ success: false, message: "Description is required." });

    const image_url    = req.file?.path || null;
    const submitted_by = req.user.userId;

    const foodId = await Food.create({
      food_name: food_name.trim(),
      culture_id:           culture_id   || null,
      location:             location     || null,
      festival:             festival     || null,
      season:               season       || null,
      taste:                taste        || null,
      description:          description.trim(),
      cultural_significance: cultural_significance || null,
      image_url,
      submitted_by,
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