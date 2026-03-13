import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import UserNavBar from "../components/UserNavBar";
import useCultures from "../hooks/useCultures";
import { submitFood } from "../api/foodService";
import "./ContributeFormPage.css";

const SEASONS  = ["Spring","Summer","Autumn","Winter","All Season"];
const TASTES   = ["Sweet","Salty","Spicy","Sour","Bitter","Umami","Mixed"];

export default function ContributeFormPage() {
  const navigate = useNavigate();
  const { cultures } = useCultures();
  const imgRef = useRef();

  const [form, setForm] = useState({
    food_name: "", culture_id: "", location: "",
    festival: "", season: "", taste: "",
    description: "", cultural_significance: "",
  });
  const [imgFile,    setImgFile]    = useState(null);
  const [imgPreview, setImgPreview] = useState(null);
  const [errors,     setErrors]     = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success,    setSuccess]    = useState(false);

  const set = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: "" }));
  };

  const handleImg = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setImgFile(f);
    setImgPreview(URL.createObjectURL(f));
  };

  const validate = () => {
    const e = {};
    if (!form.food_name.trim())   e.food_name    = "Food name is required.";
    if (!form.description.trim()) e.description  = "Description is required.";
    if (form.description.trim().length < 30) e.description = "Please write at least 30 characters.";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    setSubmitting(true);

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
    if (imgFile) fd.append("image", imgFile);

    try {
      await submitFood(fd);
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setErrors({ server: err.response?.data?.message || "Submission failed. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  if (success) return (
    <>
      <UserNavBar />
      <div className="cform-page">
        <div className="cform-success">
          <div className="cform-success-icon">🎉</div>
          <h2 className="cform-success-title">Thank you for contributing!</h2>
          <p  className="cform-success-msg">
            Your food submission is now under review. Our admin team will check it 
            and once approved it'll appear in the food discovery section.
          </p>
          <div className="cform-success-actions">
            <button className="cform-btn-primary" onClick={() => { setSuccess(false); setForm({ food_name:"",culture_id:"",location:"",festival:"",season:"",taste:"",description:"",cultural_significance:"" }); setImgFile(null); setImgPreview(null); }}>
              Submit Another
            </button>
            <button className="cform-btn-secondary" onClick={() => navigate("/homeUser")}>
              Go to Community
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <UserNavBar />
      <div className="cform-page">
        <div className="cform-container">

          {/* Header */}
          <div className="cform-header">
            <button className="cform-back" onClick={() => navigate("/contribute")}>← Back</button>
            <h1 className="cform-title">Contribute a Food</h1>
            <p className="cform-subtitle">
              Share a cultural dish from your community. All submissions are reviewed before going live.
            </p>
          </div>

          <form className="cform-form" onSubmit={handleSubmit} noValidate>

            {errors.server && <div className="cform-server-error">⚠ {errors.server}</div>}

            {/* Food Name */}
            <div className="cform-field">
              <label className="cform-label">Food Name <span className="cform-req">*</span></label>
              <input
                type="text" className={`cform-input ${errors.food_name ? "error" : ""}`}
                placeholder="e.g. Yomari, Dhido, Sel Roti"
                value={form.food_name} onChange={e => set("food_name", e.target.value)}
              />
              {errors.food_name && <p className="cform-error">{errors.food_name}</p>}
            </div>

            {/* Row: Culture + Location */}
            <div className="cform-row">
              <div className="cform-field">
                <label className="cform-label">Culture / Ethnicity</label>
                <select className="cform-select" value={form.culture_id} onChange={e => set("culture_id", e.target.value)}>
                  <option value="">Select culture…</option>
                  {cultures.map(c => <option key={c.culture_id} value={c.culture_id}>{c.culture_name}</option>)}
                </select>
              </div>
              <div className="cform-field">
                <label className="cform-label">Location / Region</label>
                <input
                  type="text" className="cform-input"
                  placeholder="e.g. Kathmandu Valley, Terai"
                  value={form.location} onChange={e => set("location", e.target.value)}
                />
              </div>
            </div>

            {/* Row: Season + Taste */}
            <div className="cform-row">
              <div className="cform-field">
                <label className="cform-label">Season</label>
                <div className="cform-chip-group">
                  {SEASONS.map(s => (
                    <button type="button" key={s}
                      className={`cform-chip ${form.season === s ? "active" : ""}`}
                      onClick={() => set("season", form.season === s ? "" : s)}
                    >{s}</button>
                  ))}
                </div>
              </div>
              <div className="cform-field">
                <label className="cform-label">Taste Profile</label>
                <div className="cform-chip-group">
                  {TASTES.map(t => (
                    <button type="button" key={t}
                      className={`cform-chip ${form.taste === t ? "active" : ""}`}
                      onClick={() => set("taste", form.taste === t ? "" : t)}
                    >{t}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Festival */}
            <div className="cform-field">
              <label className="cform-label">Associated Festival / Occasion</label>
              <input
                type="text" className="cform-input"
                placeholder="e.g. Dashain, Tihar, Chhath, Indra Jatra"
                value={form.festival} onChange={e => set("festival", e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="cform-field">
              <label className="cform-label">Description <span className="cform-req">*</span></label>
              <textarea
                className={`cform-textarea ${errors.description ? "error" : ""}`}
                rows={5}
                placeholder="Describe the food — what it's made of, how it's prepared, what it tastes like, and why it's significant…"
                value={form.description} onChange={e => set("description", e.target.value)}
              />
              <span className="cform-char-count">{form.description.length} chars</span>
              {errors.description && <p className="cform-error">{errors.description}</p>}
            </div>

            {/* Cultural significance */}
            <div className="cform-field">
              <label className="cform-label">Cultural Significance</label>
              <textarea
                className="cform-textarea"
                rows={3}
                placeholder="What does this food mean culturally? Is it tied to rituals, identity, or history?"
                value={form.cultural_significance}
                onChange={e => set("cultural_significance", e.target.value)}
              />
            </div>

            {/* Image upload */}
            <div className="cform-field">
              <label className="cform-label">Photo (optional)</label>
              <div
                className={`cform-img-drop ${imgPreview ? "has-img" : ""}`}
                onClick={() => imgRef.current?.click()}
              >
                {imgPreview ? (
                  <img src={imgPreview} alt="preview" className="cform-img-preview" />
                ) : (
                  <div className="cform-img-placeholder">
                    <span className="cform-img-icon">📸</span>
                    <p className="cform-img-text">Click to upload a photo</p>
                    <p className="cform-img-hint">JPG, PNG or WebP — max 10 MB</p>
                  </div>
                )}
              </div>
              {imgPreview && (
                <button type="button" className="cform-img-remove"
                  onClick={() => { setImgFile(null); setImgPreview(null); }}>
                  Remove photo
                </button>
              )}
              <input ref={imgRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleImg} />
            </div>

            {/* Submit */}
            <div className="cform-footer">
              <p className="cform-footer-note">
                ✓ Submissions are reviewed by our admin team before going live.
              </p>
              <button type="submit" className="cform-submit" disabled={submitting}>
                {submitting ? (
                  <><span className="cform-spinner" /> Submitting…</>
                ) : (
                  <><span>✦</span> Submit Food</>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </>
  );
}