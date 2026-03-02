import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CULTURE_TAGS } from '../data/dummyDataPost';
import './AddPostPage.css';

const POST_TYPES = [
  { id: 'recipe',   label: 'Recipe',   desc: 'Share a traditional dish',   emoji: '📖' },
  { id: 'reel',     label: 'Reel',     desc: 'Short video content',        emoji: '🎬' },
  { id: 'question', label: 'Question', desc: 'Ask the community',          emoji: '❓' },
];

export default function AddPostPage() {
  const navigate = useNavigate();
  const [type, setType] = useState('recipe');
  const [form, setForm] = useState({
    title: '', description: '', culture: '',
    ingredients: [''], steps: [''], media: null,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState(null);

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
  };

  const setListItem = (k, i, v) => {
    const arr = [...form[k]]; arr[i] = v; set(k, arr);
  };
  const addListItem = (k) => set(k, [...form[k], '']);
  const removeListItem = (k, i) => {
    const arr = form[k].filter((_, j) => j !== i);
    set(k, arr.length ? arr : ['']);
  };

  const handleMedia = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    set('media', file);
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim())       e.title       = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.culture)            e.culture     = 'Please select a culture tag';
    if (type !== 'question' && !form.media) e.media = 'Please upload media';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1000));
    alert('Post submitted for review! ✅');
    navigate('/home');
  };

  return (
    <div className="addpage">
      <div className="addpage-container">
        <h2 className="addpage-title">
          <img src="https://api.iconify.design/noto/pencil.svg" alt="" width="24" height="24" />
          Create New Post
        </h2>

        {/* Type selector */}
        <div className="addpage-types">
          {POST_TYPES.map(t => (
            <button
              key={t.id}
              className={`addpage-type-btn ${type === t.id ? 'active' : ''}`}
              onClick={() => setType(t.id)}
              type="button"
            >
              <span className="addpage-type-emoji">{t.emoji}</span>
              <span className="addpage-type-label">{t.label}</span>
              <span className="addpage-type-desc">{t.desc}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="addpage-form">
          {/* Title */}
          <div className="addpage-field">
            <label className="addpage-label">
              Title <span className="req">*</span>
            </label>
            <input
              type="text"
              className={`addpage-input ${errors.title ? 'err' : ''}`}
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder={type === 'question' ? 'What do you want to ask?' : 'Name of your dish…'}
            />
            {errors.title && <span className="addpage-err">{errors.title}</span>}
          </div>

          {/* Description */}
          <div className="addpage-field">
            <label className="addpage-label">
              Description <span className="req">*</span>
            </label>
            <textarea
              className={`addpage-input addpage-textarea ${errors.description ? 'err' : ''}`}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Tell the story behind this…"
              rows={4}
            />
            {errors.description && <span className="addpage-err">{errors.description}</span>}
          </div>

          {/* Culture tag */}
          <div className="addpage-field">
            <label className="addpage-label">
              Culture Tag <span className="req">*</span>
            </label>
            <select
              className={`addpage-input addpage-select ${errors.culture ? 'err' : ''}`}
              value={form.culture}
              onChange={e => set('culture', e.target.value)}
            >
              <option value="">Select a culture…</option>
              {CULTURE_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {errors.culture && <span className="addpage-err">{errors.culture}</span>}
          </div>

          {/* Ingredients */}
          {type !== 'question' && (
            <div className="addpage-field">
              <label className="addpage-label">Ingredients</label>
              {form.ingredients.map((ing, i) => (
                <div key={i} className="addpage-list-row">
                  <span className="addpage-bullet">•</span>
                  <input
                    type="text"
                    className="addpage-input addpage-list-input"
                    value={ing}
                    onChange={e => setListItem('ingredients', i, e.target.value)}
                    placeholder={`Ingredient ${i + 1}`}
                  />
                  {form.ingredients.length > 1 && (
                    <button type="button" className="addpage-remove" onClick={() => removeListItem('ingredients', i)}>✕</button>
                  )}
                </div>
              ))}
              <button type="button" className="addpage-add-item" onClick={() => addListItem('ingredients')}>
                + Add Ingredient
              </button>
            </div>
          )}

          {/* Steps */}
          {type !== 'question' && (
            <div className="addpage-field">
              <label className="addpage-label">Steps</label>
              {form.steps.map((step, i) => (
                <div key={i} className="addpage-list-row">
                  <span className="addpage-step-num">{i + 1}</span>
                  <input
                    type="text"
                    className="addpage-input addpage-list-input"
                    value={step}
                    onChange={e => setListItem('steps', i, e.target.value)}
                    placeholder={`Step ${i + 1}`}
                  />
                  {form.steps.length > 1 && (
                    <button type="button" className="addpage-remove" onClick={() => removeListItem('steps', i)}>✕</button>
                  )}
                </div>
              ))}
              <button type="button" className="addpage-add-item" onClick={() => addListItem('steps')}>
                + Add Step
              </button>
            </div>
          )}

          {/* Media */}
          {type !== 'question' && (
            <div className="addpage-field">
              <label className="addpage-label">
                {type === 'reel' ? 'Upload Video' : 'Upload Image'} <span className="req">*</span>
              </label>
              <label className={`addpage-media-drop ${errors.media ? 'err' : ''}`}>
                {preview
                  ? <img src={preview} alt="preview" className="addpage-preview" />
                  : (
                    <div className="addpage-media-placeholder">
                      <span className="addpage-media-icon">{type === 'reel' ? '🎬' : '🖼️'}</span>
                      <span className="addpage-media-label">Click to upload</span>
                      <span className="addpage-media-hint">PNG, JPG or MP4 up to 50MB</span>
                    </div>
                  )
                }
                <input
                  type="file"
                  accept={type === 'reel' ? 'video/*' : 'image/*'}
                  onChange={handleMedia}
                  style={{ display: 'none' }}
                />
              </label>
              {errors.media && <span className="addpage-err">{errors.media}</span>}
            </div>
          )}

          <button type="submit" className="addpage-submit" disabled={submitting}>
            {submitting
              ? 'Submitting…'
              : (
                <>
                  <img src="https://api.iconify.design/material-symbols/send.svg?color=%23fff" alt="" width="16" height="16" />
                  Submit for Review
                </>
              )
            }
          </button>
        </form>
      </div>
    </div>
  );
}