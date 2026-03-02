import React, { useState } from 'react';
import PostCard from '../components/PostCard';
import { dummyPosts, CULTURE_TAGS } from '../data/dummyDataPost';
import './RecipesPage.css';

export default function RecipesPage() {
  const [cultureFilter, setCultureFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const posts = dummyPosts
    .filter(p => typeFilter === 'all' || p.type === typeFilter)
    .filter(p => !cultureFilter || p.culture === cultureFilter);

  return (
    <div className="rpage">
      <div className="rpage-container">
        <div className="rpage-header">
          <div>
            <h2 className="rpage-title">
              <img src="https://api.iconify.design/noto/fork-and-knife-with-plate.svg" alt="" width="28" height="28" />
              Recipes &amp; Reels
            </h2>
            <p className="rpage-sub">Traditional dishes and cooking videos from across Nepal</p>
          </div>
        </div>

        {/* Type + culture filter row */}
        <div className="rpage-filters">
          <div className="rpage-type-tabs">
            {[
              { id: 'all',    label: 'All',    emoji: '🍽' },
              { id: 'recipe', label: 'Recipes', emoji: '📖' },
              { id: 'reel',   label: 'Reels',   emoji: '▶' },
            ].map(f => (
              <button
                key={f.id}
                className={`rpage-tab ${typeFilter === f.id ? 'active' : ''}`}
                onClick={() => setTypeFilter(f.id)}
              >
                {f.emoji} {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Culture chips */}
        <div className="rpage-chips">
          <button
            className={`rpage-chip ${!cultureFilter ? 'active' : ''}`}
            onClick={() => setCultureFilter('')}
          >
            All Cultures
          </button>
          {CULTURE_TAGS.map(t => (
            <button
              key={t}
              className={`rpage-chip ${cultureFilter === t ? 'active' : ''}`}
              onClick={() => setCultureFilter(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="rpage-count">{posts.length} post{posts.length !== 1 ? 's' : ''} found</p>

        <div className="rpage-feed">
          {posts.length === 0
            ? (
              <div className="rpage-empty">
                <img src="https://api.iconify.design/noto/fork-and-knife-with-plate.svg" alt="" width="40" height="40" />
                <p>No recipes found for this filter.</p>
              </div>
            )
            : posts.map(p => <PostCard key={p.id} post={p} />)
          }
        </div>
      </div>
    </div>
  );
}