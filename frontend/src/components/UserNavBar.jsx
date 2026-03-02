import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './UserNavBar.css';

/* ── Inline SVG icons (no dependency needed) ── */
const HomeIcon    = ({ filled }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const RecipeIcon  = ({ filled }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
    <path d="M7 2v20"/>
    <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>
  </svg>
);
const ChatIcon    = ({ filled }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const PlusIcon    = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const UserIcon    = ({ filled }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const LogoutIcon  = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const ChevronIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const NAV_ITEMS = [
  { path: '/home',      label: 'Home',      Icon: HomeIcon },
  { path: '/recipes',   label: 'Recipes',   Icon: RecipeIcon },
  { path: '/add',       label: 'Add',       isAdd: true },
  { path: '/questions', label: 'Questions', Icon: ChatIcon },
  { path: '/profile',   label: 'Profile',   Icon: UserIcon },
];

export default function UserNavBar() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const [dropOpen, setDropOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* ════════════════════════════════════════
          DESKTOP top navbar
      ════════════════════════════════════════ */}
      <nav className="unav-desktop">
        <div className="unav-inner">

          {/* Brand */}
          <Link to="/home" className="unav-brand">
            <span className="unav-logo" aria-hidden="true">
              <img
                src="https://api.iconify.design/noto/bowl-with-spoon.svg"
                alt=""
                width="28"
                height="28"
              />
            </span>
            <span className="unav-brand-text">
              <span className="brand-p">Khana</span>
              <span className="brand-s"> Sanskriti</span>
            </span>
          </Link>

          {/* Centre nav links */}
<div className="unav-links">
  {NAV_ITEMS.filter(n => !n.isAdd).map(({ path, label, Icon: NavIcon }) => (
    <Link
      key={path}
      to={path}
      className={`unav-link ${isActive(path) ? 'active' : ''}`}
    >
      {NavIcon({ filled: isActive(path) })}
      <span>{label}</span>
    </Link>
  ))}
</div>
          {/* Right side */}
          <div className="unav-right">
            <Link to="/add" className="unav-add-btn">
              <PlusIcon /> New Post
            </Link>

            {/* Avatar dropdown */}
            <div className="unav-avatar-wrap" onMouseLeave={() => setDropOpen(false)}>
              <button
                className="unav-avatar-btn"
                onClick={() => setDropOpen(o => !o)}
                aria-label="User menu"
              >
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=ec4899&color=fff&size=36`}
                  alt="avatar"
                  className="unav-avatar-img"
                />
                <ChevronIcon />
              </button>

              {dropOpen && (
                <div className="unav-dropdown">
                  <div className="unav-drop-user">
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=ec4899&color=fff&size=48`}
                      alt=""
                      className="unav-drop-avatar"
                    />
                    <div>
                      <p className="unav-drop-name">{user.name || 'User'}</p>
                      <p className="unav-drop-email">{user.email || ''}</p>
                    </div>
                  </div>
                  <div className="unav-drop-divider" />
                  <Link to="/profile" className="unav-drop-item" onClick={() => setDropOpen(false)}>
                    <UserIcon /> My Profile
                  </Link>
                  <button className="unav-drop-item unav-drop-logout" onClick={handleLogout}>
                    <LogoutIcon /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ════════════════════════════════════════
          MOBILE bottom navbar
      ════════════════════════════════════════ */}
    <nav className="unav-mobile">
        {NAV_ITEMS.map(({ path, label, Icon, isAdd }) => (
          <Link
            key={path}
            to={path}
            className={`unav-mob-item ${isAdd ? 'unav-mob-add' : ''} ${isActive(path) ? 'active' : ''}`}
          >
            {isAdd
              ? <PlusIcon />
              : (
                <>
                  {Icon && <Icon filled={isActive(path)} />}
                  <span className="unav-mob-label">{label}</span>
                </>
              )
            }
          </Link>
        ))}
      </nav>
    </>
  );
}