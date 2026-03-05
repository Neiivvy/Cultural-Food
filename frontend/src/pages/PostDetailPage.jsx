import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPost, likePost, unlikePost, getComments, addComment } from "../api/postService";
import { getAvatar } from "../utils/avatar";
import "./PostDetailPage.css";

export default function PostDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [post,     setPost]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [liked,    setLiked]    = useState(false);
  const [likeCount,setLikeCount]= useState(0);
  const [liking,   setLiking]   = useState(false);
  const [comments, setComments] = useState([]);
  const [comment,  setComment]  = useState("");
  const [posting,  setPosting]  = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const load = async () => {
      try {
        const [postRes, cmtRes] = await Promise.all([
          getPost(id),
          getComments(id),
        ]);
        const p = postRes.data.data.post;
        setPost(p);
        setLiked(p.liked_by_me || false);
        setLikeCount(Number(p.likes_count) || 0);
        setComments(cmtRes.data.data.comments || []);
      } catch {
        setError("Post not found.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const toggleLike = async () => {
    if (liking) return;
    setLiking(true);
    try {
      const fn  = liked ? unlikePost : likePost;
      const res = await fn(id);
      setLiked(!liked);
      setLikeCount(res.data.data.likes_count);
    } catch { /* ignore */ }
    finally { setLiking(false); }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!comment.trim() || posting) return;
    setPosting(true);
    try {
      const res = await addComment(id, { comment_text: comment.trim() });
      const c   = res.data.data.comment;
      setComments((prev) => [...prev, {
        ...c,
        author_name:     currentUser.name || "You",
        profile_picture: currentUser.profile_picture || null,
      }]);
      setComment("");
    } catch { /* ignore */ }
    finally { setPosting(false); }
  };

  if (loading) return <div className="detail-loading"><p>Loading…</p></div>;
  if (error || !post) return (
    <div className="detail-notfound">
      <p>{error || "Post not found."}</p>
      <button onClick={() => navigate(-1)}>← Go Back</button>
    </div>
  );

  return (
    <div className="detail-page">
      <div className="detail-container">
        <button className="detail-back" onClick={() => navigate(-1)}>
          <img src="https://api.iconify.design/material-symbols/arrow-back.svg?color=%234b5563" alt="" width="16" height="16" />
          Back
        </button>

        {/* Author */}
        <div className="detail-author-row">
          <img
            src={getAvatar(post.profile_picture, post.author_name, 44)}
            alt={post.author_name}
            className="detail-author-avatar"
          />
          <div>
            <span className="detail-author-name">{post.author_name}</span>
            <div className="detail-author-meta">
              {post.culture_name && <span className="detail-culture-tag">{post.culture_name}</span>}
              <span className="detail-date">
                {new Date(post.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </span>
              {post.post_type === "reel" && <span className="detail-reel-badge">▶ Reel</span>}
            </div>
          </div>
        </div>

        {/* Media */}
        {post.media_url && (
          <div className="detail-media">
            {post.post_type === "reel"
              ? <video src={post.media_url} controls className="detail-video" />
              : <img src={post.media_url} alt={post.title} />
            }
          </div>
        )}

        {/* Actions */}
        <div className="detail-actions">
          <button className={`detail-like-btn ${liked ? "liked" : ""}`} onClick={toggleLike} disabled={liking}>
            <img
              src={liked
                ? "https://api.iconify.design/material-symbols/favorite.svg?color=%23ef4444"
                : "https://api.iconify.design/material-symbols/favorite-outline.svg?color=%234b5563"}
              alt="like" width="22" height="22"
            />
            <span>{likeCount} likes</span>
          </button>
          <span className="detail-comment-count">
            <img src="https://api.iconify.design/material-symbols/chat-bubble-outline.svg?color=%239ca3af" alt="" width="18" height="18" />
            {comments.length} comments
          </span>
        </div>

        <h1 className="detail-title">{post.title}</h1>
        {post.description && <p className="detail-desc">{post.description}</p>}

        {/* Ingredients */}
        {post.ingredients?.length > 0 && (
          <section className="detail-section">
            <h3 className="detail-section-h">
              <img src="https://api.iconify.design/noto/shopping-cart.svg" alt="" width="20" height="20" />
              Ingredients
            </h3>
            <ul className="detail-ingredient-list">
              {post.ingredients.map((ing) => (
                <li key={ing.ingredient_id}>
                  <span className="ing-dot" />
                  {ing.ingredient_text}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Steps */}
        {post.steps?.length > 0 && (
          <section className="detail-section">
            <h3 className="detail-section-h">
              <img src="https://api.iconify.design/noto/cooking.svg" alt="" width="20" height="20" />
              Steps
            </h3>
            <ol className="detail-steps-list">
              {post.steps.map((step) => (
                <li key={step.step_id}>
                  <span className="step-circle">{step.step_number}</span>
                  <span>{step.step_description}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Comments */}
        <section className="detail-section detail-comments-section">
          <h3 className="detail-section-h">
            <img src="https://api.iconify.design/material-symbols/chat-bubble-outline.svg?color=%23111827" alt="" width="20" height="20" />
            Comments ({comments.length})
          </h3>
          <div className="detail-comments-list">
            {comments.length === 0 && (
              <p style={{ color: "var(--text-3)", fontSize: "0.875rem", textAlign: "center", padding: "1rem 0" }}>
                No comments yet.
              </p>
            )}
            {comments.map((c) => (
              <div key={c.comment_id} className="detail-comment">
                <img src={getAvatar(c.profile_picture, c.author_name, 36)} alt={c.author_name} className="detail-cmt-avatar" />
                <div className="detail-cmt-body">
                  <div className="detail-cmt-top">
                    <span className="detail-cmt-name">{c.author_name}</span>
                    <span className="detail-cmt-time">
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="detail-cmt-text">{c.comment_text}</p>
                </div>
              </div>
            ))}
          </div>
          <form className="detail-cmt-form" onSubmit={submitComment}>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write a comment…"
              className="detail-cmt-input"
              disabled={posting}
            />
            <button type="submit" className="detail-cmt-btn" disabled={posting}>
              <img src="https://api.iconify.design/material-symbols/send.svg?color=%23fff" alt="Post" width="16" height="16" />
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}