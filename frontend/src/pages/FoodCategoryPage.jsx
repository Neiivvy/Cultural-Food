import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import NavBar from '../components/NavBar';
import { getApprovedFoods } from '../api/foodService';
import './FoodCategoryPage.css';

/* ── Category definitions ──────────────────────────────────────── */
const CATEGORIES = [
  {
    id: 'newari',
    label: 'Newari',
    nepali: 'नेवारी',
    desc: 'The Newar community  original inhabitants of the Kathmandu Valley , have one of Nepal\'s oldest and most elaborate food cultures.',
    cultures: ['Newari'],
    accent: '#7c2d2d',
    accentLight: '#f9f0f0',
    image: 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=800&q=80',
  },
  {
    id: 'brahmin-chhetri',
    label: 'Brahmin / Chhetri',
    nepali: 'ब्राह्मण / क्षेत्री',
    desc: 'Rooted in Hindu ritual and the mid-hill agricultural calendar dal bhat, ghee, seasonal vegetables, and festival sweets.',
    cultures: ['Brahmin/Chhetri'],
    accent: '#1f6058',
    accentLight: '#edf7f5',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80',
  },
  {
    id: 'madhesi',
    label: 'Madhesi',
    nepali: 'मधेसी',
    desc: 'From the fertile Terai plains Madhesi and Tharu communities shaped by the Gangetic tradition and festivals like Chhath.',
    cultures: ['Madhesi'],
    accent: '#92400e',
    accentLight: '#fef3c7',
    image: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=800&q=80',
  },
  {
    id: 'janajati',
    label: 'Janajati',
    nepali: 'जनजाति',
    desc: 'Nepal\'s diverse indigenous nationalities Tamang, Rai, Gurung, Magar, Limbu, Sherpa, Thakali and more.',
    cultures: ['Janajati'],
    accent: '#1d4ed8',
    accentLight: '#eff6ff',
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
  },
];

/* ── Filter definitions ─────────────────────────────────────────── */
const FILTER_DEFS = [
  { key: 'taste',      label: 'Taste',      options: ['Sweet','Spicy','Sour','Salty','Bitter','Umami','Mixed'] },
  { key: 'season',     label: ' Season',     options: ['Spring','Summer','Autumn','Winter','All Season'] },
  { key: 'festival',   label: 'Festival',   options: ['Dashain','Tihar','Chhath','Maghe Sankranti','Indra Jatra','Yomari Punhi','Maghi','Janai Purnima'] },
  { key: 'meal_type',  label: 'Meal',       options: ['Breakfast','Lunch','Dinner','Snack','Dessert'] },
  { key: 'occasion',   label: 'Occasion',   options: ['Festival','Wedding','Everyday','Offering'] },
  { key: 'ingredient', label: 'Ingredient', options: ['Rice','Lentil','Meat','Buckwheat','Millet','Barley','Dairy','Vegetables','Legumes'] },
  { key: 'veg_status', label: 'Diet',       options: ['veg','non-veg','vegan'] },
];

/* ── Food card ─────────────────────────────────────────────────── */
function FoodCard({ food, accent, onClick }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <article className="fcp-card" onClick={onClick}>
      <div className="fcp-card-img-wrap">
        {food.image_url && !imgErr
          ? <img src={food.image_url} alt={food.food_name} onError={() => setImgErr(true)} className="fcp-card-img" />
          : <div className="fcp-card-img-placeholder">🍽️</div>
        }
        {food.veg_status && (
          <span className={`fcp-veg-dot fcp-veg-dot--${food.veg_status}`} title={food.veg_status} />
        )}
      </div>
      <div className="fcp-card-body">
        <p className="fcp-card-culture" style={{ color: accent }}>{food.culture_name}</p>
        <h3 className="fcp-card-name">{food.food_name}</h3>
        {food.food_name_nepali && <p className="fcp-card-nepali">{food.food_name_nepali}</p>}
        <p className="fcp-card-desc">
          {food.description?.slice(0, 85)}{food.description?.length > 85 ? '…' : ''}
        </p>
        {food.location && <span className="fcp-card-loc">📍 {food.location}</span>}
      </div>
    </article>
  );
}

/* ── Main page ─────────────────────────────────────────────────── */
export default function FoodCategoryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active category — from URL or default to first
  const [activeCatId, setActiveCatId] = useState(
    searchParams.get('category') || 'newari'
  );
  const meta = CATEGORIES.find(c => c.id === activeCatId) || CATEGORIES[0];

  // Filters
  const [filters, setFilters] = useState(() => {
    const f = {};
    FILTER_DEFS.forEach(d => { const v = searchParams.get(d.key); if (v) f[d.key] = v; });
    if (searchParams.get('culture')) f.culture = searchParams.get('culture');
    return f;
  });
  const [search,      setSearch]      = useState(searchParams.get('q') || '');
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
  const [openSection, setOpenSection] = useState('taste');

  const [foods,   setFoods]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  // Sync state → URL
  useEffect(() => {
    const p = { category: activeCatId };
    Object.entries(filters).forEach(([k, v]) => { if (v) p[k] = v; });
    if (search) p.q = search;
    setSearchParams(p, { replace: true });
  }, [activeCatId, filters, search, setSearchParams]);

  // Fetch foods whenever category or filters change
  const fetchFoods = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = { category_slug: activeCatId };
      FILTER_DEFS.forEach(d => {
        if (d.key !== 'veg_status' && filters[d.key]) params[d.key] = filters[d.key];
      });
      if (filters.veg_status) params.veg_status = filters.veg_status;
      if (search) params.search = search;

    
      const res  = await getApprovedFoods(params);
      let   data = res.data.data.foods || [];

      // Client-side sub-culture filter
      if (filters.culture) {
        data = data.filter(f => f.culture_name === filters.culture);
      }
      setFoods(data);
    } catch {
      setError('Failed to load foods. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [activeCatId, filters, search]);

  useEffect(() => { fetchFoods(); }, [fetchFoods]);

  const switchCategory = (id) => {
    setActiveCatId(id);
    setFilters({});
    setSearch('');
    setSearchInput('');
  };

  const toggleFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: prev[key] === value ? undefined : value }));
  };

  const clearAll = () => { setFilters({}); setSearch(''); setSearchInput(''); };

  const activeCount = Object.values(filters).filter(Boolean).length + (search ? 1 : 0);

  return (
    <div className="fcp">
      <NavBar />

      {/* ════════════════════════════════════════════════════════
          PAGE HEADER — title + breadcrumb
         ════════════════════════════════════════════════════════ */}
      <div className="fcp-page-header">
        <div className="fcp-page-header-inner">
         
          <h1 className="fcp-page-title">Explore Foods by Culture</h1>
          <p className="fcp-page-sub">Select a community to discover its traditional dishes</p>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          CATEGORY TABS
         ════════════════════════════════════════════════════════ */}
      <div className="fcp-cat-bar">
        <div className="fcp-cat-bar-inner">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`fcp-cat-tab ${activeCatId === cat.id ? 'active' : ''}`}
              style={{
                '--tab-accent':  cat.accent,
                '--tab-light':   cat.accentLight,
              }}
              onClick={() => switchCategory(cat.id)}
            >
              <div className="fcp-cat-tab-img-wrap">
                <img src={cat.image} alt={cat.label} className="fcp-cat-tab-img" />
                <div className="fcp-cat-tab-img-scrim" />
              </div>
              <div className="fcp-cat-tab-text">
                <span className="fcp-cat-tab-nepali">{cat.nepali}</span>
                <span className="fcp-cat-tab-label">{cat.label}</span>
              </div>
              {activeCatId === cat.id && <div className="fcp-cat-tab-bar" />}
            </button>
          ))}
        </div>
      </div>

      {/* Active category description strip */}
      <div className="fcp-cat-desc-strip" style={{ '--accent': meta.accent, '--accent-light': meta.accentLight }}>
        <div className="fcp-cat-desc-inner">
          <p className="fcp-cat-desc-text">{meta.desc}</p>
          {meta.cultures.length > 1 && (
            <div className="fcp-cat-culture-chips">
              {meta.cultures.map(c => (
                <button
                  key={c}
                  className={`fcp-culture-chip ${filters.culture === c ? 'active' : ''}`}
                  style={{ '--accent': meta.accent, '--accent-light': meta.accentLight }}
                  onClick={() => toggleFilter('culture', c)}
                >{c}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          BODY: sidebar + food grid
         ════════════════════════════════════════════════════════ */}
      <div className="fcp-body">

        {/* ── Sidebar ── */}
        <aside className="fcp-sidebar">
          <div className="fcp-sidebar-head">
            <h2 className="fcp-sidebar-title">Filters</h2>
            {activeCount > 0 && (
              <button className="fcp-clear-all" onClick={clearAll}>
                Clear ({activeCount})
              </button>
            )}
          </div>

          {/* Search */}
          <form
            className="fcp-search-wrap"
            onSubmit={e => { e.preventDefault(); setSearch(searchInput); }}
          >
            <svg className="fcp-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text" placeholder="Search dishes…"
              className="fcp-search-input"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              style={{ '--accent': meta.accent }}
            />
            {searchInput && (
              <button type="button" className="fcp-search-clear"
                onClick={() => { setSearchInput(''); setSearch(''); }}>✕</button>
            )}
          </form>

          {/* Accordion filters */}
          {FILTER_DEFS.map(def => (
            <div key={def.key} className={`fcp-filter-section ${openSection === def.key ? 'open' : ''}`}>
              <button
                className="fcp-filter-header"
                onClick={() => setOpenSection(openSection === def.key ? '' : def.key)}
              >
                <span className="fcp-filter-label">{def.label}</span>
                {filters[def.key] && (
                  <span className="fcp-filter-active-badge" style={{ background: meta.accent }}>
                    {filters[def.key]}
                  </span>
                )}
                <svg className="fcp-filter-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              <div className="fcp-filter-body">
                <div className="fcp-chip-list">
                  {def.options.map(opt => (
                    <button
                      key={opt}
                      className={`fcp-chip ${filters[def.key] === opt ? 'active' : ''}`}
                      style={{ '--accent': meta.accent, '--accent-light': meta.accentLight }}
                      onClick={() => toggleFilter(def.key, opt)}
                    >{opt}</button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </aside>

        {/* ── Main content ── */}
        <main className="fcp-main">

          {/* Active pills */}
          {activeCount > 0 && (
            <div className="fcp-active-pills">
              {Object.entries(filters).map(([k, v]) => v ? (
                <button key={k} className="fcp-pill" style={{ '--accent': meta.accent }} onClick={() => toggleFilter(k, v)}>
                  {v} <span>✕</span>
                </button>
              ) : null)}
              {search && (
                <button className="fcp-pill" style={{ '--accent': meta.accent }}
                  onClick={() => { setSearch(''); setSearchInput(''); }}>
                  "{search}" <span>✕</span>
                </button>
              )}
            </div>
          )}

          {/* Result count */}
          <div className="fcp-result-bar">
            <p className="fcp-result-count">
              {loading
                ? 'Loading…'
                : <><strong>{foods.length}</strong> {foods.length === 1 ? 'dish' : 'dishes'} found in <strong>{meta.label}</strong></>
              }
            </p>
          </div>

          {/* Loading */}
          {loading && (
            <div className="fcp-state">
              <div className="fcp-spinner" style={{ borderTopColor: meta.accent }} />
              <p>Loading dishes…</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="fcp-state">
              <span style={{ fontSize: '2.5rem' }}>⚠️</span>
              <p className="fcp-state-msg">{error}</p>
              <button className="fcp-retry-btn" style={{ background: meta.accent }} onClick={fetchFoods}>Try again</button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && foods.length === 0 && (
            <div className="fcp-state">
              <span style={{ fontSize: '3rem' }}>🍽️</span>
              <h3 className="fcp-state-title">No dishes found</h3>
              <p className="fcp-state-msg">
                {activeCount > 0
                  ? 'Try adjusting or clearing your filters.'
                  : `No ${meta.label} foods in the database yet.`
                }
              </p>
              {activeCount > 0 && (
                <button className="fcp-retry-btn" style={{ background: meta.accent }} onClick={clearAll}>
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* Grid */}
          {!loading && !error && foods.length > 0 && (
            <div className="fcp-grid">
              {foods.map(food => (
                <FoodCard
                  key={food.food_id}
                  food={food}
                  accent={meta.accent}
                  onClick={() => navigate(`/food/${food.food_id}`)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}