/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { getFeed } from "../api/postService";
import { getPost, likePost, unlikePost, addComment, getComments } from "../api/postService";
import { getAvatar } from "../utils/avatar";
import ReelPlayer from "../components/ReelPlayer";
import "./ReelsPage.css";

/* ── Icons ── */
const HeartIcon = ({ filled }) => (
  <svg width="26" height="26" viewBox="0 0 24 24"
    fill={filled ? "#ef4444" : "none"} stroke={filled ? "#ef4444" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);
const CommentIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const RecipeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"/>
  </svg>
);
const ChevronUpIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15"/>
  </svg>
);
const ChevronDownIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

/* ── Right-side action panel for each reel ── */
function ReelActions({ reel, onOpenRecipe, onOpenComments }) {
  const [liked,     setLiked]     = useState(reel.liked_by_me || false);
  const [likeCount, setLikeCount] = useState(Number(reel.likes_count) || 0);
  const [liking,    setLiking]    = useState(false);

  const toggleLike = async (e) => {
    e.stopPropagation();
    if (liking) return;
    setLiking(true);
    try {
      const fn  = liked ? unlikePost : likePost;
      const res = await fn(reel.post_id);
      setLikeCount(res.data.data.likes_count);
      setLiked(l => !l);
    } catch { /* ignore */ }
    finally { setLiking(false); }
  };

  return (
    <div className="rp-actions">
      {/* Author avatar */}
      <div className="rp-actions-avatar">
        <img src={getAvatar(reel.profile_picture, reel.author_name, 42)} alt={reel.author_name} className="rp-actions-av-img" />
      </div>

      {/* Like */}
      <button className={`rp-action-btn ${liked ? "rp-action-btn--liked" : ""}`} onClick={toggleLike} disabled={liking}>
        <HeartIcon filled={liked} />
        <span>{likeCount}</span>
      </button>

      {/* Comment */}
      <button className="rp-action-btn" onClick={(e) => { e.stopPropagation(); onOpenComments(); }}>
        <CommentIcon />
        <span>{reel.comments_count || 0}</span>
      </button>

      {/* Recipe */}
      <button className="rp-action-btn rp-action-btn--recipe" onClick={(e) => { e.stopPropagation(); onOpenRecipe(); }} title="See full recipe">
        <RecipeIcon />
        <span>Recipe</span>
      </button>
    </div>
  );
}

/* ── Comment drawer ── */
function CommentDrawer({ reel, onClose }) {
  const [comments,    setComments]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [newComment,  setNewComment]  = useState("");
  const [posting,     setPosting]     = useState(false);
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    getComments(reel.post_id)
      .then(res => setComments(res.data.data.comments || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [reel.post_id]);

  const submit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || posting) return;
    setPosting(true);
    try {
      const res = await addComment(reel.post_id, { comment_text: newComment.trim() });
      const c   = res.data.data.comment;
      setComments(prev => [...prev, { ...c, author_name: currentUser.name || "You", profile_picture: currentUser.profile_picture || null }]);
      setNewComment("");
    } catch { /* ignore */ }
    finally { setPosting(false); }
  };

  return (
    <div className="rp-comment-drawer" onClick={e => e.stopPropagation()}>
      <div className="rp-comment-drawer-header">
        <span>Comments ({comments.length})</span>
        <button onClick={onClose}><CloseIcon /></button>
      </div>
      <div className="rp-comment-list">
        {loading && <p className="rp-comment-empty">Loading…</p>}
        {!loading && comments.length === 0 && <p className="rp-comment-empty">No comments yet. Be first!</p>}
        {comments.map(c => (
          <div key={c.comment_id} className="rp-comment-item">
            <img src={getAvatar(c.profile_picture, c.author_name, 30)} alt={c.author_name} className="rp-comment-av" />
            <div>
              <span className="rp-comment-name">{c.author_name}</span>
              <p className="rp-comment-text">{c.comment_text}</p>
            </div>
          </div>
        ))}
      </div>
      <form className="rp-comment-form" onSubmit={submit}>
        <input
          className="rp-comment-input"
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Add a comment…"
          disabled={posting}
        />
        <button type="submit" className="rp-comment-submit" disabled={posting}>
          {posting ? "…" : "Post"}
        </button>
      </form>
    </div>
  );
}

/* ── Full Recipe drawer ── */
function RecipeDrawer({ reel, onClose }) {
  const [fullData, setFullData] = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    getPost(reel.post_id)
      .then(res => setFullData(res.data.data?.post || res.data.data || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [reel.post_id]);

  const data = fullData || reel;

  return (
    <div className="rp-recipe-drawer" onClick={e => e.stopPropagation()}>
      <div className="rp-recipe-drawer-header">
        <h3 className="rp-recipe-drawer-title">{reel.title}</h3>
        <button onClick={onClose}><CloseIcon /></button>
      </div>
      <div className="rp-recipe-drawer-body">
        {reel.culture_name && (
          <span className="rp-recipe-culture">{reel.culture_name}</span>
        )}
        {data.description && (
          <p className="rp-recipe-desc">{data.description}</p>
        )}
        {loading && (
          <div className="rp-recipe-loading">
            <div className="rp-recipe-spinner" />
            <span>Loading recipe details…</span>
          </div>
        )}
        {!loading && data.ingredients && data.ingredients.length > 0 && (
          <div className="rp-recipe-section">
            <h4 className="rp-recipe-section-title">Ingredients</h4>
            <ul className="rp-recipe-ingredients">
              {data.ingredients.map((ing, i) => {
                const text = ing.ingredient_text || ing.ingredient_name || ing.name || String(ing);
                return (
                  <li key={ing.ingredient_id || i} className="rp-recipe-ing-item">
                    <span className="rp-recipe-ing-dot">•</span>
                    <span>{text}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {!loading && data.steps && data.steps.length > 0 && (
          <div className="rp-recipe-section">
            <h4 className="rp-recipe-section-title">Steps</h4>
            <ol className="rp-recipe-steps">
              {data.steps.map((step, i) => (
                <li key={step.step_id || i}>
                  {step.step_description || step.instruction || step.step_text || step.description || String(step)}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   ReelsPage — full-screen vertical snap feed
   ════════════════════════════════════════════ */
export default function ReelsPage() {
  const [reels,       setReels]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [activeIdx,   setActiveIdx]   = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [showRecipe,  setShowRecipe]  = useState(false);
  const containerRef  = useRef(null);
  const itemRefs      = useRef([]);
  const scrolling     = useRef(false);

  useEffect(() => {
    getFeed({ type: "reel" })
      .then(res => setReels(res.data.data.posts || []))
      .catch(() => setError("Could not load reels."))
      .finally(() => setLoading(false));
  }, []);

  /* Snap scroll via IntersectionObserver */
  useEffect(() => {
    if (!reels.length) return;
    const observers = [];
    itemRefs.current.forEach((el, i) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            setActiveIdx(i);
            setShowComments(false);
            setShowRecipe(false);
          }
        },
        { threshold: 0.6, root: containerRef.current }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, [reels]);

  const goTo = useCallback((idx) => {
    const el = itemRefs.current[idx];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  if (loading) return (
    <div className="rp-loading">
      <div className="rp-loading-spinner" />
      <p>Loading reels…</p>
    </div>
  );

  if (error) return (
    <div className="rp-error">
      <p>{error}</p>
    </div>
  );

  if (!reels.length) return (
    <div className="rp-empty">
      <span>▶</span>
      <p>No reels yet.</p>
    </div>
  );

  const activeReel = reels[activeIdx];

  return (
    <div className="rp-page">
      {/* ── Vertical scroll feed ── */}
      <div className="rp-feed" ref={containerRef}>
        {reels.map((reel, i) => (
          <div
            key={reel.post_id}
            className={`rp-item ${i === activeIdx ? "rp-item--active" : ""}`}
            ref={el => itemRefs.current[i] = el}
          >
            {/* Full-screen reel player */}
            <div className="rp-video-wrap">
              <ReelPlayer
                src={reel.media_url}
                poster={reel.thumbnail_url || undefined}
                isActive={i === activeIdx}
                onEnded={() => {
                  if (i < reels.length - 1) goTo(i + 1);
                }}
              />
            </div>

            {/* Overlay info: author + title bottom-left */}
            <div className="rp-overlay-info">
              <div className="rp-overlay-author">
                <img src={getAvatar(reel.profile_picture, reel.author_name, 36)} alt={reel.author_name} className="rp-overlay-av" />
                <span className="rp-overlay-name">{reel.author_name}</span>
                {reel.culture_name && (
                  <span className="rp-overlay-culture">{reel.culture_name}</span>
                )}
              </div>
              <h3 className="rp-overlay-title">{reel.title}</h3>
              {reel.description && (
                <p className="rp-overlay-desc">{reel.description.slice(0, 100)}{reel.description.length > 100 ? "…" : ""}</p>
              )}
            </div>

            {/* Right-side actions */}
            <ReelActions
              reel={reel}
              onOpenComments={() => { setShowComments(s => !s); setShowRecipe(false); }}
              onOpenRecipe={() => { setShowRecipe(s => !s); setShowComments(false); }}
            />

            {/* Comment drawer (slides up from bottom) */}
            {i === activeIdx && showComments && (
              <CommentDrawer reel={reel} onClose={() => setShowComments(false)} />
            )}

            {/* Recipe drawer (slides up from bottom) */}
            {i === activeIdx && showRecipe && (
              <RecipeDrawer reel={reel} onClose={() => setShowRecipe(false)} />
            )}
          </div>
        ))}
      </div>

      {/* ── Navigation arrows (desktop) ── */}
      <div className="rp-nav-arrows">
        <button
          className="rp-nav-btn"
          onClick={() => goTo(Math.max(0, activeIdx - 1))}
          disabled={activeIdx === 0}
        >
          <ChevronUpIcon />
        </button>
        <div className="rp-nav-dots">
          {reels.map((_, i) => (
            <button
              key={i}
              className={`rp-nav-dot ${i === activeIdx ? "active" : ""}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
        <button
          className="rp-nav-btn"
          onClick={() => goTo(Math.min(reels.length - 1, activeIdx + 1))}
          disabled={activeIdx === reels.length - 1}
        >
          <ChevronDownIcon />
        </button>
      </div>
    </div>
  );
}