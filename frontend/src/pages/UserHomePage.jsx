import React, { useState, useEffect, useCallback } from "react";
import PostCard from "../components/PostCard";
import QuestionCard from "../components/QuestionCard";
import { getFeed } from "../api/postService";
import { getQuestions } from "../api/questionService";
import useCultures from "../hooks/useCultures";
import CultureFilter from "../components/CultureFilter";
import NotificationPanel from "../components/NotificationPanel";
import "./UserHomePage.css";
/* eslint-disable no-unused-vars */

export default function UserHomePage() {
  const [posts,         setPosts]         = useState([]);
  const [questions,     setQuestions]     = useState([]);
  const [typeFilter,    setTypeFilter]    = useState("all");
  const [cultureFilter, setCultureFilter] = useState("");
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [mobileCulture, setMobileCulture] = useState(false);

  const { cultures } = useCultures();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (typeFilter === "recipe" || typeFilter === "reel") params.type = typeFilter;
      if (cultureFilter) params.culture_id = cultureFilter;

      if (typeFilter === "question") {
        const qRes = await getQuestions();
        let qs = qRes.data.data.questions || [];
        if (cultureFilter) qs = qs.filter(q => String(q.culture_id) === cultureFilter);
        setQuestions(qs);
        setPosts([]);
      } else if (typeFilter === "all") {
        const [postRes, qRes] = await Promise.all([getFeed(params), getQuestions()]);
        let qs = qRes.data.data.questions || [];
        if (cultureFilter) qs = qs.filter(q => String(q.culture_id) === cultureFilter);
        setPosts(postRes.data.data.posts || []);
        setQuestions(qs);
      } else {
        const postRes = await getFeed(params);
        setPosts(postRes.data.data.posts || []);
        setQuestions([]);
      }
    } catch {
      setError("Failed to load posts. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [typeFilter, cultureFilter]);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  const handleLikeChange = (postId, liked, newCount) => {
    setPosts(prev =>
      prev.map(p =>
        p.post_id === postId ? { ...p, liked_by_me: liked, likes_count: newCount } : p
      )
    );
  };

  const merged =
    typeFilter === "all"
      ? [
          ...posts.map(p => ({ ...p, _kind: "post" })),
          ...questions.map(q => ({ ...q, _kind: "question" })),
        ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      : typeFilter === "question"
      ? questions.map(q => ({ ...q, _kind: "question" }))
      : posts.map(p => ({ ...p, _kind: "post" }));

  return (
    <div className="uhome">

      {/* ── LEFT: Culture filter sidebar ── */}
      <CultureFilter
        cultures={cultures}
        cultureFilter={cultureFilter}
        setCultureFilter={setCultureFilter}
      />

      {/* ── MAIN CONTENT ── */}
      <main className="uhome-main">

        {/* Mobile culture drawer */}
        {mobileCulture && (
          <>
            <div className="uhome-mob-overlay" onClick={() => setMobileCulture(false)} />
            <div className="uhome-mob-culture-drawer">
              <div className="uhome-mob-drawer-header">
                <span>Filter by Culture</span>
                <button onClick={() => setMobileCulture(false)}>✕</button>
              </div>
              <div className="uhome-mob-culture-list">
                <button
                  className={`uhome-mob-chip ${!cultureFilter ? "active" : ""}`}
                  onClick={() => { setCultureFilter(""); setMobileCulture(false); }}
                >
                  All Cultures
                </button>
                {cultures.map(c => (
                  <button
                    key={c.culture_id}
                    className={`uhome-mob-chip ${cultureFilter === String(c.culture_id) ? "active" : ""}`}
                    onClick={() => {
                      setCultureFilter(prev =>
                        prev === String(c.culture_id) ? "" : String(c.culture_id)
                      );
                      setMobileCulture(false);
                    }}
                  >
                    {c.culture_name}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Feed */}
        <div className="uhome-feed-area">

          {/* Page header + mobile controls row */}
          <div className="uhome-feed-header">
            <div className="uhome-feed-header-text">
              <h1 className="uhome-header-title">Community Feed</h1>
              <p className="uhome-header-sub">Recipes, reels and questions from Nepal's food communities</p>
            </div>
            <div className="uhome-feed-header-actions">
              <button
                className="uhome-culture-toggle"
                onClick={() => setMobileCulture(true)}
              >
                🌏 Culture
                {cultureFilter && <span className="uhome-culture-dot" />}
              </button>
             
            </div>
          </div>

          {loading && (
            <div className="uhome-state">
              <div className="uhome-spinner" />
            </div>
          )}

          {!loading && error && (
            <div className="uhome-state">
              <p className="uhome-state-msg">{error}</p>
              <button className="uhome-retry" onClick={loadFeed}>Try again</button>
            </div>
          )}

          {!loading && !error && merged.length === 0 && (
            <div className="uhome-state">
              <span className="uhome-state-icon">🍜</span>
              <p className="uhome-state-msg">Nothing here yet</p>
            </div>
          )}

          {!loading && !error && merged.length > 0 && (
            <div className="uhome-feed">
            {merged.map(item =>
  item._kind === "question"
    ? <QuestionCard key={`q-${item.question_id}`} question={item} />
    : <PostCard key={`p-${item.post_id}`} post={item} onLikeChange={handleLikeChange} />
)}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}