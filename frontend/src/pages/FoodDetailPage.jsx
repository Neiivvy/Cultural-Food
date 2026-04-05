import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import NavBar from '../components/NavBar';
import { getFoodById, getRecommendations } from '../api/foodService';
import { getAvatar } from '../utils/avatar';
import './FoodDetailPage.css';

/* ── helpers ─────────────────────────────────────────────────────── */
const groupAttrs = (attrs = []) => {
  const g = {};
  attrs.forEach(({ attribute_type, attribute_value }) => {
    if (!g[attribute_type]) g[attribute_type] = [];
    g[attribute_type].push(attribute_value);
  });
  return g;
};

const ATTR_META = {
  taste:      { label: 'Taste' },
  season:     { label: 'Season' },
  festival:   { label: 'Festival' },
  meal_type:  { label: 'Meal Type' },
  occasion:   { label: 'Occasion' },
  ingredient: { label: 'Key Ingredient' },
};

const VEG_LABEL = {
  veg:      { label: 'Vegetarian',     color: '#16a34a', bg: '#f0fdf4' },
  'non-veg':{ label: 'Non-Vegetarian', color: '#dc2626', bg: '#fef2f2' },
  vegan:    { label: 'Vegan',          color: '#2563eb', bg: '#eff6ff' },
};

/* ── Image with fallback ─────────────────────────────────────────── */
function FoodImage({ src, alt }) {
  const [err, setErr] = useState(false);
  if (err || !src) {
    return (
      <div className="fdp-hero-placeholder">
        <span></span>
        <p>{alt}</p>
      </div>
    );
  }
  return <img src={src} alt={alt} className="fdp-hero-img" onError={() => setErr(true)} />;
}

/* ── Recommendation card ─────────────────────────────────────── */
function RecCard({ food, onClick }) {
  const [imgErr, setImgErr] = useState(false);
  const VEG_DOT = { veg: '#16a34a', 'non-veg': '#dc2626', vegan: '#2563eb' };
  return (
    <div className="fdp-rec-card" onClick={onClick}>
      <div className="fdp-rec-img-wrap">
        {food.image_url && !imgErr
          ? <img src={food.image_url} alt={food.food_name} className="fdp-rec-img" onError={() => setImgErr(true)} />
          : <div className="fdp-rec-img-placeholder"></div>
        }
        {food.veg_status && VEG_DOT[food.veg_status] && (
          <span className="fdp-rec-veg-dot" style={{ background: VEG_DOT[food.veg_status] }} />
        )}
      </div>
      <div className="fdp-rec-body">
        <p className="fdp-rec-culture">{food.culture_name}</p>
        <h3 className="fdp-rec-name">{food.food_name}</h3>
        {food.food_name_nepali && <p className="fdp-rec-nepali">{food.food_name_nepali}</p>}
      </div>
    </div>
  );
}

/* ── Contributor credit card ─────────────────────────────────── */
function ContributorCard({ name, picture }) {
  return (
    <div className="fdp-contributor-card">
      <div className="fdp-contributor-header">
        <span className="fdp-contributor-icon">✦</span>
        <h3 className="fdp-contributor-title">Community Contribution</h3>
      </div>
      <div className="fdp-contributor-row">
        <img
          src={getAvatar(picture, name, 40)}
          alt={name}
          className="fdp-contributor-avatar"
        />
        <div>
          <p className="fdp-contributor-label">Contributed by</p>
          <p className="fdp-contributor-name">{name}</p>
        </div>
      </div>
      <p className="fdp-contributor-note">
        This food was shared by a community member and reviewed by our team.
      </p>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────── */
export default function FoodDetailPage() {
  const { foodId } = useParams();
  const navigate   = useNavigate();

  const [state, setState] = useState({ food: null, loading: true, error: '' });
  const [recs,  setRecs]  = useState([]);
  const { food, loading, error } = state;
  useEffect(() => {
    let cancelled = false;
    getFoodById(foodId)
    .then(res => {
      if (!cancelled) {
        setState({ food: res.data.data.food, loading: false, error: '' });
        //recommendation algorithm is triggered here the getRecommendations function makes an API call to the backend to fetch similar foods based on taste, culture, and festival similarity. The results are stored in the recs state variable and displayed in the "You May Also Like" section at the bottom of the page.
          getRecommendations(foodId)
            .then(r => { if (!cancelled) setRecs(r.data.data.recommendations || []); })
            .catch(() => {});
        }
      })
      .catch(() => {
        if (!cancelled) setState({ food: null, loading: false, error: 'Food not found.' });
      });
    return () => { cancelled = true; };
  }, [foodId]);

  if (loading) return (
    <div className="fdp">
      <NavBar />
      <div className="fdp-loading">
        <div className="fdp-spinner" />
        <p>Loading…</p>
      </div>
    </div>
  );

  if (error || !food) return (
    <div className="fdp">
      <NavBar />
      <div className="fdp-error-state">
        <span className="fdp-error-icon">🍽️</span>
        <h2>Food not found</h2>
        <p>This dish may not exist or is still under review.</p>
        <button className="fdp-back-btn" onClick={() => navigate(-1)}>← Go back</button>
      </div>
    </div>
  );

  const attrs   = groupAttrs(food.attributes);
  const vegMeta = food.veg_status ? VEG_LABEL[food.veg_status] : null;
  const isUserContributed = !!food.contributor_name;

  return (
    <div className="fdp">
      <NavBar />

      {/* ── Hero ── */}
      <div className="fdp-hero">
        <FoodImage src={food.image_url} alt={food.food_name} />
        <div className="fdp-hero-scrim" />

        <div className="fdp-hero-content">
          <div className="fdp-breadcrumbs">
            <Link to="/" className="fdp-crumb">Home</Link>
            <span className="fdp-crumb-sep">›</span>
            <Link to="/foods" className="fdp-crumb">Foods</Link>
            {food.category_slug && (
              <>
                <span className="fdp-crumb-sep">›</span>
                <Link to={`/foods?category=${food.category_slug}`} className="fdp-crumb">
                  {food.category_name}
                </Link>
              </>
            )}
            <span className="fdp-crumb-sep">›</span>
            <span className="fdp-crumb fdp-crumb--active">{food.food_name}</span>
          </div>

          <div className="fdp-hero-title-block">
            {food.food_name_nepali && (
              <span className="fdp-hero-nepali">{food.food_name_nepali}</span>
            )}
            <h1 className="fdp-hero-title">{food.food_name}</h1>

            <div className="fdp-hero-meta">
              {food.culture_name && (
                <span className="fdp-hero-chip fdp-hero-chip--culture">{food.culture_name}</span>
              )}
              {food.category_name && (
                <span className="fdp-hero-chip fdp-hero-chip--category">{food.category_name}</span>
              )}
              {vegMeta && (
                <span className="fdp-hero-chip"
                  style={{ background: vegMeta.bg, color: vegMeta.color, borderColor: vegMeta.color + '40' }}>
                  {vegMeta.label}
                </span>
              )}
              {food.location && (
                <span className="fdp-hero-chip fdp-hero-chip--location">📍 {food.location}</span>
              )}
              {/* ── Contributor badge in hero ── */}
              {isUserContributed && (
                <span className="fdp-hero-chip fdp-hero-chip--contrib">
                  ✦ by {food.contributor_name}
                </span>
              )}
            </div>
          </div>
        </div>

        <button className="fdp-hero-back" onClick={() => navigate(-1)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Back
        </button>
      </div>

      {/* ── Body ── */}
      <div className="fdp-body">
        <div className="fdp-body-inner">

          {/* ── Main column ── */}
          <div className="fdp-main">
            <section className="fdp-section">
              <h2 className="fdp-section-title"><span className="fdp-section-icon"></span> About</h2>
              <p className="fdp-body-text">{food.description}</p>
            </section>

            {food.cultural_significance && (
              <section className="fdp-section fdp-section--tinted">
                <h2 className="fdp-section-title"><span className="fdp-section-icon"></span> Cultural Significance</h2>
                <p className="fdp-body-text">{food.cultural_significance}</p>
              </section>
            )}

            {food.preparation_summary && (
              <section className="fdp-section">
                <h2 className="fdp-section-title"><span className="fdp-section-icon"></span> How It's Made</h2>
                <p className="fdp-body-text">{food.preparation_summary}</p>
              </section>
            )}

            {food.ingredients?.length > 0 && (
              <section className="fdp-section">
                <h2 className="fdp-section-title"><span className="fdp-section-icon"></span> Ingredients</h2>
                <div className="fdp-ingredients">
                  {food.ingredients.map((ing, i) => (
                    <div key={i} className="fdp-ingredient-pill">
                      <span className="fdp-ingredient-dot" />
                      {ing}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {food.tags?.length > 0 && (
              <section className="fdp-section">
                <h2 className="fdp-section-title"><span className="fdp-section-icon">🏷</span> Tags</h2>
                <div className="fdp-tags">
                  {food.tags.map((tag, i) => (
                    <span key={i} className="fdp-tag">#{tag}</span>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ── Sidebar ── */}
          <aside className="fdp-sidebar">

            {/* Quick info */}
            <div className="fdp-sidebar-card">
              <h3 className="fdp-sidebar-card-title">Quick Info</h3>
              <div className="fdp-info-rows">
                {food.culture_name && (
                  <div className="fdp-info-row">
                    <span className="fdp-info-icon">🏘️</span>
                    <div>
                      <p className="fdp-info-label">Community</p>
                      <p className="fdp-info-value">{food.culture_name}</p>
                    </div>
                  </div>
                )}
                {food.location && (
                  <div className="fdp-info-row">
                    <span className="fdp-info-icon">📍</span>
                    <div>
                      <p className="fdp-info-label">Location</p>
                      <p className="fdp-info-value">{food.location}</p>
                    </div>
                  </div>
                )}
                {vegMeta && (
                  <div className="fdp-info-row">
                    <span className="fdp-info-icon">🥬</span>
                    <div>
                      <p className="fdp-info-label">Diet</p>
                      <p className="fdp-info-value" style={{ color: vegMeta.color }}>{vegMeta.label}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Contributor card — only for user-submitted foods ── */}
            {isUserContributed && (
              <ContributorCard
                name={food.contributor_name}
                picture={food.contributor_picture}
              />
            )}

            {/* Attributes */}
            {Object.keys(attrs).length > 0 && (
              <div className="fdp-sidebar-card">
                <h3 className="fdp-sidebar-card-title">Details</h3>
                <div className="fdp-attr-list">
                  {Object.entries(attrs).map(([type, values]) => {
                    const meta = ATTR_META[type];
                    if (!meta) return null;
                    return (
                      <div key={type} className="fdp-attr-row">
                        <span className="fdp-attr-icon">{meta.icon}</span>
                        <div className="fdp-attr-content">
                          <p className="fdp-attr-label">{meta.label}</p>
                          <div className="fdp-attr-chips">
                            {values.map(v => (
                              <span key={v} className="fdp-attr-chip">{v}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Explore more */}
            <div className="fdp-sidebar-card fdp-sidebar-card--cta">
              <h3 className="fdp-sidebar-card-title">Explore More</h3>
              <p className="fdp-cta-text">
                Discover more traditional foods from the {food.culture_name} community.
              </p>
              <Link to={`/foods?category=${food.category_slug}`} className="fdp-cta-btn">
                Browse {food.category_name} Foods →
              </Link>
            </div>

          </aside>
        </div>
      </div>

      {/* ══ YOU MAY ALSO LIKE ══════════════════════════════════ */}
      {recs.length > 0 && (
        <section className="fdp-recs">
          <div className="fdp-recs-inner">
            <div className="fdp-recs-header">
              <h2 className="fdp-recs-title">You May Also Like</h2>
              <p className="fdp-recs-sub">Based on taste, culture, and festival similarity</p>
            </div>
            <div className="fdp-recs-scroll">
              {recs.map(rec => (
                <RecCard key={rec.food_id} food={rec} onClick={() => navigate(`/food/${rec.food_id}`)} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}