import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPost } from "../api/postService";
import { createQuestion } from "../api/questionService";
import useCultures from "../hooks/useCultures";
import "./AddPostPage.css";

const POST_TYPES = [
  { id: "recipe",   label: "Recipe",   desc: "Share a traditional dish",  icon: "📖" },
  { id: "reel",     label: "Reel",     desc: "Short cooking video",        icon: "▶"  },
  { id: "question", label: "Question", desc: "Ask the community",          icon: "❓" },
];

export default function AddPostPage() {
  const navigate = useNavigate();
  const { cultures } = useCultures();

  const [type,       setType]       = useState("recipe");
  const [form,       setForm]       = useState({
    title: "", description: "", culture_id: "",
    ingredients: [""], steps: [""], media: null,
  });
  const [errors,     setErrors]     = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [preview,    setPreview]    = useState(null);
  const [serverErr,  setServerErr]  = useState("");

  const isQuestion = type === "question";

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: "" }));
  };
  const setListItem    = (k, i, v) => { const a = [...form[k]]; a[i] = v; set(k, a); };
  const addListItem    = (k)       => set(k, [...form[k], ""]);
  const removeListItem = (k, i)    => { const a = form[k].filter((_, j) => j !== i); set(k, a.length ? a : [""]); };

  const handleMedia = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    set("media", file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = ev => setPreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim())             e.title      = "Title is required";
    if (!form.culture_id)               e.culture_id = "Please select a culture";
    if (!isQuestion && !form.media)     e.media      = "Please upload media";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true); setServerErr("");
    try {
      if (isQuestion) {
        await createQuestion({
          title:       form.title.trim(),
          description: form.description.trim() || undefined,
          culture_id:  form.culture_id || undefined,
        });
      } else {
        const fd = new FormData();
        fd.append("title",       form.title.trim());
        fd.append("description", form.description.trim());
        fd.append("culture_id",  form.culture_id);
        fd.append("post_type",   type);
        fd.append("ingredients", JSON.stringify(form.ingredients.filter(s => s.trim())));
        fd.append("steps",       JSON.stringify(form.steps.filter(s => s.trim())));
        if (form.media) fd.append("media", form.media);
        await createPost(fd);
      }
      navigate("/homeUser");
    } catch (err) {
      setServerErr(err.response?.data?.message || "Failed to publish. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="addpage">
      <div className="addpage-inner">

        {/* Header — same level/style as Community Feed header */}
        <div className="addpage-page-header">
          <div>
            <h1 className="addpage-page-title">Create New Post</h1>
            <p className="addpage-page-sub">Share recipes, reels, or ask the community</p>
          </div>
        </div>

        {/* Type selector */}
        <div className="addpage-types">
          {POST_TYPES.map(t => (
            <button
              key={t.id}
              className={`addpage-type-btn ${type === t.id ? "active" : ""}`}
              onClick={() => { setType(t.id); setErrors({}); setServerErr(""); }}
              type="button"
            >
              <span className="addpage-type-icon">{t.icon}</span>
              <span className="addpage-type-label">{t.label}</span>
              <span className="addpage-type-desc">{t.desc}</span>
            </button>
          ))}
        </div>

        {serverErr && <p className="addpage-server-err">{serverErr}</p>}

        <form onSubmit={handleSubmit} className="addpage-form">

          {/* Title */}
          <div className="addpage-field">
            <label className="addpage-label">
              {isQuestion ? "Question" : "Title"} <span className="addpage-req">*</span>
            </label>
            <input
              type="text"
              className={`addpage-input ${errors.title ? "err" : ""}`}
              value={form.title}
              onChange={e => set("title", e.target.value)}
              placeholder={isQuestion ? "What do you want to ask?" : "Name of your dish…"}
            />
            {errors.title && <span className="addpage-err-msg">{errors.title}</span>}
          </div>

          {/* Description */}
          <div className="addpage-field">
            <label className="addpage-label">
              {isQuestion ? "Details" : "Description"}
              {isQuestion && <span className="addpage-optional"> (optional)</span>}
            </label>
            <textarea
              className={`addpage-input addpage-textarea ${errors.description ? "err" : ""}`}
              value={form.description}
              onChange={e => set("description", e.target.value)}
              placeholder={isQuestion
                ? "Add more context to your question…"
                : "Tell the story behind this dish, its origins, what makes it special…"}
              rows={isQuestion ? 4 : 4}
            />
          </div>

          {/* Culture */}
          <div className="addpage-field">
            <label className="addpage-label">
              Culture Tag <span className="addpage-req">*</span>
            </label>
            <select
              className={`addpage-input addpage-select ${errors.culture_id ? "err" : ""}`}
              value={form.culture_id}
              onChange={e => set("culture_id", e.target.value)}
            >
              <option value="">Select a culture…</option>
              {cultures.map(c => (
                <option key={c.culture_id} value={c.culture_id}>{c.culture_name}</option>
              ))}
            </select>
            {errors.culture_id && <span className="addpage-err-msg">{errors.culture_id}</span>}
          </div>

          {/* Ingredients */}
          {!isQuestion && (
            <div className="addpage-field">
              <label className="addpage-label">Ingredients</label>
              <div className="addpage-list">
                {form.ingredients.map((ing, i) => (
                  <div key={i} className="addpage-list-row">
                    <span className="addpage-bullet">•</span>
                    <input
                      type="text"
                      className="addpage-input addpage-list-input"
                      value={ing}
                      onChange={e => setListItem("ingredients", i, e.target.value)}
                      placeholder={`Ingredient ${i + 1}`}
                    />
                    {form.ingredients.length > 1 && (
                      <button type="button" className="addpage-remove" onClick={() => removeListItem("ingredients", i)}>✕</button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" className="addpage-add-item" onClick={() => addListItem("ingredients")}>
                + Add Ingredient
              </button>
            </div>
          )}

          {/* Steps */}
          {!isQuestion && (
            <div className="addpage-field">
              <label className="addpage-label">Steps</label>
              <div className="addpage-list">
                {form.steps.map((step, i) => (
                  <div key={i} className="addpage-list-row">
                    <span className="addpage-step-num">{i + 1}</span>
                    <input
                      type="text"
                      className="addpage-input addpage-list-input"
                      value={step}
                      onChange={e => setListItem("steps", i, e.target.value)}
                      placeholder={`Step ${i + 1}`}
                    />
                    {form.steps.length > 1 && (
                      <button type="button" className="addpage-remove" onClick={() => removeListItem("steps", i)}>✕</button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" className="addpage-add-item" onClick={() => addListItem("steps")}>
                + Add Step
              </button>
            </div>
          )}

          {/* Media */}
          {!isQuestion && (
            <div className="addpage-field">
              <label className="addpage-label">
                {type === "reel" ? "Upload Video" : "Upload Image"} <span className="addpage-req">*</span>
              </label>
              <label className={`addpage-media-drop ${errors.media ? "err" : ""}`}>
                {preview
                  ? <img src={preview} alt="preview" className="addpage-preview" />
                  : form.media
                    ? <div className="addpage-media-placeholder">
                        <span className="addpage-media-icon">▶</span>
                        <span className="addpage-media-name">{form.media.name}</span>
                      </div>
                    : <div className="addpage-media-placeholder">
                        <span className="addpage-media-icon">{type === "reel" ? "▶" : "🖼"}</span>
                        <span className="addpage-media-label">Click to upload</span>
                        <span className="addpage-media-hint">
                          {type === "reel" ? "MP4, MOV or WEBM" : "PNG, JPG or WEBP"}
                        </span>
                      </div>
                }
                <input
                  type="file"
                  accept={type === "reel" ? "video/mp4,video/mov,video/webm" : "image/jpeg,image/png,image/webp"}
                  onChange={handleMedia}
                  style={{ display: "none" }}
                />
              </label>
              {errors.media && <span className="addpage-err-msg">{errors.media}</span>}
            </div>
          )}

          <button type="submit" className="addpage-submit" disabled={submitting}>
            {submitting ? "Publishing…" : "Publish"}
          </button>
        </form>
      </div>
    </div>
  );
}