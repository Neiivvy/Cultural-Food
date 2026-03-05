import React, { useState } from "react";
import { Link } from "react-router-dom";
import { likePost, unlikePost, addComment, getComments } from "../api/postService";
import { getAvatar } from "../utils/avatar";
import "./PostCard.css";

const HeartIcon = ({ filled }) => (
  <svg width="20" height="20" viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);
const CommentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const PlayIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);

export default function PostCard({ post, onLikeChange }) {
  const [liked,     setLiked]     = useState(post.liked_by_me || false);
  const [likeCount, setLikeCount] = useState(Number(post.likes_count) || 0);
  const [liking,    setLiking]    = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [comments,     setComments]     = useState([]);
  const [commentCount, setCommentCount] = useState(Number(post.comments_count) || 0);
  const [loadingCmts,  setLoadingCmts]  = useState(false);
  const [newComment,   setNewComment]   = useState("");
  const [posting,      setPosting]      = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  // ── Like ──────────────────────────────────────────────
  const toggleLike = async (e) => {
    e.preventDefault();
    if (liking) return;
    setLiking(true);
    try {
      const fn  = liked ? unlikePost : likePost;
      const res = await fn(post.post_id);
      const newCount = res.data.data.likes_count;
      const newLiked = !liked;
      setLiked(newLiked);
      setLikeCount(newCount);
      onLikeChange?.(post.post_id, newLiked, newCount);
    } catch {
      /* ignore */
    } finally {
      setLiking(false);
    }
  };

  // ── Comments ──────────────────────────────────────────
  const toggleComments = async (e) => {
    e.preventDefault();
    if (!showComments && comments.length === 0) {
      setLoadingCmts(true);
      try {
        const res = await getComments(post.post_id);
        setComments(res.data.data.comments || []);
      } catch { /* ignore */ }
      finally { setLoadingCmts(false); }
    }
    setShowComments((s) => !s);
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || posting) return;
    setPosting(true);
    try {
      const res = await addComment(post.post_id, { comment_text: newComment.trim() });
      const c   = res.data.data.comment;
      // Hydrate author info from localStorage
      const enriched = {
        ...c,
        author_name:    currentUser.name    || "You",
        profile_picture: currentUser.profile_picture || null,
      };
      setComments((prev) => [...prev, enriched]);
      setCommentCount((n) => n + 1);
      setNewComment("");
    } catch { /* ignore */ }
    finally { setPosting(false); }
  };

  const cultureName = post.culture_name || "";
  const authorAvatar = getAvatar(post.profile_picture, post.author_name, 40);

  return (
    <article className="pcard">
      {/* Header */}
      <div className="pcard-header">
        <div className="pcard-author">
          <img src={authorAvatar} alt={post.author_name} className="pcard-avatar" />
          <div>
            <span className="pcard-author-name">{post.author_name}</span>
            <div className="pcard-meta">
              {cultureName && <span className="pcard-culture">{cultureName}</span>}
              <span className="pcard-date">
                {new Date(post.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>
        {post.post_type === "reel" && (
          <span className="pcard-reel-badge">▶ Reel</span>
        )}
      </div>

      {/* Media */}
      {post.media_url && (
        <Link to={`/post/${post.post_id}`} className="pcard-media">
          {post.post_type === "reel"
            ? (
              <div className="pcard-reel-thumb">
                <video src={post.media_url} preload="metadata" muted playsInline />
                <div className="pcard-play-overlay"><div className="pcard-play-btn"><PlayIcon /></div></div>
              </div>
            )
            : <img src={post.media_url} alt={post.title} loading="lazy" />
          }
        </Link>
      )}

      {/* Body */}
      <div className="pcard-body">
        <Link to={`/post/${post.post_id}`}>
          <h3 className="pcard-title">{post.title}</h3>
        </Link>
        {post.description && <p className="pcard-desc">{post.description}</p>}

        {/* Actions */}
        <div className="pcard-actions">
          <button className={`pcard-btn pcard-like ${liked ? "liked" : ""}`} onClick={toggleLike} disabled={liking}>
            <HeartIcon filled={liked} />
            <span>{likeCount}</span>
          </button>
          <button className="pcard-btn pcard-comment" onClick={toggleComments}>
            <CommentIcon />
            <span>{commentCount}</span>
          </button>
        </div>

        {/* Inline comments */}
        {showComments && (
          <div className="pcard-comments">
            {loadingCmts && <p className="pcard-no-comments">Loading…</p>}
            {!loadingCmts && comments.length === 0 && (
              <p className="pcard-no-comments">No comments yet — be the first!</p>
            )}
            {comments.map((c) => (
              <div key={c.comment_id} className="pcard-comment-item">
                <img
                  src={getAvatar(c.profile_picture, c.author_name, 28)}
                  alt={c.author_name}
                  className="pcard-cmt-avatar"
                />
                <div className="pcard-cmt-body">
                  <span className="pcard-cmt-name">{c.author_name}</span>
                  <p className="pcard-cmt-text">{c.comment_text}</p>
                  <span className="pcard-cmt-time">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
            <form className="pcard-cmt-form" onSubmit={submitComment}>
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment…"
                className="pcard-cmt-input"
                disabled={posting}
              />
              <button type="submit" className="pcard-cmt-submit" disabled={posting}>
                {posting ? "…" : "Post"}
              </button>
            </form>
          </div>
        )}
      </div>
    </article>
  );
}