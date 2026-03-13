import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getNotifications } from '../api/notificationService';
import { updateProfile } from '../api/userService';
import './UserNavBar.css';
/* eslint-disable no-unused-vars */
/* ── Icons ── */
const HomeIcon    = ({ filled }) => (<svg width="20" height="20" viewBox="0 0 24 24" fill={filled?'currentColor':'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>);
const RecipeIcon  = ({ filled }) => (<svg width="20" height="20" viewBox="0 0 24 24" fill={filled?'currentColor':'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>);
const ChatIcon    = ({ filled }) => (<svg width="20" height="20" viewBox="0 0 24 24" fill={filled?'currentColor':'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>);
const PlusIcon    = ()           => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>);
const UserIcon    = ({ filled }) => (<svg width="20" height="20" viewBox="0 0 24 24" fill={filled?'currentColor':'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const LogoutIcon  = ()           => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>);
const ChevronIcon = ()           => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>);
const EditIcon    = ()           => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>);
const CameraIcon  = ()           => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>);
const CloseIcon   = ()           => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);

const MOB_ITEMS = [
  { path: '/homeUser',  label: 'Home',      Icon: HomeIcon   },
  { path: '/recipes',   label: 'Recipes',   Icon: RecipeIcon },
  { path: '/add',       label: 'Post',      isAdd: true      },
  { path: '/questions', label: 'Questions', Icon: ChatIcon   },
  { path: '/profile',   label: 'Profile',   Icon: UserIcon   },
];

/* ── Avatar helper — shows real pic or initials ── */
function Avatar({ src, name, size = 34, className = '' }) {
  const [imgError, setImgError] = useState(false);

  if (src && !imgError) {
    return (
      <img
        src={src} alt={name || 'User'}
        className={className}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
        onError={() => setImgError(true)}
      />
    );
  }
  // Show initials
  const initials = (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <span
      className={`unav-initials ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </span>
  );
}

/* ── Manage Profile Overlay ── */
function ManageProfileOverlay({ user, onClose, onSaved }) {
  const [name,       setName]       = useState(user.name || '');
  const [bio,        setBio]        = useState(user.bio  || '');
  const [picFile,    setPicFile]    = useState(null);
  const [picPreview, setPicPreview] = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');
  const fileRef = useRef();

  const handlePic = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setPicFile(f);
    setPicPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required.'); return; }
    setSaving(true); setError('');
    try {
      const fd = new FormData();
      fd.append('name', name.trim());
      fd.append('bio',  bio.trim());
      if (picFile) fd.append('profile_picture', picFile);
      const res     = await updateProfile(user.user_id, fd);
      const updated = res.data.data?.user || res.data.user || {};
      // Merge into localStorage
      const stored  = JSON.parse(localStorage.getItem('user') || '{}');
      const merged  = { ...stored, name: updated.name || name.trim(), bio: updated.bio || bio.trim(), profile_picture: updated.profile_picture || stored.profile_picture };
      if (picFile && updated.profile_picture) merged.profile_picture = updated.profile_picture;
      localStorage.setItem('user', JSON.stringify(merged));
      onSaved(merged);
      window.dispatchEvent(new CustomEvent('profile-updated', { detail: merged }));
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const currentPic = picPreview || user.profile_picture;

  return (
    <div className="mpo-overlay" onClick={onClose}>
      <div className="mpo-modal" onClick={e => e.stopPropagation()}>
        <div className="mpo-header">
          <h3 className="mpo-title">Manage Profile</h3>
          <button className="mpo-close" onClick={onClose}><CloseIcon /></button>
        </div>

        {/* Avatar picker */}
        <div className="mpo-avatar-section">
          <div className="mpo-avatar-wrap" onClick={() => fileRef.current?.click()}>
            <Avatar src={currentPic} name={name} size={80} className="mpo-avatar-img" />
            <div className="mpo-camera-overlay"><CameraIcon /></div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePic} />
          <p className="mpo-avatar-hint">Click to change photo</p>
        </div>

        {/* Fields */}
        <div className="mpo-fields">
          {error && <p className="mpo-error">⚠ {error}</p>}

          <div className="mpo-field">
            <label className="mpo-label">Username</label>
            <input
              type="text" className="mpo-input"
              value={name} onChange={e => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div className="mpo-field">
            <label className="mpo-label">Bio</label>
            <textarea
              className="mpo-textarea" rows={3}
              value={bio} onChange={e => setBio(e.target.value)}
              placeholder="Tell people about yourself…"
            />
          </div>
        </div>

        <div className="mpo-footer">
          <button className="mpo-cancel" onClick={onClose}>Cancel</button>
          <button className="mpo-save" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main NavBar ── */
export default function UserNavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [dropOpen,     setDropOpen]     = useState(false);
  const [unreadCount,  setUnreadCount]  = useState(0);
  const [showManage,   setShowManage]   = useState(false);
  const [currentUser,  setCurrentUser]  = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
  const dropRef = useRef(null);

  useEffect(() => {
    getNotifications()
      .then(res => setUnreadCount(res.data.data.unreadCount || 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const updated = e.detail || JSON.parse(localStorage.getItem('user') || '{}');
      setCurrentUser(updated);
    };
    window.addEventListener('profile-updated', handler);
    return () => window.removeEventListener('profile-updated', handler);
  }, []);

  useEffect(() => {
    const handler = () => setUnreadCount(0);
    window.addEventListener('notif-cleared', handler);
    return () => window.removeEventListener('notif-cleared', handler);
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
    navigate('/');
  };

  const handleSaved = (updated) => {
    setCurrentUser(updated);
    window.dispatchEvent(new Event('profile-updated'));
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* ══ DESKTOP TOP NAV ══ */}
      <nav className="unav">
        <div className="unav-inner">

          {/* Brand — clicking goes to public home */}
          <Link to="/" className="unav-brand">
            <span className="unav-brand-text">
              <span className="unav-brand-k">Khana</span>
              <span className="unav-brand-s"> Sanskriti</span>
            </span>
          </Link>

          {/* Centre links */}
          <div className="unav-links">
            <Link to="/homeUser"  className={`unav-link ${isActive('/homeUser')  ? 'active' : ''}`}><HomeIcon   filled={isActive('/homeUser')}  /><span>Home</span></Link>
            <Link to="/recipes"   className={`unav-link ${isActive('/recipes')   ? 'active' : ''}`}><RecipeIcon filled={isActive('/recipes')}   /><span>Recipes</span></Link>
            <Link to="/questions" className={`unav-link ${isActive('/questions') ? 'active' : ''}`}><ChatIcon   filled={isActive('/questions')} /><span>Questions</span></Link>
            <Link to="/profile"   className={`unav-link ${isActive('/profile')   ? 'active' : ''}`}>
              <span className="unav-link-icon-wrap">
                <UserIcon filled={isActive('/profile')} />
                {unreadCount > 0 && <span className="unav-link-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </span>
              <span>My Profile</span>
            </Link>
          </div>

          {/* Right: post button + avatar dropdown */}
          <div className="unav-right">
            <Link to="/add" className="unav-post-btn"><PlusIcon /> New Post</Link>

            <div className="unav-avatar-wrap" ref={dropRef}>
              <button className="unav-avatar-btn" onClick={() => setDropOpen(o => !o)}>
                <div className="unav-avatar-ring">
                  <Avatar src={currentUser.profile_picture} name={currentUser.name} size={32} className="unav-avatar-img" />
                  {unreadCount > 0 && (
                    <span className="unav-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </div>
                <ChevronIcon />
              </button>

              {dropOpen && (
                <div className="unav-dropdown">
                  <div className="unav-drop-user">
                    <Avatar src={currentUser.profile_picture} name={currentUser.name} size={42} className="unav-drop-av" />
                    <div>
                      <p className="unav-drop-name">{currentUser.name || 'User'}</p>
                      <p className="unav-drop-email">{currentUser.email || ''}</p>
                    </div>
                  </div>
                  <div className="unav-drop-div" />
                  <button className="unav-drop-item" onClick={() => { setDropOpen(false); setShowManage(true); }}>
                    <EditIcon /> Manage Profile
                  </button>
                  <button className="unav-drop-item unav-drop-logout" onClick={handleLogout}>
                    <LogoutIcon /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ══ MOBILE BOTTOM NAV ══ */}
      <nav className="unav-mob">
        {MOB_ITEMS.map(({ path, label, Icon, isAdd }) => (
          <Link
            key={path}
            to={path}
            className={`unav-mob-item ${isAdd ? 'unav-mob-add' : ''} ${isActive(path) ? 'active' : ''}`}
          >
            {isAdd ? (
              <PlusIcon />
            ) : path === '/profile' ? (
              <>
                <span className="unav-mob-icon-wrap">
                  <Avatar src={currentUser.profile_picture} name={currentUser.name} size={24} className="unav-mob-avatar" />
                  {unreadCount > 0 && <span className="unav-mob-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                </span>
                <span className="unav-mob-label">{label}</span>
              </>
            ) : (
              <>
                <Icon filled={isActive(path)} />
                <span className="unav-mob-label">{label}</span>
              </>
            )}
          </Link>
        ))}
      </nav>

      {/* ══ MANAGE PROFILE OVERLAY ══ */}
      {showManage && (
        <ManageProfileOverlay
          user={currentUser}
          onClose={() => setShowManage(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}