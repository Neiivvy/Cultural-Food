import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { submitContribution } from "../api/contributionService";
import { getCultures } from "../api/cultureService";
import UserNavBar from "../components/UserNavBar";
import "./ContributeFormPage.css";

const TASTES     = ["Sweet","Spicy","Sour","Salty","Bitter","Umami","Mixed"];
const SEASONS    = ["Spring","Summer","Autumn","Winter","All Season"];
const FESTIVALS  = ["Dashain","Tihar","Chhath","Maghe Sankranti","Indra Jatra",
                    "Yomari Punhi","Maghi","Janai Purnima","Teej","Other"];
const MEAL_TYPES = ["Breakfast","Lunch","Dinner","Snack","Dessert"];
const OCCASIONS  = ["Festival","Wedding","Everyday","Offering","Funeral"];

export default function ContributeFormPage() {
  const navigate = useNavigate();
  const [cultures, setCultures]       = useState([]);
  const [loading, setLoading]         = useState(false);
  const [success, setSuccess]         = useState(false);
  const [serverError, setServerError] = useState("");
  const [imagePreview, setImagePreview] = useState(null);

  const [form, setForm] = useState({
    foodName: "", foodNameNepali: "", cultureId: "",
    location: "", description: "", culturalSignificance: "",
    preparationSummary: "", vegStatus: "veg",
    taste: [], season: [], festival: [], mealType: [], occasion: [],
    ingredients: ["", "", ""],
    image: null,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    getCultures()
      .then(r => setCultures(r.data.data?.cultures || r.data.data || []))
      .catch(() => {});
  }, []);

  const set = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: "" }));
  };

  const toggleChip = (field, value) => {
    setForm(f => ({
      ...f,
      [field]: f[field].includes(value)
        ? f[field].filter(v => v !== value)
        : [...f[field], value],
    }));
  };

  const handleIngredientChange = (idx, val) => {
    const updated = [...form.ingredients];
    updated[idx] = val;
    setForm(f => ({ ...f, ingredients: updated }));
  };
  const addIngredient    = () => setForm(f => ({ ...f, ingredients: [...f.ingredients, ""] }));
  const removeIngredient = (idx) =>
    setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, i) => i !== idx) }));

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    set("image", file);
    setImagePreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const e = {};
    if (!form.foodName.trim())    e.foodName    = "Food name is required.";
    if (!form.cultureId)          e.cultureId   = "Please select a culture.";
    if (!form.description.trim()) e.description = "Description is required.";
    if (form.description.trim().length < 30)
      e.description = "Please write at least 30 characters.";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setServerError("");

    // Build attributes array
    const attributes = [
      ...form.taste.map(v => ({ type: "taste", value: v })),
      ...form.season.map(v => ({ type: "season", value: v })),
      ...form.festival.map(v => ({ type: "festival", value: v })),
      ...form.mealType.map(v => ({ type: "meal_type", value: v })),
      ...form.occasion.map(v => ({ type: "occasion", value: v })),
    ];

    const cleanIngredients = form.ingredients.filter(i => i.trim());

    const fd = new FormData();
    fd.append("foodName",             form.foodName.trim());
    fd.append("foodNameNepali",       form.foodNameNepali.trim());
    fd.append("cultureId",            form.cultureId);
    fd.append("location",             form.location.trim());
    fd.append("description",          form.description.trim());
    fd.append("culturalSignificance", form.culturalSignificance.trim());
    fd.append("preparationSummary",   form.preparationSummary.trim());
    fd.append("vegStatus",            form.vegStatus);
    fd.append("attributes",           JSON.stringify(attributes));
    fd.append("ingredients",          JSON.stringify(cleanIngredients));
    if (form.image) fd.append("media", form.image);

    try {
      await submitContribution(fd);
      setSuccess(true);
      setTimeout(() => navigate("/homeUser"), 3500);
    } catch (err) {
      setServerError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="cfp-wrap">
      <UserNavBar />
      <div className="cfp-success">
        <div className="cfp-success-icon">✓</div>
        <h2>Contribution Submitted!</h2>
        <p>Thank you! Our team will review your submission and you'll be notified once it's approved.</p>
        <p className="cfp-redirect">Redirecting you home…</p>
      </div>
    </div>
  );

  return (
    <div className="cfp-wrap">
      <UserNavBar />
      <div className="cfp-content">
        <div className="cfp-header">
          <h1>Contribute a Food</h1>
          <p>Share a cultural food with the community. Our team reviews all submissions before publishing.</p>
        </div>

        {serverError && <div className="cfp-server-error">{serverError}</div>}

        <form className="cfp-form" onSubmit={handleSubmit} noValidate>

          {/* ── Basic Info ── */}
          <section className="cfp-section">
            <h3 className="cfp-section-title">Basic Information</h3>

            <div className="cfp-row">
              <div className="cfp-group">
                <label className="cfp-label">Food Name (English) <span className="cfp-req">*</span></label>
                <input className={`cfp-input${errors.foodName ? " cfp-err" : ""}`}
                  value={form.foodName} onChange={e => set("foodName", e.target.value)}
                  placeholder="e.g. Yomari" />
                {errors.foodName && <p className="cfp-error">{errors.foodName}</p>}
              </div>
              <div className="cfp-group">
                <label className="cfp-label">Food Name (Nepali)</label>
                <input className="cfp-input" value={form.foodNameNepali}
                  onChange={e => set("foodNameNepali", e.target.value)} placeholder="e.g. योमरी" />
              </div>
            </div>

            <div className="cfp-row">
              <div className="cfp-group">
                <label className="cfp-label">Culture / Community <span className="cfp-req">*</span></label>
                <select className={`cfp-input${errors.cultureId ? " cfp-err" : ""}`}
                  value={form.cultureId} onChange={e => set("cultureId", e.target.value)}>
                  <option value="">Select culture…</option>
                  {cultures.map(c => (
                    <option key={c.culture_id} value={c.culture_id}>{c.culture_name}</option>
                  ))}
                </select>
                {errors.cultureId && <p className="cfp-error">{errors.cultureId}</p>}
              </div>
              <div className="cfp-group">
                <label className="cfp-label">Location / Region</label>
                <input className="cfp-input" value={form.location}
                  onChange={e => set("location", e.target.value)} placeholder="e.g. Kathmandu Valley" />
              </div>
            </div>

            <div className="cfp-group">
              <label className="cfp-label">Diet Type</label>
              <div className="cfp-radio-row">
                {["veg","non-veg","vegan"].map(v => (
                  <label key={v} className={`cfp-radio${form.vegStatus === v ? " active" : ""}`}>
                    <input type="radio" name="vegStatus" value={v}
                      checked={form.vegStatus === v} onChange={() => set("vegStatus", v)} />
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </label>
                ))}
              </div>
            </div>
          </section>

          {/* ── Descriptions ── */}
          <section className="cfp-section">
            <h3 className="cfp-section-title">Descriptions</h3>

            <div className="cfp-group">
              <label className="cfp-label">Description <span className="cfp-req">*</span></label>
              <textarea className={`cfp-textarea${errors.description ? " cfp-err" : ""}`}
                rows={4} value={form.description}
                onChange={e => set("description", e.target.value)}
                placeholder="Describe the food — what it is, how it tastes, where it's from…" />
              {errors.description && <p className="cfp-error">{errors.description}</p>}
            </div>

            <div className="cfp-group">
              <label className="cfp-label">Cultural Significance</label>
              <textarea className="cfp-textarea" rows={3} value={form.culturalSignificance}
                onChange={e => set("culturalSignificance", e.target.value)}
                placeholder="What role does this food play in rituals, festivals, or community life?" />
            </div>

            <div className="cfp-group">
              <label className="cfp-label">How It's Made (brief)</label>
              <textarea className="cfp-textarea" rows={3} value={form.preparationSummary}
                onChange={e => set("preparationSummary", e.target.value)}
                placeholder="Brief preparation steps or cooking method…" />
            </div>
          </section>

          {/* ── Attributes ── */}
          <section className="cfp-section">
            <h3 className="cfp-section-title">Attributes <span className="cfp-hint">(select all that apply)</span></h3>

            {[
              { label: "Taste",     field: "taste",    options: TASTES },
              { label: "Season",    field: "season",   options: SEASONS },
              { label: "Festival",  field: "festival", options: FESTIVALS },
              { label: "Meal Type", field: "mealType", options: MEAL_TYPES },
              { label: "Occasion",  field: "occasion", options: OCCASIONS },
            ].map(({ label, field, options }) => (
              <div className="cfp-group" key={field}>
                <label className="cfp-label">{label}</label>
                <div className="cfp-chips">
                  {options.map(opt => (
                    <button type="button" key={opt}
                      className={`cfp-chip${form[field].includes(opt) ? " selected" : ""}`}
                      onClick={() => toggleChip(field, opt)}>{opt}</button>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* ── Ingredients ── */}
          <section className="cfp-section">
            <h3 className="cfp-section-title">Ingredients</h3>
            <div className="cfp-ingredients">
              {form.ingredients.map((ing, idx) => (
                <div className="cfp-ing-row" key={idx}>
                  <input className="cfp-input" value={ing}
                    onChange={e => handleIngredientChange(idx, e.target.value)}
                    placeholder={`Ingredient ${idx + 1}`} />
                  {form.ingredients.length > 1 && (
                    <button type="button" className="cfp-ing-remove"
                      onClick={() => removeIngredient(idx)}>✕</button>
                  )}
                </div>
              ))}
              <button type="button" className="cfp-ing-add" onClick={addIngredient}>
                + Add ingredient
              </button>
            </div>
          </section>

          {/* ── Image ── */}
          <section className="cfp-section">
            <h3 className="cfp-section-title">Food Image</h3>
            <div className="cfp-upload-area" onClick={() => document.getElementById("cfp-img").click()}>
              {imagePreview
                ? <img src={imagePreview} alt="preview" className="cfp-img-preview" />
                : <div className="cfp-upload-placeholder">
                    <span className="cfp-upload-icon">📷</span>
                    <p>Click to upload an image</p>
                    <p className="cfp-upload-hint">JPG, PNG, WEBP — max 5 MB</p>
                  </div>
              }
            </div>
            <input id="cfp-img" type="file" accept="image/*" style={{ display:"none" }}
              onChange={handleImage} />
          </section>

          <button type="submit" className="cfp-submit" disabled={loading}>
            {loading ? "Submitting…" : "Submit Contribution"}
          </button>

        </form>
      </div>
    </div>
  );
}