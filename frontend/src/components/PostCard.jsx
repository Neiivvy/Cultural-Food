
import React, { useState, useRef, useEffect } from "react";
import {
  likePost, unlikePost, addComment, getComments,
  deletePost, getPost, updatePost, deleteComment,
} from "../api/postService";
import { getAvatar } from "../utils/avatar";
import ReelPlayer from "./ReelPlayer";
import "./PostCard.css";

/* ── Icons ── */
const HeartIcon = ({ filled }) => (
  <svg width="18" height="18" viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);
const CommentIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const ChevronDown = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const DotsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
  </svg>
);
const DotsHorizIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
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

/* ── Post three-dots menu ── */
function DotsMenu({ isOwner, onEdit, onDelete, onReport }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return (
    <div className="pcard-dots-wrap" ref={ref}>
      <button className="pcard-dots-btn" onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}>
        <DotsIcon />
      </button>
      {open && (
        <div className="pcard-dots-menu">
          {isOwner ? (
            <>
              <button className="pcard-dots-item" onClick={() => { setOpen(false); onEdit(); }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit post
              </button>
              <button className="pcard-dots-item pcard-dots-danger" onClick={() => { setOpen(false); onDelete(); }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                Delete post
              </button>
            </>
          ) : (
            <button className="pcard-dots-item pcard-dots-report" onClick={() => { setOpen(false); onReport(); }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
              Report post
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Comment three-dots (owner can delete) ── */
function CommentDotsMenu({ isOwner, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  if (!isOwner) return null;
  return (
    <div className="pcard-cmt-dots-wrap" ref={ref}>
      <button
        className="pcard-cmt-dots-btn"
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
      >
        <DotsHorizIcon />
      </button>
      {open && (
        <div className="pcard-cmt-dots-menu">
          <button
            className="pcard-dots-item pcard-dots-danger"
            onClick={() => { setOpen(false); onDelete(); }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Report modal ── */
const REPORT_REASONS = [
  "Inappropriate or offensive content",
  "Spam or misleading information",
  "Incorrect cultural information",
  "Harassment or hate speech",
  "Copyright violation",
  "Other",
];
function ReportModal({ postType, onSubmit, onCancel }) {
  const [selected, setSelected] = useState("");
  const [custom, setCustom] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const handleSubmit = async () => {
    const reason = selected === "Other" ? custom.trim() : selected;
    if (!reason) { setErr("Please select or write a reason."); return; }
    setSubmitting(true); setErr("");
    try { await onSubmit(reason); }
    catch { setErr("Failed to submit. Please try again."); setSubmitting(false); }
  };
  return (
    <div className="pcard-modal-overlay" onClick={onCancel}>
      <div className="pcard-report-modal" onClick={e => e.stopPropagation()}>
        <div className="pcard-report-header">
          <h3 className="pcard-report-title">Report {postType}</h3>
          <button className="pcard-edit-modal-close" onClick={onCancel}>✕</button>
        </div>
        <p className="pcard-report-sub">Why are you reporting this content?</p>
        {err && <p className="pcard-edit-err">{err}</p>}
        <div className="pcard-report-reasons">
          {REPORT_REASONS.map(r => (
            <button key={r} className={`pcard-report-reason ${selected === r ? "selected" : ""}`}
              onClick={() => { setSelected(r); setErr(""); }}>
              <span className="pcard-report-radio">{selected === r ? "●" : "○"}</span>{r}
            </button>
          ))}
        </div>
        {selected === "Other" && (
          <textarea className="pcard-report-custom" rows={3} placeholder="Describe the issue…"
            value={custom} onChange={e => setCustom(e.target.value)} />
        )}
        <div className="pcard-report-footer">
          <button className="pcard-edit-cancel" onClick={onCancel}>Cancel</button>
          <button className="pcard-report-submit" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit Report"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReportToast({ onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return <div className="pcard-report-toast">🛡️ Report sent to admin. Thank you for keeping the community safe.</div>;
}

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

function EditModal({ post, onSave, onCancel }) {
  const [title, setTitle] = useState(post.title || "");
  const [description, setDesc] = useState(post.description || "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const handleSave = async () => {
    if (!title.trim()) { setErr("Title is required."); return; }
    setSaving(true); setErr("");
    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("description", description.trim());
      await updatePost(post.post_id, fd);
      onSave({ ...post, title: title.trim(), description: description.trim() });
    } catch { setErr("Failed to save. Try again."); }
    finally { setSaving(false); }
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
            <input className="pcard-edit-input" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="pcard-edit-field">
            <label className="pcard-edit-label">Description</label>
            <textarea className="pcard-edit-input pcard-edit-textarea" value={description} onChange={e => setDesc(e.target.value)} rows={4} />
          </div>
        </div>
        <div className="pcard-edit-footer">
          <button className="pcard-edit-cancel" onClick={onCancel}>Cancel</button>
          <button className="pcard-edit-save" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
        </div>
      </div>
    </div>
  );
}

/* ── Full Recipe / Reel Detail Modal ── */
function FullRecipeOverlay({ post, fullData, loading, onClose }) {
  const data   = fullData || post;
  const isReel = post.post_type === "reel";
  return (
    <div className="pcard-recipe-overlay" onClick={onClose}>
      <div className={`pcard-recipe-modal ${isReel ? "pcard-recipe-modal--reel" : ""}`} onClick={e => e.stopPropagation()}>
        <div className="pcard-recipe-modal-header">
          <h2 className="pcard-recipe-modal-title">{data.title}</h2>
          <button className="pcard-recipe-modal-close" onClick={onClose}>✕</button>
        </div>
        {isReel && post.media_url && (
          <div className="pcard-recipe-modal-reel-wrap">
            <ReelPlayer src={post.media_url} isActive={true} />
          </div>
        )}
        {!isReel && post.media_url && (
          <img src={post.media_url} alt={post.title} className="pcard-recipe-modal-img" />
        )}
        <div className="pcard-recipe-modal-body">
          <div className="pcard-recipe-modal-meta">
            {post.culture_name && <span className="pcard-recipe-modal-culture">{post.culture_name}</span>}
            {post.author_name  && <span className="pcard-recipe-modal-author">by {post.author_name}</span>}
          </div>
          {data.description && <p className="pcard-recipe-modal-desc">{data.description}</p>}
          {loading && (
            <div className="pcard-recipe-loading">
              <div className="pcard-recipe-spinner" /><span>Loading full recipe…</span>
            </div>
          )}
          {!loading && data.ingredients?.length > 0 && (
            <div className="pcard-recipe-modal-section">
              <h4 className="pcard-recipe-modal-section-title">Ingredients</h4>
              <ul className="pcard-recipe-modal-ingredients">
                {data.ingredients.map((ing, i) => {
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
          {!loading && data.steps?.length > 0 && (
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

/* ════════════════════════════════════════
   Main PostCard
   ════════════════════════════════════════ */
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
  const [showReport,     setShowReport]     = useState(false);
  const [showToast,      setShowToast]      = useState(false);
  const [deleted,        setDeleted]        = useState(false);

  const currentUser  = JSON.parse(localStorage.getItem("user") || "{}");
  const isOwner      = String(post.author_id) === String(currentUser.user_id);
  const desc         = post.description || "";
  const isReel       = post.post_type === "reel";
  const postTypeName = isReel ? "reel" : "recipe";

  if (deleted) return null;

  const openFullRecipe = async () => {
    setShowFullRecipe(true);
    if (!fullData) {
      setLoadingFull(true);
      try {
        const res     = await getPost(post.post_id);
        const fetched = res.data.data?.post || res.data.data || null;
        setFullData(fetched);
      } catch { /* ignore */ }
      finally { setLoadingFull(false); }
    }
  };

  const toggleLike = async (e) => {
    e.preventDefault();
    if (liking) return;
    setLiking(true);
    try {
      const fn  = liked ? unlikePost : likePost;
      const res = await fn(post.post_id);
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
      const enriched = {
        ...c,
        author_name:     currentUser.name            || "You",
        profile_picture: currentUser.profile_picture || null,
        user_id:         currentUser.user_id,
      };
      setComments(prev => [...prev, enriched]);
      setCommentCount(n => n + 1); setNewComment("");
    } catch { /* ignore */ }
    finally { setPosting(false); }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId);
      setComments(prev => prev.filter(c => c.comment_id !== commentId));
      setCommentCount(n => Math.max(0, n - 1));
    } catch { /* ignore */ }
  };

  const handleDelete = async () => {
    try {
      await deletePost(post.post_id);
      setShowDelete(false); setDeleted(true);
      onDelete?.(post.post_id);
    } catch { /* ignore */ }
  };

  const handleReport = async (reason) => {
    const { default: axiosInstance } = await import("../api/axiosInstance");
    await axiosInstance.post("/reports", { post_id: post.post_id, reason });
    setShowReport(false); setShowToast(true);
  };

  const authorAvatar = getAvatar(post.profile_picture, post.author_name, 36);

  return (
    <>
      {showDelete    && <DeleteModal    type={postTypeName} onConfirm={handleDelete} onCancel={() => setShowDelete(false)} />}
      {showEdit      && <EditModal      post={post} onSave={(u) => { setPost(u); setShowEdit(false); }} onCancel={() => setShowEdit(false)} />}
      {showFullRecipe && <FullRecipeOverlay post={post} fullData={fullData} loading={loadingFull} onClose={() => setShowFullRecipe(false)} />}
      {showReport    && <ReportModal    postType={postTypeName} onSubmit={handleReport} onCancel={() => setShowReport(false)} />}
      {showToast     && <ReportToast    onDone={() => setShowToast(false)} />}

      <article className={`pcard ${isReel ? "pcard--reel" : ""}`}>

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
            {isReel
              ? <span className="pcard-reel-badge">▶ Reel</span>
              : <span className="pcard-recipe-badge">📖 Recipe</span>
            }
            <DotsMenu isOwner={isOwner} onEdit={() => setShowEdit(true)} onDelete={() => setShowDelete(true)} onReport={() => setShowReport(true)} />
          </div>
        </div>

        {/* ── Media ── */}
        {post.media_url && (
          <div className={`pcard-media ${isReel ? "pcard-media--reel" : ""}`}>
            {isReel ? (
              <ReelPlayer src={post.media_url} poster={post.thumbnail_url || undefined} />
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
            <p className="pcard-desc">{desc.length > 200 ? desc.slice(0, 200) + "…" : desc}</p>
          )}
          <button className="pcard-see-recipe" onClick={openFullRecipe}>
            {isReel ? "See full details" : "See full recipe"} <ChevronDown />
          </button>

          <div className="pcard-actions">
            <button className={`pcard-btn pcard-like ${liked ? "liked" : ""}`} onClick={toggleLike} disabled={liking}>
              <HeartIcon filled={liked} /><span>{likeCount}</span>
            </button>
            <button className={`pcard-btn pcard-comment ${showComments ? "active" : ""}`} onClick={toggleComments}>
              <CommentIcon /><span>{commentCount}</span>
            </button>
          </div>

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
                  <img src={getAvatar(c.profile_picture, c.author_name, 26)} alt={c.author_name}
                    className="pcard-cmt-avatar" onClick={() => mentionUser(c.author_name)} style={{ cursor: "pointer" }} />
                  <div className="pcard-cmt-body">
                    <span className="pcard-cmt-name" onClick={() => mentionUser(c.author_name)} style={{ cursor: "pointer" }}>{c.author_name}</span>
                    <CommentText text={c.comment_text} />
                    <span className="pcard-cmt-time">{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                  {/* Three dots — only visible to comment owner */}
                  <CommentDotsMenu
                    isOwner={String(c.user_id) === String(currentUser.user_id)}
                    onDelete={() => handleDeleteComment(c.comment_id)}
                  />
                </div>
              ))}
              <form className="pcard-cmt-form" onSubmit={submitComment}>
                <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)}
                  placeholder="Add a comment…" className="pcard-cmt-input" disabled={posting} />
                <button type="submit" className="pcard-cmt-submit" disabled={posting}>{posting ? "…" : "Post"}</button>
              </form>
            </div>
          )}
        </div>
      </article>
    </>
  );
}