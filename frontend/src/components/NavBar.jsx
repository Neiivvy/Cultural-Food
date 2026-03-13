import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './NavBar.css';

/* ── Avatar: shows profile pic or initials fallback ── */
function Avatar({ src, name, size = 36, className = '' }) {
  const [err, setErr] = useState(false);
  const initials = (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  if (src && !err) {
    return (
      <img
        src={src}
        alt={name || 'User'}
        className={className}
        onError={() => setErr(true)}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  return (
    <span
      className={`pnav-initials ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.36, flexShrink: 0 }}
    >
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
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);
const CloseIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
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

export default function NavBar() {
  const navigate = useNavigate();
  const [search,     setSearch]     = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropOpen,   setDropOpen]   = useState(false);
  const [user,       setUser]       = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const dropRef = useRef(null);

  const token      = localStorage.getItem('token');
  const isLoggedIn = !!token && !!user;

  // Update avatar instantly when profile is saved anywhere in the app
  useEffect(() => {
    const handler = (e) => {
      const updated = e.detail || JSON.parse(localStorage.getItem('user') || 'null');
      setUser(updated);
    };
    window.addEventListener('profile-updated', handler);
    return () => window.removeEventListener('profile-updated', handler);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    if (dropOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/?search=${encodeURIComponent(search.trim())}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setDropOpen(false);
    navigate('/');
  };

  return (
    <>
      <nav className="pnav">
        <div className="pnav-inner">

          {/* Brand */}
          <Link to="/" className="pnav-brand">
            <span className="pnav-brand-text">
              <span className="pnav-brand-k">Khana</span>
              <span className="pnav-brand-s"> Sanskriti</span>
            </span>
          </Link>

          {/* Search bar (desktop) */}
          <form className="pnav-search" onSubmit={handleSearch}>
            <span className="pnav-search-icon"><SearchIcon /></span>
            <input
              type="text"
              className="pnav-search-input"
              placeholder="Search foods, cultures…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button type="submit" className="pnav-search-btn">Search</button>
          </form>

          {/* Desktop right */}
          <div className="pnav-right">
            <Link to="/about"      className="pnav-link">About Us</Link>
            <Link to="/contribute" className="pnav-contribute">✦ Contribute</Link>

            {isLoggedIn ? (
              <div className="pnav-avatar-wrap" ref={dropRef}>
                <button className="pnav-avatar-btn" onClick={() => setDropOpen(o => !o)}>
                  <Avatar src={user.profile_picture} name={user.name} size={34} className="pnav-avatar-img" />
                  <ChevronIcon />
                </button>

                {dropOpen && (
                  <div className="pnav-dropdown">
                    <div className="pnav-drop-header">
                      <Avatar src={user.profile_picture} name={user.name} size={42} className="pnav-drop-av" />
                      <div>
                        <p className="pnav-drop-name">{user.name}</p>
                        <p className="pnav-drop-email">{user.email}</p>
                      </div>
                    </div>
                    <div className="pnav-drop-divider" />
                    <Link to="/homeUser" className="pnav-drop-item" onClick={() => setDropOpen(false)}>🍽 Community Feed</Link>
                    <Link to="/profile"  className="pnav-drop-item" onClick={() => setDropOpen(false)}>👤 My Profile</Link>
                    <div className="pnav-drop-divider" />
                    <button className="pnav-drop-item pnav-drop-logout" onClick={handleLogout}>
                      <LogoutIcon /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="pnav-auth">
                <Link to="/login"  className="pnav-login">Login</Link>
                <Link to="/signup" className="pnav-signup">Sign Up</Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="pnav-hamburger" onClick={() => setMobileOpen(o => !o)}>
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>

        {/* Mobile search strip */}
        <div className="pnav-mobile-search">
          <form className="pnav-search pnav-search-mob" onSubmit={handleSearch}>
            <span className="pnav-search-icon"><SearchIcon /></span>
            <input
              type="text"
              className="pnav-search-input"
              placeholder="Search foods, cultures…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </form>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="pnav-drawer">
          <Link to="/about"      className="pnav-drawer-link" onClick={() => setMobileOpen(false)}>About Us</Link>
          <Link to="/contribute" className="pnav-drawer-link pnav-drawer-contribute" onClick={() => setMobileOpen(false)}>✦ Contribute a Food</Link>
          {isLoggedIn ? (
            <>
              <div className="pnav-drawer-user">
                <Avatar src={user.profile_picture} name={user.name} size={42} className="pnav-drawer-av" />
                <div>
                  <p className="pnav-drawer-name">{user.name}</p>
                  <p className="pnav-drawer-email">{user.email}</p>
                </div>
              </div>
              <Link to="/homeUser" className="pnav-drawer-link" onClick={() => setMobileOpen(false)}>🍽 Community Feed</Link>
              <Link to="/profile"  className="pnav-drawer-link" onClick={() => setMobileOpen(false)}>👤 My Profile</Link>
              <button className="pnav-drawer-logout" onClick={handleLogout}><LogoutIcon /> Logout</button>
            </>
          ) : (
            <div className="pnav-drawer-auth">
              <Link to="/login"  className="pnav-drawer-login"  onClick={() => setMobileOpen(false)}>Login</Link>
              <Link to="/signup" className="pnav-drawer-signup" onClick={() => setMobileOpen(false)}>Sign Up</Link>
            </div>
          )}
        </div>
      )}
    </>
  );
}