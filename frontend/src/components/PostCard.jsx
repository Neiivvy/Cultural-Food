/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { likePost, unlikePost, addComment, getComments, deletePost } from "../api/postService";
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
const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);

function CommentText({ text }) {
  // Match @Name (letters, spaces stopped by next @, end, or punctuation)
  const parts = text.split(/(@[A-Za-z][A-Za-z0-9_\s]*?)(?=\s@|\s[^@]|$|[^\w\s])/g);
  return (
    <p className="pcard-cmt-text">
      {text.split(/(@\S+)/g).map((part, i) =>
        part.startsWith("@")
          ? <span key={i} className="pcard-mention">{part}</span>
          : part
      )}
    </p>
  );
}

// Delete confirmation modal
function DeleteModal({ onConfirm, onCancel, type = "post" }) {
  return (
    <div className="pcard-modal-overlay" onClick={onCancel}>
      <div className="pcard-modal" onClick={e => e.stopPropagation()}>
        <div className="pcard-modal-icon">🗑️</div>
        <h3 className="pcard-modal-title">Delete {type}?</h3>
        <p className="pcard-modal-body">This action cannot be undone. Are you sure you want to delete this {type}?</p>
        <div className="pcard-modal-btns">
          <button className="pcard-modal-cancel" onClick={onCancel}>Cancel</button>
          <button className="pcard-modal-confirm" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function PostCard({ post, onLikeChange, onDelete }) {
  const [liked,        setLiked]        = useState(post.liked_by_me || false);
  const [likeCount,    setLikeCount]    = useState(Number(post.likes_count) || 0);
  const [liking,       setLiking]       = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments,     setComments]     = useState([]);
  const [commentCount, setCommentCount] = useState(Number(post.comments_count) || 0);
  const [loadingCmts,  setLoadingCmts]  = useState(false);
  const [newComment,   setNewComment]   = useState("");
  const [posting,      setPosting]      = useState(false);
  const [expanded,     setExpanded]     = useState(false);
  const [showDelete,   setShowDelete]   = useState(false);
  const [deleting,     setDeleting]     = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isOwner     = Number(post.author_id) === Number(currentUser.user_id);
  const DESC_LIMIT  = 160;

  const toggleLike = async (e) => {
    e.preventDefault();
    if (liking) return;
    setLiking(true);
    try {
      const fn       = liked ? unlikePost : likePost;
      const res      = await fn(post.post_id);
      const newCount = res.data.data.likes_count;
      const newLiked = !liked;
      setLiked(newLiked);
      setLikeCount(newCount);
      onLikeChange?.(post.post_id, newLiked, newCount);
    } catch { /* ignore */ }
    finally { setLiking(false); }
  };

  const toggleComments = async (e) => {
    e.preventDefault();
    if (showComments) { setShowComments(false); return; }  // ← CLOSE on second click
    if (comments.length === 0) {
      setLoadingCmts(true);
      try {
        const res = await getComments(post.post_id);
        setComments(res.data.data.comments || []);
      } catch { /* ignore */ }
      finally { setLoadingCmts(false); }
    }
    setShowComments(true);
  };

  // Insert @Name — only the name token, no stray words
  const mentionUser = (name) => {
    // Grab the first token (no spaces) to use as the @mention handle
    const handle = name.trim().split(" ")[0];
    setNewComment(prev => {
      const trimmed = prev.trimEnd();
      return trimmed ? `${trimmed} @${handle} ` : `@${handle} `;
    });
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || posting) return;
    setPosting(true);
    try {
      const res      = await addComment(post.post_id, { comment_text: newComment.trim() });
      const c        = res.data.data.comment;
      const enriched = { ...c, author_name: currentUser.name || "You", profile_picture: currentUser.profile_picture || null };
      setComments(prev => [...prev, enriched]);
      setCommentCount(n => n + 1);
      setNewComment("");
    } catch { /* ignore */ }
    finally { setPosting(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deletePost(post.post_id);
      setShowDelete(false);
      onDelete?.(post.post_id);
    } catch { /* ignore */ }
    finally { setDeleting(false); }
  };

  const authorAvatar = getAvatar(post.profile_picture, post.author_name, 40);
  const desc         = post.description || "";
  const isLong       = desc.length > DESC_LIMIT;
  const visibleDesc  = isLong && !expanded ? desc.slice(0, DESC_LIMIT) + "…" : desc;
  const postTypeName = post.post_type === "reel" ? "reel" : "recipe";

  return (
    <>
      {showDelete && (
        <DeleteModal
          type={postTypeName}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}

      <article className="pcard">
        {/* Header */}
        <div className="pcard-header">
          <div className="pcard-author">
            <img src={authorAvatar} alt={post.author_name} className="pcard-avatar" />
            <div>
              <span className="pcard-author-name">{post.author_name}</span>
              <div className="pcard-meta">
                {post.culture_name && <span className="pcard-culture">{post.culture_name}</span>}
                <span className="pcard-date">
                  {new Date(post.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>
          <div className="pcard-header-right">
            {post.post_type === "reel" && <span className="pcard-reel-badge">▶ Reel</span>}
            {isOwner && (
              <button className="pcard-delete-btn" onClick={() => setShowDelete(true)} title="Delete post">
                <TrashIcon />
              </button>
            )}
          </div>
        </div>

        {/* Media */}
        {post.media_url && (
          <Link to={`/post/${post.post_id}`} className="pcard-media">
            {post.post_type === "reel" ? (
              <div className="pcard-reel-thumb">
                <video src={post.media_url} preload="none" />
                <div className="pcard-play-overlay"><div className="pcard-play-btn"><PlayIcon /></div></div>
              </div>
            ) : (
              <img src={post.media_url} alt={post.title} loading="lazy" />
            )}
          </Link>
        )}

        {/* Body */}
        <div className="pcard-body">
          <Link to={`/post/${post.post_id}`}>
            <h3 className="pcard-title">{post.title}</h3>
          </Link>

          {desc && (
            <div className="pcard-desc-wrap">
              <p className="pcard-desc">{visibleDesc}</p>
              {isLong && (
                <button className="pcard-read-more" onClick={() => setExpanded(x => !x)}>
                  {expanded ? "Show less" : "Read more"}
                </button>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="pcard-actions">
            <button className={`pcard-btn pcard-like ${liked ? "liked" : ""}`} onClick={toggleLike} disabled={liking}>
              <HeartIcon filled={liked} /><span>{likeCount}</span>
            </button>
            <button
              className={`pcard-btn pcard-comment ${showComments ? "active" : ""}`}
              onClick={toggleComments}
              title={showComments ? "Close comments" : "View comments"}
            >
              <CommentIcon /><span>{commentCount}</span>
            </button>
          </div>

          {/* Inline comments — togglable */}
          {showComments && (
            <div className="pcard-comments">
              <div className="pcard-comments-header">
                <span>Comments ({commentCount})</span>
                <button className="pcard-close-cmt" onClick={() => setShowComments(false)}>✕ Close</button>
              </div>
              {loadingCmts && <p className="pcard-no-comments">Loading…</p>}
              {!loadingCmts && comments.length === 0 && <p className="pcard-no-comments">No comments yet — be the first!</p>}
              {comments.map(c => (
                <div key={c.comment_id} className="pcard-comment-item">
                  <img
                    src={getAvatar(c.profile_picture, c.author_name, 28)} alt={c.author_name}
                    className="pcard-cmt-avatar" title={`Mention @${c.author_name}`}
                    onClick={() => mentionUser(c.author_name)} style={{ cursor: "pointer" }}
                  />
                  <div className="pcard-cmt-body">
                    <span className="pcard-cmt-name" onClick={() => mentionUser(c.author_name)} style={{ cursor: "pointer" }}>
                      {c.author_name}
                    </span>
                    <CommentText text={c.comment_text} />
                    <span className="pcard-cmt-time">{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              <form className="pcard-cmt-form" onSubmit={submitComment}>
                <input
                  type="text" value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Add a comment… (click name to @mention)"
                  className="pcard-cmt-input" disabled={posting}
                />
                <button type="submit" className="pcard-cmt-submit" disabled={posting}>
                  {posting ? "…" : "Post"}
                </button>
              </form>
            </div>
          )}
        </div>
      </article>
    </>
  );
}