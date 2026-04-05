/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { likePost, unlikePost, addComment, getComments, deletePost, getPost, updatePost } from "../api/postService";
import { getAvatar } from "../utils/avatar";
import "./PostCard.css";

/* ── Icons ── */
const HeartIcon = ({ filled }) => (
  <svg width="20" height="20" viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);
const CommentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const PlayIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);
const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

function CommentText({ text }) {
  return (
    <p className="pcard-cmt-text">
      {text.split(/(@\S+)/g).map((part, i) =>
        part.startsWith("@") ? <span key={i} className="pcard-mention">{part}</span> : part
      )}
    </p>
  );
}

/* ── Delete confirm modal ── */
function DeleteModal({ type, onConfirm, onCancel }) {
  return (
    <div className="pcard-modal-overlay" onClick={onCancel}>
      <div className="pcard-modal" onClick={e => e.stopPropagation()}>
        <div className="pcard-modal-icon">🗑️</div>
        <h3 className="pcard-modal-title">Delete {type}?</h3>
        <p className="pcard-modal-body">This cannot be undone. Are you sure?</p>
        <div className="pcard-modal-btns">
          <button className="pcard-modal-cancel" onClick={onCancel}>Cancel</button>
          <button className="pcard-modal-confirm" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ── Edit modal ── */
function EditModal({ post, onSave, onCancel }) {
  const [title, setTitle]       = useState(post.title || "");
  const [description, setDesc]  = useState(post.description || "");
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState("");

  const handleSave = async () => {
    if (!title.trim()) { setErr("Title is required."); return; }
    setSaving(true); setErr("");
    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("description", description.trim());
      await updatePost(post.post_id, fd);
      onSave({ ...post, title: title.trim(), description: description.trim() });
    } catch {
      setErr("Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pcard-modal-overlay" onClick={onCancel}>
      <div className="pcard-edit-modal" onClick={e => e.stopPropagation()}>
        <div className="pcard-edit-modal-header">
          <h3 className="pcard-edit-modal-title">Edit Post</h3>
          <button className="pcard-edit-modal-close" onClick={onCancel}>✕</button>
        </div>
        {err && <p className="pcard-edit-err">{err}</p>}
        <div className="pcard-edit-fields">
          <div className="pcard-edit-field">
            <label className="pcard-edit-label">Title</label>
            <input
              className="pcard-edit-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Title"
            />
          </div>
          <div className="pcard-edit-field">
            <label className="pcard-edit-label">Description</label>
            <textarea
              className="pcard-edit-input pcard-edit-textarea"
              value={description}
              onChange={e => setDesc(e.target.value)}
              rows={5}
              placeholder="Description"
            />
          </div>
        </div>
        <div className="pcard-edit-footer">
          <button className="pcard-edit-cancel" onClick={onCancel}>Cancel</button>
          <button className="pcard-edit-save" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Full Recipe Modal ── */
function FullRecipeOverlay({ post, fullData, loading, onClose }) {
  const data = fullData || post;
  return (
    <div className="pcard-recipe-overlay" onClick={onClose}>
      <div className="pcard-recipe-modal" onClick={e => e.stopPropagation()}>
        <div className="pcard-recipe-modal-header">
          <h2 className="pcard-recipe-modal-title">{data.title}</h2>
          <button className="pcard-recipe-modal-close" onClick={onClose}>✕</button>
        </div>
        {post.media_url && post.post_type !== "reel" && (
          <img src={post.media_url} alt={post.title} className="pcard-recipe-modal-img" />
        )}
        <div className="pcard-recipe-modal-body">
          <div className="pcard-recipe-modal-meta">
            {post.culture_name && (
              <span className="pcard-recipe-modal-culture">{post.culture_name}</span>
            )}
            {post.author_name && (
              <span className="pcard-recipe-modal-author">by {post.author_name}</span>
            )}
          </div>
          {data.description && (
            <p className="pcard-recipe-modal-desc">{data.description}</p>
          )}
          {loading && (
            <div className="pcard-recipe-loading">
              <div className="pcard-recipe-spinner" />
              <span>Loading full recipe…</span>
            </div>
          )}
          {!loading && data.ingredients && data.ingredients.length > 0 && (
            <div className="pcard-recipe-modal-section">
              <h4 className="pcard-recipe-modal-section-title">Ingredients</h4>
              <ul className="pcard-recipe-modal-ingredients">
                {data.ingredients.map((ing, i) => {
                  // API returns ingredient_text as a single string like "Potatoes: 2 cups"
                  const text = ing.ingredient_text || ing.ingredient_name || ing.name || String(ing);
                  return (
                    <li key={ing.ingredient_id || i} className="pcard-recipe-ing-item">
                      <span className="pcard-recipe-ing-dot">•</span>
                      <span className="pcard-recipe-ing-text">{text}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {!loading && data.steps && data.steps.length > 0 && (
            <div className="pcard-recipe-modal-section">
              <h4 className="pcard-recipe-modal-section-title">Steps</h4>
              <ol className="pcard-recipe-modal-steps">
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
    </div>
  );
}

/* ── Main PostCard ── */
export default function PostCard({ post: initialPost, onLikeChange, onDelete }) {
  const [post,           setPost]           = useState(initialPost);
  const [liked,          setLiked]          = useState(post.liked_by_me || false);
  const [likeCount,      setLikeCount]      = useState(Number(post.likes_count) || 0);
  const [liking,         setLiking]         = useState(false);
  const [showComments,   setShowComments]   = useState(false);
  const [comments,       setComments]       = useState([]);
  const [commentCount,   setCommentCount]   = useState(Number(post.comments_count) || 0);
  const [loadingCmts,    setLoadingCmts]    = useState(false);
  const [newComment,     setNewComment]     = useState("");
  const [posting,        setPosting]        = useState(false);
  const [showFullRecipe, setShowFullRecipe] = useState(false);
  const [fullData,       setFullData]       = useState(null);
  const [loadingFull,    setLoadingFull]    = useState(false);
  const [showDelete,     setShowDelete]     = useState(false);
  const [showEdit,       setShowEdit]       = useState(false);
  const [deleting,       setDeleting]       = useState(false);

  const currentUser  = JSON.parse(localStorage.getItem("user") || "{}");
  const isOwner      = String(post.author_id) === String(currentUser.user_id);
  const desc         = post.description || "";
  const isLong       = desc.length > 300;
  const postTypeName = post.post_type === "reel" ? "reel" : "recipe";

  const openFullRecipe = async () => {
    setShowFullRecipe(true);
    if (!fullData) {
      setLoadingFull(true);
      try {
        const res     = await getPost(post.post_id);
        const fetched = res.data.data?.post || res.data.data || null;
        console.log("[PostCard] ingredients:", fetched?.ingredients);
        setFullData(fetched);
      } catch (err) {
        console.error("[PostCard] getPost error:", err);
      } finally {
        setLoadingFull(false);
      }
    }
  };

  const toggleLike = async (e) => {
    e.preventDefault();
    if (liking) return;
    setLiking(true);
    try {
      const fn       = liked ? unlikePost : likePost;
      const res      = await fn(post.post_id);
      const newCount = res.data.data.likes_count;
      const newLiked = !liked;
      setLiked(newLiked); setLikeCount(newCount);
      onLikeChange?.(post.post_id, newLiked, newCount);
    } catch { /* ignore */ }
    finally { setLiking(false); }
  };

  const toggleComments = async (e) => {
    e.preventDefault();
    if (showComments) { setShowComments(false); return; }
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

  const mentionUser = (name) => {
    const handle = name.trim().split(" ")[0];
    setNewComment(prev => { const t = prev.trimEnd(); return t ? `${t} @${handle} ` : `@${handle} `; });
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
      setCommentCount(n => n + 1); setNewComment("");
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

  const handleEditSave = (updated) => {
    setPost(updated);
    setShowEdit(false);
  };

  const authorAvatar = getAvatar(post.profile_picture, post.author_name, 40);

  return (
    <>
      {showDelete && (
        <DeleteModal type={postTypeName} onConfirm={handleDelete} onCancel={() => setShowDelete(false)} />
      )}
      {showEdit && (
        <EditModal post={post} onSave={handleEditSave} onCancel={() => setShowEdit(false)} />
      )}
      {showFullRecipe && (
        <FullRecipeOverlay
          post={post} fullData={fullData} loading={loadingFull}
          onClose={() => setShowFullRecipe(false)}
        />
      )}

      <article className="pcard">
        {/* ── Header ── */}
        <div className="pcard-header">
          <div className="pcard-author">
            <img src={authorAvatar} alt={post.author_name} className="pcard-avatar" />
            <div>
              <span className="pcard-author-name">{post.author_name}</span>
              <span className="pcard-date">
                {new Date(post.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
          </div>
          <div className="pcard-header-right">
            {post.culture_name && <span className="pcard-culture">{post.culture_name}</span>}
            {post.post_type === "reel"
              ? <span className="pcard-reel-badge">▶ Reel</span>
              : <span className="pcard-recipe-badge">📖 Recipe</span>
            }
            {/* Edit + Delete — only visible to post owner */}
            {isOwner && (
              <div className="pcard-owner-actions">
                <button className="pcard-edit-btn" onClick={() => setShowEdit(true)} title="Edit post">
                  <EditIcon />
                </button>
                <button className="pcard-delete-btn" onClick={() => setShowDelete(true)} title="Delete post">
                  <TrashIcon />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Media ── */}
        {post.media_url && (
          <div className="pcard-media">
            {post.post_type === "reel" ? (
              <Link to={`/post/${post.post_id}`} className="pcard-media-link">
                <div className="pcard-reel-thumb">
                  <video src={post.media_url} preload="none" />
                  <div className="pcard-play-overlay"><div className="pcard-play-btn"><PlayIcon /></div></div>
                </div>
              </Link>
            ) : (
              <div className="pcard-media-link" onClick={openFullRecipe} style={{ cursor: "pointer" }}>
                <img src={post.media_url} alt={post.title} loading="lazy" />
              </div>
            )}
          </div>
        )}

        {/* ── Body ── */}
        <div className="pcard-body">
          <h3 className="pcard-title">{post.title}</h3>
          {desc && (
            <div className="pcard-desc-wrap">
              <p className="pcard-desc">{isLong ? desc.slice(0, 300) + "…" : desc}</p>
            </div>
          )}
          {post.post_type === "recipe" && (
            <button className="pcard-see-recipe" onClick={openFullRecipe}>
              See full recipe <ChevronDown />
            </button>
          )}

          {/* Actions */}
          <div className="pcard-actions">
            <button className={`pcard-btn pcard-like ${liked ? "liked" : ""}`} onClick={toggleLike} disabled={liking}>
              <HeartIcon filled={liked} /><span>{likeCount}</span>
            </button>
            <button className={`pcard-btn pcard-comment ${showComments ? "active" : ""}`} onClick={toggleComments}>
              <CommentIcon /><span>{commentCount}</span>
            </button>
          </div>

          {/* Inline comments */}
          {showComments && (
            <div className="pcard-comments">
              <div className="pcard-comments-header">
                <span>Comments ({commentCount})</span>
                <button className="pcard-close-cmt" onClick={() => setShowComments(false)}>✕ Close</button>
              </div>
              {loadingCmts && <p className="pcard-no-comments">Loading…</p>}
              {!loadingCmts && comments.length === 0 && (
                <p className="pcard-no-comments">No comments yet — be the first!</p>
              )}
              {comments.map(c => (
                <div key={c.comment_id} className="pcard-comment-item">
                  <img src={getAvatar(c.profile_picture, c.author_name, 28)} alt={c.author_name}
                    className="pcard-cmt-avatar" onClick={() => mentionUser(c.author_name)} style={{ cursor: "pointer" }} />
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
                <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)}
                  placeholder="Add a comment…" className="pcard-cmt-input" disabled={posting} />
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