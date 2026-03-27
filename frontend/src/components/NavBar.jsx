/* eslint-disable no-unused-vars */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getApprovedFoods } from '../api/foodService';
import './NavBar.css';

/* ── Avatar: profile pic or initials fallback ── */
function Avatar({ src, name, size = 36, className = '' }) {
  const [err, setErr] = useState(false);
  const initials = (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  if (src && !err) {
    return (
      <img src={src} alt={name || 'User'} className={className} onError={() => setErr(true)}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
    );
  }
  return (
    <span className={`nav-initials ${className}`} style={{ width: size, height: size, fontSize: size * 0.36, flexShrink: 0 }}>
      {initials}
    </span>
  );
}

const SearchIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);
const CloseIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const ChevronIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

/* ── Live search hook ── */
function useLiveSearch(query) {
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await getApprovedFoods({ search: query.trim() });
        setResults((res.data.data.foods || []).slice(0, 7));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 320);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  // ✅ FIX: expose setResults
  return { results, searching, setResults };
}

/* ── Search box with live dropdown ── */
function SearchBox({ className = '' }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  // ✅ FIX: get setResults from hook
  const { results, searching, setResults } = useLiveSearch(query);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const showDropdown = open && query.trim().length >= 2;

  const handleSelect = (food) => {
    navigate(`/food/${food.food_id}`);
    setQuery('');
    setOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/foods?q=${encodeURIComponent(query.trim())}`);
      setOpen(false);
    }
  };

  return (
    <div className={`nav-search-wrap ${className}`} ref={wrapRef}>
      <form className="nav-search" onSubmit={handleSubmit}>
        <span className="nav-search-icon"><SearchIcon /></span>
        <input
          type="text"
          className="nav-search-input"
          placeholder="Search foods, cultures…"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          autoComplete="off"
        />
        {query && (
          <button type="button" className="nav-search-clear"
            onClick={() => { setQuery(''); setResults([]); }}>
            ✕
          </button>
        )}
        <button type="submit" className="nav-search-btn">Search</button>
      </form>

      {showDropdown && (
        <div className="nav-search-dropdown">
          {searching && (
            <div className="nav-search-state">
              <span className="nav-search-spinner" />
              <span>Searching…</span>
            </div>
          )}
          {!searching && results.length === 0 && (
            <div className="nav-search-state nav-search-empty">
              No foods found for "<strong>{query}</strong>"
            </div>
          )}
          {!searching && results.map(food => (
            <button key={food.food_id} className="nav-search-item" onClick={() => handleSelect(food)}>
              {food.image_url
                ? <img src={food.image_url} alt={food.food_name} className="nav-search-item-img" />
                : <span className="nav-search-item-placeholder">🍽️</span>
              }
              <div className="nav-search-item-body">
                <span className="nav-search-item-name">{food.food_name}</span>
                {food.culture_name && (
                  <span className="nav-search-item-culture">{food.culture_name}</span>
                )}
              </div>
              {food.veg_status && (
                <span className={`nav-search-veg nav-search-veg--${food.veg_status}`} />
              )}
            </button>
          ))}
          {!searching && results.length > 0 && (
            <button className="nav-search-see-all" onClick={handleSubmit}>
              See all results for "<strong>{query}</strong>" →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function NavBar({ onAboutClick }) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropOpen,   setDropOpen]   = useState(false);
  const [user,       setUser]       = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const dropRef = useRef(null);

  const token      = localStorage.getItem('token');
  const isLoggedIn = !!token && !!user;

  useEffect(() => {
    const handler = (e) => {
      const updated = e.detail || JSON.parse(localStorage.getItem('user') || 'null');
      setUser(updated);
    };
    window.addEventListener('profile-updated', handler);
    return () => window.removeEventListener('profile-updated', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    if (dropOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropOpen]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setDropOpen(false);
    navigate('/');
  };

  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <Link to="/" className="nav-brand">
            <span className="nav-brand-text">
              <span className="nav-brand-k">Khana</span>
              <span className="nav-brand-s"> Sanskriti</span>
            </span>
          </Link>

          <SearchBox />

          <div className="nav-right">
            <a href="#about" className="nav-link" onClick={onAboutClick || undefined}>About Us</a>
            <Link to="/contribute" className="nav-contribute">✦ Contribute</Link>

            {isLoggedIn ? (
              <div className="nav-avatar-wrap" ref={dropRef}>
                <button className="nav-avatar-btn" onClick={() => setDropOpen(o => !o)}>
                  <Avatar src={user.profile_picture} name={user.name} size={34} className="nav-avatar-img" />
                  <ChevronIcon />
                </button>
                {dropOpen && (
                  <div className="nav-dropdown">
                    <div className="nav-drop-header">
                      <Avatar src={user.profile_picture} name={user.name} size={42} className="nav-drop-av" />
                      <div>
                        <p className="nav-drop-name">{user.name}</p>
                        <p className="nav-drop-email">{user.email}</p>
                      </div>
                    </div>
                    <div className="nav-drop-divider" />
                    <Link to="/homeUser" className="nav-drop-item" onClick={() => setDropOpen(false)}>🍽 Community Feed</Link>
                    <Link to="/profile" className="nav-drop-item" onClick={() => setDropOpen(false)}>👤 My Profile</Link>
                    <div className="nav-drop-divider" />
                    <button className="nav-drop-item nav-drop-logout" onClick={handleLogout}><LogoutIcon /> Logout</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="nav-auth">
                <Link to="/login"  className="nav-login">Login</Link>
                <Link to="/signup" className="nav-signup">Sign Up</Link>
              </div>
            )}
          </div>

          <button className="nav-hamburger" onClick={() => setMobileOpen(o => !o)}>
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>

        <div className="nav-mobile-search">
          <SearchBox className="nav-search-mob-wrap" />
        </div>
      </nav>

      {mobileOpen && (
        <div className="nav-drawer">
          <a href="#about" className="nav-drawer-link" onClick={(e) => { onAboutClick?.(e); setMobileOpen(false); }}>About Us</a>
          <Link to="/contribute" className="nav-drawer-link nav-drawer-contribute" onClick={() => setMobileOpen(false)}>✦ Contribute a Food</Link>
          {isLoggedIn ? (
            <>
              <div className="nav-drawer-user">
                <Avatar src={user.profile_picture} name={user.name} size={42} className="nav-drawer-av" />
                <div>
                  <p className="nav-drawer-name">{user.name}</p>
                  <p className="nav-drawer-email">{user.email}</p>
                </div>
              </div>
              <Link to="/homeUser" className="nav-drawer-link" onClick={() => setMobileOpen(false)}>🍽 Community Feed</Link>
              <Link to="/profile" className="nav-drawer-link" onClick={() => setMobileOpen(false)}>👤 My Profile</Link>
              <button className="nav-drawer-logout" onClick={handleLogout}><LogoutIcon /> Logout</button>
            </>
          ) : (
            <div className="nav-drawer-auth">
              <Link to="/login"  className="nav-drawer-login"  onClick={() => setMobileOpen(false)}>Login</Link>
              <Link to="/signup" className="nav-drawer-signup" onClick={() => setMobileOpen(false)}>Sign Up</Link>
            </div>
          )}
        </div>
      )}
    </>
  );
}