import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import NavBar from '../components/NavBar';
import { getApprovedFoods } from '../api/foodService';
import './FoodCategoryPage.css';

/* ── Category metadata ─────────────────────────────────────────── */
const CATEGORY_META = {
  'newari': {
    label: 'Newari', nepali: 'नेवारी',
    desc: 'Explore the rich food traditions of the Newar community — the original inhabitants of the Kathmandu Valley.',
    cultures: ['Newari'],
    color: '#7c2d2d', bg: '#f9f0f0',
    image: 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=1400&q=80',
  },
  'brahmin-chhetri': {
    label: 'Brahmin / Chhetri', nepali: 'ब्राह्मण / क्षेत्री',
    desc: 'Discover traditional foods of the Brahmin and Chhetri hill communities — rooted in Hindu ritual and the mid-hill agricultural calendar.',
    cultures: ['Brahmin/Chhetri'],
    color: '#1f6058', bg: '#edf7f5',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1400&q=80',
  },
  'madhesi': {
    label: 'Madhesi', nepali: 'मधेसी',
    desc: 'Foods of the Terai plains — Madhesi and Tharu communities shaped by the fertile lowlands and the Gangetic tradition.',
    cultures: ['Madhesi', 'Tharu'],
    color: '#92400e', bg: '#fef3c7',
    image: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=1400&q=80',
  },
  'janajati': {
    label: 'Janajati', nepali: 'जनजाति',
    desc: "Nepal's diverse indigenous nationalities — Tamang, Rai, Gurung, Magar, Limbu, Sherpa, Thakali and more.",
    cultures: ['Tamang', 'Rai', 'Gurung', 'Magar', 'Limbu', 'Sherpa', 'Thakali'],
    color: '#1d4ed8', bg: '#eff6ff',
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1400&q=80',
  },
};

const SEASONS   = ['Spring', 'Summer', 'Autumn', 'Winter', 'All Season'];
const TASTES    = ['Sweet', 'Spicy', 'Sour', 'Salty', 'Bitter', 'Umami', 'Mixed'];
const FESTIVALS = ['Dashain', 'Tihar', 'Chhath', 'Maghe Sankranti', 'Indra Jatra', 'Yomari Punhi', 'Maghi', 'Janai Purnima'];
const MEALS     = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'];

/* ── Food card ─────────────────────────────────────────────────── */
function FoodCard({ food, onClick }) {
  return (
    <div className="fcp-food-card" onClick={onClick}>
      <div className="fcp-food-img-wrap">
        {food.image_url
          ? <img src={food.image_url} alt={food.food_name} className="fcp-food-img" />
          : <div className="fcp-food-img-placeholder">🍽️</div>
        }
      </div>
      <div className="fcp-food-body">
        <p className="fcp-food-culture">{food.culture_name || '—'}</p>
        <h3 className="fcp-food-name">{food.food_name}</h3>
        {food.food_name_nepali && (
          <p className="fcp-food-nepali">{food.food_name_nepali}</p>
        )}
        <p className="fcp-food-desc">
          {food.description?.slice(0, 90)}{food.description?.length > 90 ? '…' : ''}
        </p>
        <div className="fcp-food-tags">
          {food.location && <span className="fcp-tag">📍 {food.location}</span>}
        </div>
      </div>
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────────── */
export default function FoodCategoryPage() {
  const { categoryId }  = useParams();
  const navigate        = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const meta = CATEGORY_META[categoryId];

  // Filter state — initialise from URL params
  const [activeCulture,  setActiveCulture]  = useState(searchParams.get('culture')  || '');
  const [activeSeason,   setActiveSeason]   = useState(searchParams.get('season')   || '');
  const [activeTaste,    setActiveTaste]    = useState(searchParams.get('taste')     || '');
  const [activeFestival, setActiveFestival] = useState(searchParams.get('festival') || '');
  const [activeMeal,     setActiveMeal]     = useState(searchParams.get('meal')     || '');
  const [search,         setSearch]         = useState(searchParams.get('q')        || '');
  const [searchInput,    setSearchInput]    = useState(searchParams.get('q')        || '');

  const [foods,   setFoods]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  // Redirect if category unknown
  useEffect(() => {
    if (!meta) navigate('/', { replace: true });
  }, [meta, navigate]);

  // Sync filters → URL params
  useEffect(() => {
    const p = {};
    if (activeCulture)  p.culture  = activeCulture;
    if (activeSeason)   p.season   = activeSeason;
    if (activeTaste)    p.taste    = activeTaste;
    if (activeFestival) p.festival = activeFestival;
    if (activeMeal)     p.meal     = activeMeal;
    if (search)         p.q        = search;
    setSearchParams(p, { replace: true });
  }, [activeCulture, activeSeason, activeTaste, activeFestival, activeMeal, search, setSearchParams]);

  // Fetch foods from API
  const fetchFoods = useCallback(async () => {
    if (!meta) return;
    setLoading(true); setError('');
    try {
      // Build culture_id list from category cultures
      // For now pass culture names as search hint — backend will filter by culture_id
      const params = {};
      if (activeSeason)   params.season   = activeSeason;
      if (activeTaste)    params.taste    = activeTaste;
      if (activeFestival) params.festival = activeFestival;
      if (search)         params.search   = search;
      // Culture filter: if activeCulture set use that, else pass all cultures for this category
      if (activeCulture)  params.culture_name = activeCulture;
      else                params.category     = categoryId;

      const res = await getApprovedFoods(params);
      setFoods(res.data.data.foods || []);
    } catch {
      setError('Failed to load foods. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [meta, categoryId, activeSeason, activeTaste, activeFestival, activeCulture, search]);

  useEffect(() => { fetchFoods(); }, [fetchFoods]);

  const clearFilters = () => {
    setActiveCulture(''); setActiveSeason(''); setActiveTaste('');
    setActiveFestival(''); setActiveMeal(''); setSearch(''); setSearchInput('');
  };

  const hasFilters = activeCulture || activeSeason || activeTaste || activeFestival || activeMeal || search;
  const activeCount = [activeCulture, activeSeason, activeTaste, activeFestival, activeMeal, search].filter(Boolean).length;

  if (!meta) return null;

  return (
    <div className="fcp">
      <NavBar />

      {/* ── Hero banner ── */}
      <div className="fcp-hero" style={{ '--cat-color': meta.color }}>
        <img src={meta.image} alt={meta.label} className="fcp-hero-img" />
        <div className="fcp-hero-overlay" />
        <div className="fcp-hero-inner">
          <Link to="/" className="fcp-breadcrumb">← Home</Link>
          <div className="fcp-hero-text">
            <span className="fcp-hero-nepali">{meta.nepali}</span>
            <h1 className="fcp-hero-title">{meta.label} Foods</h1>
            <p className="fcp-hero-desc">{meta.desc}</p>
            <div className="fcp-hero-cultures">
              {meta.cultures.map(c => (
                <span key={c} className="fcp-hero-chip">{c}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="fcp-body">
        <div className="fcp-body-inner">

          {/* ── Sidebar filters ── */}
          <aside className="fcp-sidebar">
            <div className="fcp-sidebar-header">
              <h3 className="fcp-sidebar-title">Filters</h3>
              {hasFilters && (
                <button className="fcp-clear-btn" onClick={clearFilters}>
                  Clear {activeCount > 0 ? `(${activeCount})` : ''}
                </button>
              )}
            </div>

            {/* Search */}
            <div className="fcp-filter-group">
              <p className="fcp-filter-label">Search</p>
              <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); }}
                className="fcp-search-form">
                <input
                  type="text"
                  className="fcp-search-input"
                  placeholder="Search dishes…"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                />
                <button type="submit" className="fcp-search-btn">→</button>
              </form>
            </div>

            {/* Community sub-filter (only for Janajati / Madhesi) */}
            {meta.cultures.length > 1 && (
              <div className="fcp-filter-group">
                <p className="fcp-filter-label">Community</p>
                <div className="fcp-chip-col">
                  {meta.cultures.map(c => (
                    <button
                      key={c}
                      className={`fcp-chip ${activeCulture === c ? 'active' : ''}`}
                      onClick={() => setActiveCulture(activeCulture === c ? '' : c)}
                      style={{ '--chip-color': meta.color }}
                    >{c}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Season */}
            <div className="fcp-filter-group">
              <p className="fcp-filter-label">🌿 Season</p>
              <div className="fcp-chip-col">
                {SEASONS.map(s => (
                  <button
                    key={s}
                    className={`fcp-chip ${activeSeason === s ? 'active' : ''}`}
                    onClick={() => setActiveSeason(activeSeason === s ? '' : s)}
                    style={{ '--chip-color': meta.color }}
                  >{s}</button>
                ))}
              </div>
            </div>

            {/* Taste */}
            <div className="fcp-filter-group">
              <p className="fcp-filter-label">👅 Taste</p>
              <div className="fcp-chip-col">
                {TASTES.map(t => (
                  <button
                    key={t}
                    className={`fcp-chip ${activeTaste === t ? 'active' : ''}`}
                    onClick={() => setActiveTaste(activeTaste === t ? '' : t)}
                    style={{ '--chip-color': meta.color }}
                  >{t}</button>
                ))}
              </div>
            </div>

            {/* Festival */}
            <div className="fcp-filter-group">
              <p className="fcp-filter-label">🎉 Festival</p>
              <div className="fcp-chip-col">
                {FESTIVALS.map(f => (
                  <button
                    key={f}
                    className={`fcp-chip ${activeFestival === f ? 'active' : ''}`}
                    onClick={() => setActiveFestival(activeFestival === f ? '' : f)}
                    style={{ '--chip-color': meta.color }}
                  >{f}</button>
                ))}
              </div>
            </div>

            {/* Meal type */}
            <div className="fcp-filter-group">
              <p className="fcp-filter-label">🍽 Meal Type</p>
              <div className="fcp-chip-col">
                {MEALS.map(m => (
                  <button
                    key={m}
                    className={`fcp-chip ${activeMeal === m ? 'active' : ''}`}
                    onClick={() => setActiveMeal(activeMeal === m ? '' : m)}
                    style={{ '--chip-color': meta.color }}
                  >{m}</button>
                ))}
              </div>
            </div>
          </aside>

          {/* ── Food grid ── */}
          <div className="fcp-main">

            {/* Active filter pills row */}
            {hasFilters && (
              <div className="fcp-active-filters">
                {activeCulture  && <span className="fcp-active-pill" onClick={() => setActiveCulture('')}>Community: {activeCulture} ✕</span>}
                {activeSeason   && <span className="fcp-active-pill" onClick={() => setActiveSeason('')}>Season: {activeSeason} ✕</span>}
                {activeTaste    && <span className="fcp-active-pill" onClick={() => setActiveTaste('')}>Taste: {activeTaste} ✕</span>}
                {activeFestival && <span className="fcp-active-pill" onClick={() => setActiveFestival('')}>Festival: {activeFestival} ✕</span>}
                {activeMeal     && <span className="fcp-active-pill" onClick={() => setActiveMeal('')}>Meal: {activeMeal} ✕</span>}
                {search         && <span className="fcp-active-pill" onClick={() => { setSearch(''); setSearchInput(''); }}>"{search}" ✕</span>}
              </div>
            )}

            {/* Result count */}
            <div className="fcp-result-bar">
              <p className="fcp-result-count">
                {loading ? 'Loading…' : `${foods.length} dish${foods.length !== 1 ? 'es' : ''} found`}
              </p>
            </div>

            {/* States */}
            {loading && (
              <div className="fcp-state">
                <div className="fcp-spinner" />
                <p>Loading dishes…</p>
              </div>
            )}
            {!loading && error && (
              <div className="fcp-state fcp-error">
                <p>{error}</p>
                <button className="fcp-retry" onClick={fetchFoods}>Try again</button>
              </div>
            )}
            {!loading && !error && foods.length === 0 && (
              <div className="fcp-state fcp-empty">
                <span className="fcp-empty-icon">🍽️</span>
                <h3>No dishes found</h3>
                <p>Try adjusting your filters or clearing them.</p>
                {hasFilters && (
                  <button className="fcp-retry" onClick={clearFilters}>Clear filters</button>
                )}
              </div>
            )}
            {!loading && !error && foods.length > 0 && (
              <div className="fcp-grid">
                {foods.map(food => (
                  <FoodCard
                    key={food.food_id}
                    food={food}
                    onClick={() => navigate(`/food/${food.food_id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}