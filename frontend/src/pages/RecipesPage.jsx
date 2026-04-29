import React, { useState, useEffect, useCallback, useRef } from "react";
import PostCard from "../components/PostCard";
import ReelPlayer from "../components/ReelPlayer";
import { getFeed } from "../api/postService";
import { getAvatar } from "../utils/avatar";
import useCultures from "../hooks/useCultures";
import CultureFilter from "../components/CultureFilter";
import "./RecipesPage.css";

/* ════════════════════════════════════════
   Fullscreen reel scroll modal
   Opens when user clicks a reel thumbnail
   Scrolls through all reels like IG/YT
   ════════════════════════════════════════ */
function ReelScrollModal({ reels, startIndex, onClose }) {
  const [activeIdx, setActiveIdx] = useState(startIndex);
  const containerRef = useRef(null);
  const itemRefs     = useRef([]);

  // Snap scroll observer
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const idx = itemRefs.current.findIndex(el => el === entry.target);
            if (idx !== -1) setActiveIdx(idx);
          }
        });
      },
      { threshold: 0.6, root: containerRef.current }
    );
    itemRefs.current.forEach(el => { if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [reels]);

  // Scroll to start reel on open
  useEffect(() => {
    const el = itemRefs.current[startIndex];
    if (el) el.scrollIntoView({ behavior: "instant", block: "start" });
  }, [startIndex]);

  // Close on backdrop click
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="reel-modal-overlay" onClick={handleBackdrop}>
      {/* Close button */}
      <button className="reel-modal-close" onClick={onClose}>✕</button>

      {/* Counter */}
      <div className="reel-modal-counter">{activeIdx + 1} / {reels.length}</div>

      {/* Scrollable reel feed */}
      <div className="reel-modal-feed" ref={containerRef}>
        {reels.map((reel, i) => (
          <div
            key={reel.post_id}
            className="reel-modal-item"
            ref={el => itemRefs.current[i] = el}
          >
            <div className="reel-modal-player-wrap">
              <ReelPlayer
                src={reel.media_url}
                isActive={i === activeIdx}
                onEnded={() => {
                  if (i < reels.length - 1) {
                    itemRefs.current[i + 1]?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
              />
            </div>
            {/* Info below video */}
            <div className="reel-modal-info">
              <div className="reel-modal-author">
                <img
                  src={getAvatar(reel.profile_picture, reel.author_name, 28)}
                  alt={reel.author_name}
                  className="reel-modal-av"
                />
                <span className="reel-modal-author-name">{reel.author_name}</span>
                {reel.culture_name && (
                  <span className="reel-modal-culture">{reel.culture_name}</span>
                )}
              </div>
              <h4 className="reel-modal-title">{reel.title}</h4>
              {reel.description && (
                <p className="reel-modal-desc">
                  {reel.description.slice(0, 120)}{reel.description.length > 120 ? "…" : ""}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Reel thumbnail card (static, no autoplay) ── */
function ReelThumb({ reel, onClick }) {
  return (
    <button className="rthumb" onClick={onClick}>
      {reel.media_url ? (
        <video
          src={reel.media_url}
          className="rthumb-video"
          preload="metadata"
          muted
          playsInline
        />
      ) : (
        <div className="rthumb-placeholder">▶</div>
      )}
      <div className="rthumb-overlay">
        <div className="rthumb-play">▶</div>
      </div>
      <div className="rthumb-info">
        <span className="rthumb-title">{reel.title}</span>
        {reel.culture_name && <span className="rthumb-culture">{reel.culture_name}</span>}
      </div>
    </button>
  );
}

/* ════════════════════════════════════════
   RecipesPage
   ════════════════════════════════════════ */
export default function RecipesPage() {
  const [posts,         setPosts]         = useState([]);
  const [typeFilter,    setTypeFilter]    = useState("all");
  const [cultureFilter, setCultureFilter] = useState("");
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [mobileCulture, setMobileCulture] = useState(false);
  // Reel modal state
  const [reelModal,     setReelModal]     = useState({ open: false, startIndex: 0 });

  const { cultures } = useCultures();

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = {};
      if (typeFilter === "all")    { params.types = "recipe,reel"; }
      else if (typeFilter === "reel")   { params.type = "reel";   }
      else if (typeFilter === "recipe") { params.type = "recipe"; }
      if (cultureFilter) params.culture_id = cultureFilter;
      const res = await getFeed(params);
      setPosts(res.data.data.posts || []);
    } catch {
      setError("Could not load posts.");
    } finally {
      setLoading(false);
    }
  }, [typeFilter, cultureFilter]);

  useEffect(() => { load(); }, [load]);

  const handleLikeChange = (postId, liked, count) =>
    setPosts(prev => prev.map(p =>
      p.post_id === postId ? { ...p, liked_by_me: liked, likes_count: count } : p
    ));

  const reels   = posts.filter(p => p.post_type === "reel");
  const recipes = posts.filter(p => p.post_type === "recipe");

  // For "all" tab — show recipe PostCards + reel thumbnails grid
  // For "recipe" tab — show recipe PostCards only
  // For "reel" tab — show reel thumbnail grid only

  const openReelModal = (idx) => setReelModal({ open: true, startIndex: idx });
  const closeReelModal = () => setReelModal({ open: false, startIndex: 0 });

  const renderFeed = () => {
    if (typeFilter === "recipe") {
      if (!recipes.length) return <div className="rpage-state"><span className="rpage-state-icon">🍽</span><p className="rpage-state-msg">No recipes found.</p></div>;
      return (
        <div className="rpage-feed">
          {recipes.map(p => <PostCard key={p.post_id} post={p} onLikeChange={handleLikeChange} />)}
        </div>
      );
    }

    if (typeFilter === "reel") {
      if (!reels.length) return <div className="rpage-state"><span className="rpage-state-icon">▶</span><p className="rpage-state-msg">No reels found.</p></div>;
      return (
        <div className="rpage-reel-grid">
          {reels.map((reel, i) => (
            <ReelThumb key={reel.post_id} reel={reel} onClick={() => openReelModal(i)} />
          ))}
        </div>
      );
    }

    // "all" — recipes as PostCards, then reel grid below
    if (!posts.length) return <div className="rpage-state"><span className="rpage-state-icon">🍽</span><p className="rpage-state-msg">No posts found for this filter.</p></div>;

    return (
      <>
        {recipes.length > 0 && (
          <div className="rpage-feed">
            {recipes.map(p => <PostCard key={p.post_id} post={p} onLikeChange={handleLikeChange} />)}
          </div>
        )}
        {reels.length > 0 && (
          <div className="rpage-reels-section">
            <p className="rpage-reels-section-label">Reels</p>
            <div className="rpage-reel-grid">
              {reels.map((reel, i) => (
                <ReelThumb key={reel.post_id} reel={reel} onClick={() => openReelModal(i)} />
              ))}
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="rpage">
      <CultureFilter
        cultures={cultures}
        cultureFilter={cultureFilter}
        setCultureFilter={setCultureFilter}
      />

      <div className="rpage-fixed-tabs">
        {[
          { id: "all",    label: "All"     },
          { id: "recipe", label: "Recipes" },
          { id: "reel",   label: "Reels"   },
        ].map(f => (
          <button
            key={f.id}
            className={`rpage-tab ${typeFilter === f.id ? "active" : ""}`}
            onClick={() => setTypeFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <main className="rpage-main">
        <div className="rpage-feed-area">

          <div className="rpage-feed-header">
            <div className="rpage-feed-header-left">
              <button className="rpage-culture-toggle" onClick={() => setMobileCulture(true)}>
                🌏 Culture{cultureFilter && <span className="rpage-culture-dot" />}
              </button>
            </div>
            <div className="rpage-feed-header-text">
              <h1 className="rpage-header-title">Recipes &amp; Reels</h1>
              <p className="rpage-header-sub">Traditional dishes and cooking videos from across Nepal</p>
            </div>
          </div>

          {mobileCulture && (
            <>
              <div className="rpage-mob-overlay" onClick={() => setMobileCulture(false)} />
              <div className="rpage-mob-drawer">
                <div className="rpage-mob-drawer-header">
                  <span>Filter by Culture</span>
                  <button onClick={() => setMobileCulture(false)}>✕</button>
                </div>
                <div className="rpage-mob-culture-list">
                  <button className={`rpage-mob-chip ${!cultureFilter ? "active" : ""}`}
                    onClick={() => { setCultureFilter(""); setMobileCulture(false); }}>All Cultures</button>
                  {cultures.map(c => (
                    <button key={c.culture_id}
                      className={`rpage-mob-chip ${cultureFilter === String(c.culture_id) ? "active" : ""}`}
                      onClick={() => { setCultureFilter(String(c.culture_id)); setMobileCulture(false); }}>
                      {c.culture_name}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {loading && <div className="rpage-state"><div className="rpage-spinner" /></div>}
          {!loading && error && (
            <div className="rpage-state">
              <p className="rpage-state-msg">{error}</p>
              <button className="rpage-retry" onClick={load}>Try again</button>
            </div>
          )}
          {!loading && !error && renderFeed()}
        </div>
      </main>

      {/* Fullscreen reel scroll modal */}
      {reelModal.open && (
        <ReelScrollModal
          reels={reels}
          startIndex={reelModal.startIndex}
          onClose={closeReelModal}
        />
      )}
    </div>
  );
}