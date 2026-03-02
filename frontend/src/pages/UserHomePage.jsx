import React, { useState } from 'react';
import PostCard from '../components/PostCard';
import { dummyPosts, CULTURE_TAGS } from '../data/dummyDataPost';
import './UserHomePage.css';

export default function UserHomePage() {
  const [typeFilter, setTypeFilter] = useState('all');
  const [cultureFilter, setCultureFilter] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const feed = dummyPosts
    .filter(p => typeFilter === 'all' || p.type === typeFilter)
    .filter(p => !cultureFilter || p.culture === cultureFilter)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="uhome">
      {/* Greeting hero */}
      <div className="uhome-hero">
        <div className="uhome-hero-inner">
          <div className="uhome-greeting">
            <img
              src="https://api.iconify.design/noto/waving-hand.svg"
              alt=""
              width="28"
              height="28"
              className="uhome-wave"
            />
            <span>
              Welcome back,{' '}
              <strong>{user.name ? user.name.split(' ')[0] : 'Friend'}</strong>!
            </span>
          </div>
          <h1 className="uhome-title">
            What's <span>cooking</span> today?
          </h1>
          <p className="uhome-sub">
            Discover recipes, reels, and cultural stories from across Nepal.
          </p>
        </div>
      </div>

      <div className="uhome-content">
        {/* Filter bar */}
        <div className="uhome-filters">
          <div className="uhome-type-tabs">
            {[
              { id: 'all',    label: 'All Posts',  emoji: '🍽' },
              { id: 'recipe', label: 'Recipes',    emoji: '📖' },
              { id: 'reel',   label: 'Reels',      emoji: '▶' },
            ].map(f => (
              <button
                key={f.id}
                className={`uhome-tab ${typeFilter === f.id ? 'active' : ''}`}
                onClick={() => setTypeFilter(f.id)}
              >
                <span>{f.emoji}</span> {f.label}
              </button>
            ))}
          </div>

          <select
            className="uhome-culture-select"
            value={cultureFilter}
            onChange={e => setCultureFilter(e.target.value)}
          >
            <option value="">All Cultures</option>
            {CULTURE_TAGS.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Culture chips */}
        <div className="uhome-chips">
          <button
            className={`uhome-chip ${!cultureFilter ? 'active' : ''}`}
            onClick={() => setCultureFilter('')}
          >
            All
          </button>
          {CULTURE_TAGS.map(t => (
            <button
              key={t}
              className={`uhome-chip ${cultureFilter === t ? 'active' : ''}`}
              onClick={() => setCultureFilter(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Feed */}
        <div className="uhome-feed">
          {feed.length === 0
            ? (
              <div className="uhome-empty">
                <img src="https://api.iconify.design/noto/fork-and-knife-with-plate.svg" alt="" width="48" height="48" />
                <p>No posts found — try a different filter!</p>
              </div>
            )
            : feed.map(post => (
              <PostCard key={post.id} post={post} />
            ))
          }
        </div>
      </div>
    </div>
  );
}