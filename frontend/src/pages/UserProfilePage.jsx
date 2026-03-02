import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { dummyPosts, dummyQuestions } from '../data/dummyDataPost';
import './UserProfilePage.css';

const TABS = [
  { id: 'recipes',   label: 'My Recipes',   icon: '📖' },
  { id: 'reels',     label: 'My Reels',     icon: '▶' },
  { id: 'questions', label: 'Questions',    icon: '❓' },
  { id: 'answers',   label: 'My Answers',   icon: '💬' },
  { id: 'saved',     label: 'Saved',        icon: '🔖' },
];

const PostGrid = ({ posts }) =>
  posts.length === 0
    ? <p className="uprofile-empty">Nothing here yet.</p>
    : (
      <div className="uprofile-grid">
        {posts.map(p => (
          <Link to={`/post/${p.id}`} key={p.id} className="uprofile-grid-item">
            <img src={p.image} alt={p.title} />
            <div className="uprofile-grid-overlay">
              <span>❤ {p.likes}</span>
              <span>💬 {p.comments}</span>
            </div>
            {p.type === 'reel' && <span className="ugrid-reel">▶</span>}
          </Link>
        ))}
      </div>
    );

const QuestionList = ({ questions }) =>
  questions.length === 0
    ? <p className="uprofile-empty">No questions yet.</p>
    : (
      <div className="uprofile-qlist">
        {questions.map(q => (
          <div key={q.id} className="uprofile-qitem">
            <span className="uprofile-qculture">{q.culture}</span>
            <h4 className="uprofile-qtitle">{q.title}</h4>
            <div className="uprofile-qmeta">
              <span>💬 {q.answers} answers</span>
              <span>❤ {q.likes}</span>
              <span className="uprofile-qdate">{q.createdAt}</span>
            </div>
          </div>
        ))}
      </div>
    );

export default function UserProfilePage() {
  const [activeTab, setActiveTab] = useState('recipes');
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(
    'Food lover & culture keeper 🍜 Sharing the flavors of Nepal one recipe at a time.'
  );
  const [editBio, setEditBio] = useState(bio);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const name  = user.name  || 'User';
  const email = user.email || '';

  const myRecipes   = dummyPosts.filter(p => p.type === 'recipe');
  const myReels     = dummyPosts.filter(p => p.type === 'reel');
  const savedPosts  = [dummyPosts[1], dummyPosts[3]];

  const renderTab = () => {
    switch (activeTab) {
      case 'recipes':   return <PostGrid posts={myRecipes} />;
      case 'reels':     return <PostGrid posts={myReels} />;
      case 'questions': return <QuestionList questions={dummyQuestions} />;
      case 'answers':   return <p className="uprofile-empty">No answers yet.</p>;
      case 'saved':     return <PostGrid posts={savedPosts} />;
      default:          return null;
    }
  };

  const saveProfile = () => {
    setBio(editBio);
    setEditing(false);
  };

  return (
    <div className="uprofile-page">
      <div className="uprofile-container">

        {/* ── Profile header card ── */}
        <div className="uprofile-header">
          {/* Avatar */}
          <div className="uprofile-avatar-wrap">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ec4899&color=fff&size=120`}
              alt="avatar"
              className="uprofile-avatar"
            />
            <button className="uprofile-avatar-edit" title="Change photo">
              <img
                src="https://api.iconify.design/material-symbols/edit-outline.svg?color=%23fff"
                alt="edit"
                width="14"
                height="14"
              />
            </button>
          </div>

          {/* Info */}
          <div className="uprofile-info">
            <div className="uprofile-name-row">
              <h2 className="uprofile-name">{name}</h2>
              {editing
                ? (
                  <div className="uprofile-edit-actions">
                    <button className="uprofile-save-btn" onClick={saveProfile}>Save</button>
                    <button className="uprofile-cancel-btn" onClick={() => { setEditing(false); setEditBio(bio); }}>Cancel</button>
                  </div>
                )
                : (
                  <button className="uprofile-edit-btn" onClick={() => setEditing(true)}>
                    <img src="https://api.iconify.design/material-symbols/edit-outline.svg?color=%234b5563" alt="" width="14" height="14" />
                    Edit Profile
                  </button>
                )
              }
            </div>

            <p className="uprofile-email">
              <img src="https://api.iconify.design/material-symbols/mail-outline.svg?color=%239ca3af" alt="" width="14" height="14" />
              {email}
            </p>

            {editing
              ? (
                <textarea
                  className="uprofile-bio-edit"
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  rows={3}
                  placeholder="Write something about yourself…"
                />
              )
              : <p className="uprofile-bio">{bio}</p>
            }

            {/* Stats */}
            <div className="uprofile-stats">
              <div className="uprofile-stat">
                <span className="uprofile-stat-n">{myRecipes.length + myReels.length}</span>
                <span className="uprofile-stat-l">Posts</span>
              </div>
              <div className="uprofile-stat-div" />
              <div className="uprofile-stat">
                <span className="uprofile-stat-n">{dummyQuestions.length}</span>
                <span className="uprofile-stat-l">Questions</span>
              </div>
              <div className="uprofile-stat-div" />
              <div className="uprofile-stat">
                <span className="uprofile-stat-n">{myReels.length}</span>
                <span className="uprofile-stat-l">Reels</span>
              </div>
              <div className="uprofile-stat-div" />
              <div className="uprofile-stat">
                <span className="uprofile-stat-n">{savedPosts.length}</span>
                <span className="uprofile-stat-l">Saved</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="uprofile-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`uprofile-tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div className="uprofile-content">
          {renderTab()}
        </div>

      </div>
    </div>
  );
}