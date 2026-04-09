import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import NavBar from '../components/NavBar';
import { getApprovedFoods } from '../api/foodService';
import './FoodCategoryPage.css';

/* ── Category definitions ── */
const CATEGORIES = [
  {
    id: 'newari',
    label: 'Newari',
    nepali: 'नेवारी',
    desc: 'The Newar community — original inhabitants of the Kathmandu Valley — have one of Nepal\'s oldest and most elaborate food cultures. Deeply tied to Buddhism and Hinduism, Newari cuisine features rice-based dishes, dried and fermented foods, and rich feasts served during festivals like Indra Jatra and Yomari Punhi.',
    extendedDesc: 'Signature dishes include Yomari (a steamed rice-flour dumpling), Chatamari (the Newari pizza), Bara (black lentil pancakes), and Kwati (a mixed sprout soup). Newari meals are traditionally served on special occasions as elaborate multi-course feasts called Samay Baji.',
    cultures: ['Newari'],
    accent: '#7c2d2d',
    accentLight: '#f9f0f0',
    image: 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=800&q=80',
    // DB culture_name values that match this category for search
    searchCultures: ['Newari'],
  },
  {
    id: 'brahmin-chhetri',
    label: 'Brahmin / Chhetri',
    nepali: 'ब्राह्मण / क्षेत्री',
    desc: 'Rooted in Hindu ritual and the mid-hill agricultural calendar, Brahmin and Chhetri cuisine is built around dal bhat (lentils and rice), ghee, seasonal vegetables, and festival sweets. Simplicity, purity, and seasonality define this tradition.',
    extendedDesc: 'Dal Bhat Tarkari is the cornerstone — lentil soup, steamed rice, and vegetable curry served twice daily. Festivals bring Sel Roti (crispy ring doughnuts), Kheer (rice pudding), and Achar (pickles). Ghee is used liberally in ritual cooking and is considered auspicious.',
    cultures: ['Brahmin/Chhetri'],
    accent: '#1f6058',
    accentLight: '#edf7f5',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80',
    searchCultures: ['Brahmin/Chhetri', 'Brahmin', 'Chhetri'],
  },
  {
    id: 'madhesi',
    label: 'Madhesi',
    nepali: 'मधेसी',
    desc: 'From the fertile Terai plains, Madhesi and Tharu communities have developed a rich cuisine shaped by the Gangetic tradition. Rice, mustard oil, fish from the rivers, and the great festival of Chhath Puja define this vibrant food culture.',
    extendedDesc: 'Thekuwa (wheat and jaggery sweet), Dhikri (steamed rice cake), Anarsa (sesame rice sweet), and Malpua (sweet pancakes) are made during Chhath. Everyday cooking features mustard-heavy curries, roasted lentils, and freshwater fish preparations.',
    cultures: ['Madhesi', 'Tharu'],
    accent: '#92400e',
    accentLight: '#fef3c7',
    image: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=800&q=80',
    searchCultures: ['Madhesi', 'Tharu', 'Maithili'],
  },
  {
    id: 'janajati',
    label: 'Janajati',
    nepali: 'जनजाति',
    desc: 'Nepal\'s diverse indigenous nationalities — Tamang, Rai, Gurung, Magar, Limbu, Sherpa, Thakali and more — each carry distinct food traditions shaped by altitude, ecology, and centuries of unique cultural practice.',
    extendedDesc: 'At high altitudes, Sherpa and Tamang communities rely on tsampa (roasted barley flour), butter tea, and yak dairy. Rai and Limbu communities ferment vegetables and meats uniquely. Thakali cuisine from Mustang is celebrated across Nepal for its bold flavors, buckwheat dishes, and warming lamb preparations.',
    cultures: ['Janajati', 'Tamang', 'Gurung', 'Rai', 'Limbu', 'Sherpa', 'Thakali', 'Magar'],
    accent: '#1d4ed8',
    accentLight: '#eff6ff',
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
    searchCultures: ['Janajati', 'Tamang', 'Gurung', 'Rai', 'Limbu', 'Sherpa', 'Thakali', 'Magar'],
  },
];

/* ── Food card ── */
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

/* ── Main page ── */
export default function FoodCategoryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeCatId, setActiveCatId] = useState(
    searchParams.get('category') || 'newari'
  );
  const meta = CATEGORIES.find(c => c.id === activeCatId) || CATEGORIES[0];

  const [search,      setSearch]      = useState(searchParams.get('q') || '');
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');

  const [foods,   setFoods]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  // Sync state → URL
  useEffect(() => {
    const p = { category: activeCatId };
    if (search) p.q = search;
    setSearchParams(p, { replace: true });
  }, [activeCatId, search, setSearchParams]);

  // Fetch foods — searches across all cultures in the category
  const fetchFoods = useCallback(async () => {
    setLoading(true); setError('');
    try {
      // Fetch with category_slug — backend should handle this
      const params = { category_slug: activeCatId };
      if (search) params.search = search;

      const res  = await getApprovedFoods(params);
      let   data = res.data.data.foods || [];

      // Client-side: also filter by culture names if backend doesn't group correctly
      // This ensures Janajati shows all sub-groups (Tamang, Sherpa etc)
      if (!search && meta.searchCultures && meta.searchCultures.length > 0) {
        // Only apply client filter if backend returns broader results
        // If data is already correct, this is a no-op
        const filtered = data.filter(f =>
          meta.searchCultures.some(sc =>
            f.culture_name?.toLowerCase().includes(sc.toLowerCase()) ||
            sc.toLowerCase().includes(f.culture_name?.toLowerCase())
          )
        );
        // Use filtered only if it has results, otherwise use raw (backend may have handled it)
        if (filtered.length > 0) data = filtered;
      }

      setFoods(data);
    } catch {
      setError('Failed to load foods. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [activeCatId, search, meta.searchCultures]);

  useEffect(() => { fetchFoods(); }, [fetchFoods]);

  const switchCategory = (id) => {
    setActiveCatId(id);
    setSearch('');
    setSearchInput('');
  };

  return (
    <div className="fcp">
      <NavBar />

      {/* PAGE HEADER */}
      <div className="fcp-page-header">
        <div className="fcp-page-header-inner">
          <h1 className="fcp-page-title">Explore Foods by Culture</h1>
          <p className="fcp-page-sub">Select a community to discover its traditional dishes</p>
        </div>
      </div>

      {/* CATEGORY TABS */}
      <div className="fcp-cat-bar">
        <div className="fcp-cat-bar-inner">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`fcp-cat-tab ${activeCatId === cat.id ? 'active' : ''}`}
              style={{ '--tab-accent': cat.accent, '--tab-light': cat.accentLight }}
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

      {/* BODY: description sidebar + food grid */}
      <div className="fcp-body">

        {/* ── Description sidebar (replaces filters) ── */}
        <aside className="fcp-sidebar">
          <div className="fcp-desc-panel" style={{ '--accent': meta.accent, '--accent-light': meta.accentLight }}>
            <div className="fcp-desc-header">
              <span className="fcp-desc-nepali">{meta.nepali}</span>
              <h2 className="fcp-desc-title" style={{ color: meta.accent }}>{meta.label}</h2>
            </div>
            <p className="fcp-desc-body">{meta.desc}</p>
            {meta.extendedDesc && (
              <p className="fcp-desc-body fcp-desc-extended">{meta.extendedDesc}</p>
            )}
            {meta.cultures.length > 1 && (
              <div className="fcp-desc-communities">
                <p className="fcp-desc-communities-label">Communities</p>
                <div className="fcp-desc-chips">
                  {meta.cultures.map(c => (
                    <span key={c} className="fcp-desc-chip" style={{ background: meta.accentLight, color: meta.accent }}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="fcp-main">
          {/* Search bar */}
          <form
            className="fcp-search-wrap-main"
            onSubmit={e => { e.preventDefault(); setSearch(searchInput); }}
          >
            <svg className="fcp-search-icon-main" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder={`Search ${meta.label} dishes…`}
              className="fcp-search-input-main"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              style={{ '--accent': meta.accent }}
            />
            {searchInput && (
              <button type="button" className="fcp-search-clear-main"
                onClick={() => { setSearchInput(''); setSearch(''); }}>✕</button>
            )}
            <button type="submit" className="fcp-search-btn-main" style={{ background: meta.accent }}>
              Search
            </button>
          </form>

          {/* Result count */}
          <div className="fcp-result-bar">
            <p className="fcp-result-count">
              {loading
                ? 'Loading…'
                : <><strong>{foods.length}</strong> {foods.length === 1 ? 'dish' : 'dishes'} found in <strong>{meta.label}</strong>{search && <> matching "<em>{search}</em>"</>}</>
              }
            </p>
            {search && (
              <button className="fcp-search-clear-pill" onClick={() => { setSearch(''); setSearchInput(''); }}>
                Clear search ✕
              </button>
            )}
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
                {search ? 'Try a different search term.' : `No ${meta.label} foods in the database yet.`}
              </p>
              {search && (
                <button className="fcp-retry-btn" style={{ background: meta.accent }} onClick={() => { setSearch(''); setSearchInput(''); }}>
                  Clear search
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