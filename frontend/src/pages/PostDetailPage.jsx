import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dummyPosts, dummyComments } from '../data/dummyDataPost';
import './PostDetailPage.css';

export default function PostDetailPage() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const post       = dummyPosts.find(p => p.id === Number(id));

  const [liked, setLiked]       = useState(post?.liked || false);
  const [likeCount, setLikeCount] = useState(post?.likes || 0);
  const [comments, setComments] = useState(dummyComments);
  const [comment, setComment]   = useState('');

  if (!post) return (
    <div className="detail-notfound">
      <p>Post not found.</p>
      <button onClick={() => navigate(-1)}>← Go Back</button>
    </div>
  );

  const toggleLike = () => {
    setLiked(l => !l);
    setLikeCount(c => liked ? c - 1 : c + 1);
  };

  const submitComment = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setComments(prev => [...prev, {
      id: Date.now(),
      author: {
        name: user.name || 'You',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'You')}&background=ec4899&color=fff&size=36`,
      },
      text: comment,
      time: 'Just now',
    }]);
    setComment('');
  };

  return (
    <div className="detail-page">
      <div className="detail-container">
        {/* Back */}
        <button className="detail-back" onClick={() => navigate(-1)}>
          <img src="https://api.iconify.design/material-symbols/arrow-back.svg?color=%234b5563" alt="" width="16" height="16" />
          Back
        </button>

        {/* Author */}
        <div className="detail-author-row">
          <img src={post.author.avatar} alt={post.author.name} className="detail-author-avatar" />
          <div>
            <span className="detail-author-name">{post.author.name}</span>
            <div className="detail-author-meta">
              <span className="detail-culture-tag">{post.culture}</span>
              <span className="detail-date">{post.createdAt}</span>
              {post.type === 'reel' && <span className="detail-reel-badge">▶ Reel</span>}
            </div>
          </div>
        </div>

        {/* Media */}
        <div className="detail-media">
          <img src={post.image} alt={post.title} />
        </div>

        {/* Actions strip */}
        <div className="detail-actions">
          <button
            className={`detail-like-btn ${liked ? 'liked' : ''}`}
            onClick={toggleLike}
          >
            <img
              src={liked
                ? 'https://api.iconify.design/material-symbols/favorite.svg?color=%23ef4444'
                : 'https://api.iconify.design/material-symbols/favorite-outline.svg?color=%234b5563'
              }
              alt="like"
              width="22"
              height="22"
            />
            <span>{likeCount} likes</span>
          </button>
          <span className="detail-comment-count">
            <img src="https://api.iconify.design/material-symbols/chat-bubble-outline.svg?color=%239ca3af" alt="" width="18" height="18" />
            {comments.length} comments
          </span>
        </div>

        {/* Title & description */}
        <h1 className="detail-title">{post.title}</h1>
        <p className="detail-desc">{post.description}</p>

        {/* Ingredients */}
        {post.ingredients?.length > 0 && (
          <section className="detail-section">
            <h3 className="detail-section-h">
              <img src="https://api.iconify.design/noto/shopping-cart.svg" alt="" width="20" height="20" />
              Ingredients
            </h3>
            <ul className="detail-ingredient-list">
              {post.ingredients.map((ing, i) => (
                <li key={i}>
                  <span className="ing-dot" />
                  {ing}
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
              {post.steps.map((step, i) => (
                <li key={i}>
                  <span className="step-circle">{i + 1}</span>
                  <span>{step}</span>
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
            {comments.map(c => (
              <div key={c.id} className="detail-comment">
                <img src={c.author.avatar} alt={c.author.name} className="detail-cmt-avatar" />
                <div className="detail-cmt-body">
                  <div className="detail-cmt-top">
                    <span className="detail-cmt-name">{c.author.name}</span>
                    <span className="detail-cmt-time">{c.time}</span>
                  </div>
                  <p className="detail-cmt-text">{c.text}</p>
                </div>
              </div>
            ))}
          </div>

          <form className="detail-cmt-form" onSubmit={submitComment}>
            <input
              type="text"
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Write a comment…"
              className="detail-cmt-input"
            />
            <button type="submit" className="detail-cmt-btn">
              <img src="https://api.iconify.design/material-symbols/send.svg?color=%23fff" alt="Post" width="16" height="16" />
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}