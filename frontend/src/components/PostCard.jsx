import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './PostCard.css';

const HeartIcon = ({ filled }) => (
  <svg width="20" height="20" viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);
const CommentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const PlayIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24"
    fill="white" stroke="white" strokeWidth="1">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);

export default function PostCard({ post }) {
  const [liked, setLiked] = useState(post.liked || false);
  const [likeCount, setLikeCount] = useState(post.likes || 0);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);

  const toggleLike = (e) => {
    e.preventDefault();
    setLiked(l => !l);
    setLikeCount(c => liked ? c - 1 : c + 1);
  };

  const openComments = (e) => {
    e.preventDefault();
    setShowComments(s => !s);
  };

  const submitComment = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setComments(prev => [...prev, {
      id: Date.now(),
      author: {
        name: user.name || 'You',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'You')}&background=ec4899&color=fff&size=32`,
      },
      text: comment,
      time: 'Just now',
    }]);
    setComment('');
  };

  return (
    <article className="pcard">
      {/* Header */}
      <div className="pcard-header">
        <div className="pcard-author">
          <img src={post.author.avatar} alt={post.author.name} className="pcard-avatar" />
          <div>
            <span className="pcard-author-name">{post.author.name}</span>
            <div className="pcard-meta">
              <span className="pcard-culture">{post.culture}</span>
              <span className="pcard-date">{post.createdAt}</span>
            </div>
          </div>
        </div>
        {post.type === 'reel' && (
          <span className="pcard-reel-badge">
            <img src="https://api.iconify.design/material-symbols/play-circle-outline.svg?color=%23fff" width="12" height="12" alt="" />
            Reel
          </span>
        )}
      </div>

      {/* Media */}
      <Link to={`/post/${post.id}`} className="pcard-media">
        <img src={post.image} alt={post.title} loading="lazy" />
        {post.type === 'reel' && (
          <div className="pcard-play-overlay">
            <div className="pcard-play-btn"><PlayIcon /></div>
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="pcard-body">
        <Link to={`/post/${post.id}`}>
          <h3 className="pcard-title">{post.title}</h3>
        </Link>
        <p className="pcard-desc">{post.description}</p>

        {/* Actions */}
        <div className="pcard-actions">
          <button
            className={`pcard-btn pcard-like ${liked ? 'liked' : ''}`}
            onClick={toggleLike}
          >
            <HeartIcon filled={liked} />
            <span>{likeCount}</span>
          </button>
          <button
            className="pcard-btn pcard-comment"
            onClick={openComments}
          >
            <CommentIcon />
            <span>{post.comments + comments.length}</span>
          </button>
        </div>

        {/* Inline comments */}
        {showComments && (
          <div className="pcard-comments">
            {comments.length === 0 && post.comments === 0 && (
              <p className="pcard-no-comments">No comments yet — be the first!</p>
            )}
            {comments.map(c => (
              <div key={c.id} className="pcard-comment-item">
                <img src={c.author.avatar} alt={c.author.name} className="pcard-cmt-avatar" />
                <div className="pcard-cmt-body">
                  <span className="pcard-cmt-name">{c.author.name}</span>
                  <p className="pcard-cmt-text">{c.text}</p>
                  <span className="pcard-cmt-time">{c.time}</span>
                </div>
              </div>
            ))}
            <form className="pcard-cmt-form" onSubmit={submitComment}>
              <input
                type="text"
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Add a comment…"
                className="pcard-cmt-input"
              />
              <button type="submit" className="pcard-cmt-submit">Post</button>
            </form>
          </div>
        )}
      </div>
    </article>
  );
}