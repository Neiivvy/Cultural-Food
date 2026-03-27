import React, { useState, useEffect, useCallback } from "react";
import PostCard from "../components/PostCard";
import QuestionCard from "../components/QuestionCard";
import { getFeed } from "../api/postService";
import { getQuestions } from "../api/questionService";
import useCultures from "../hooks/useCultures";
import "./UserHomePage.css";

const TYPE_TABS = [
  { id: "all",      label: "All",       emoji: "🍽" },
  { id: "recipe",   label: "Recipes",   emoji: "📖" },
  { id: "reel",     label: "Reels",     emoji: "▶"  },
  { id: "question", label: "Questions", emoji: "❓" },
];

export default function UserHomePage() {
  const [posts,         setPosts]         = useState([]);
  const [questions,     setQuestions]     = useState([]);
  const [typeFilter,    setTypeFilter]    = useState("all");
  const [cultureFilter, setCultureFilter] = useState("");
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [sidebarOpen,   setSidebarOpen]   = useState(false);

  const { cultures } = useCultures();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const loadFeed = useCallback(async () => {
    setLoading(true); setError("");
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
    setPosts(prev => prev.map(p =>
      p.post_id === postId ? { ...p, liked_by_me: liked, likes_count: newCount } : p
    ));
  };

  const merged = typeFilter === "all"
    ? [...posts.map(p => ({ ...p, _kind: "post" })),
       ...questions.map(q => ({ ...q, _kind: "question", created_at: q.created_at }))]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    : typeFilter === "question"
      ? questions.map(q => ({ ...q, _kind: "question" }))
      : posts.map(p => ({ ...p, _kind: "post" }));

  const total = merged.length;

  const activeCultureName = cultures.find(c => String(c.culture_id) === cultureFilter)?.culture_name;

  return (
    <div className="uhome">

      {/* ── Top bar: welcome left + type tabs center ── */}
      <div className="uhome-topbar">
        <div className="uhome-topbar-inner">
          <div className="uhome-welcome">
            <span className="uhome-wave">👋</span>
            <div>
              <p className="uhome-welcome-name">
                Welcome, <strong>{user.name?.split(" ")[0] || "Friend"}</strong>
              </p>
              <p className="uhome-welcome-sub">
                What's <span>cooking</span> today?
              </p>
            </div>
          </div>

          <div className="uhome-type-tabs">
            {TYPE_TABS.map(f => (
              <button
                key={f.id}
                className={`uhome-tab ${typeFilter === f.id ? "active" : ""}`}
                onClick={() => setTypeFilter(f.id)}
              >
                <span className="uhome-tab-emoji">{f.emoji}</span>
                <span className="uhome-tab-label">{f.label}</span>
              </button>
            ))}
          </div>

          {/* Mobile sidebar toggle */}
          <button
            className="uhome-sidebar-toggle"
            onClick={() => setSidebarOpen(o => !o)}
            aria-label="Toggle culture filter"
          >
            <span>🗂</span>
            <span>Filter</span>
            {cultureFilter && <span className="uhome-toggle-dot" />}
          </button>
        </div>
      </div>

      {/* ── Body: sidebar + feed ── */}
      <div className="uhome-body">

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="uhome-overlay" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── Sidebar ── */}
        <aside className={`uhome-sidebar ${sidebarOpen ? "open" : ""}`}>

          <div className="uhome-sidebar-section">
            <p className="uhome-sidebar-heading">Browse by Culture</p>
            <ul className="uhome-culture-list">
              <li>
                <button
                  className={`uhome-culture-btn ${!cultureFilter ? "active" : ""}`}
                  onClick={() => { setCultureFilter(""); setSidebarOpen(false); }}
                >
                  <span className="uhome-culture-icon"></span>
                  <span>All Cultures</span>
                </button>
              </li>
              {cultures.map(c => (
                <li key={c.culture_id}>
                  <button
                    className={`uhome-culture-btn ${cultureFilter === String(c.culture_id) ? "active" : ""}`}
                    onClick={() => { setCultureFilter(String(c.culture_id)); setSidebarOpen(false); }}
                  >
                    <span className="uhome-culture-icon"></span>
                    <span>{c.culture_name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="uhome-sidebar-divider" />

          <div className="uhome-sidebar-section">
            <p className="uhome-sidebar-heading">📊 Feed Stats</p>
            <div className="uhome-stat-card">
              <span className="uhome-stat-num">{total}</span>
              <span className="uhome-stat-label">
                {total === 1 ? "post" : "posts"}{activeCultureName ? ` in ${activeCultureName}` : " in feed"}
              </span>
            </div>
          </div>
        </aside>

        {/* ── Main feed ── */}
        <main className="uhome-main">

          {/* Active filter badge */}
          {(cultureFilter || typeFilter !== "all") && (
            <div className="uhome-active-filters">
              {typeFilter !== "all" && (
                <span className="uhome-filter-badge maroon">
                  {TYPE_TABS.find(t => t.id === typeFilter)?.emoji}{" "}
                  {TYPE_TABS.find(t => t.id === typeFilter)?.label}
                  <button onClick={() => setTypeFilter("all")}>×</button>
                </span>
              )}
              {cultureFilter && (
                <span className="uhome-filter-badge teal">
                  🌏 {activeCultureName}
                  <button onClick={() => setCultureFilter("")}>×</button>
                </span>
              )}
            </div>
          )}

          {loading && (
            <div className="uhome-empty">
              <div className="uhome-spinner" />
              <p>Loading feed…</p>
            </div>
          )}

          {!loading && error && (
            <div className="uhome-empty">
              <p>{error}</p>
              <button className="uhome-retry-btn" onClick={loadFeed}>Retry</button>
            </div>
          )}

          {!loading && !error && (
            <div className="uhome-feed">
              {merged.length === 0
                ? (
                  <div className="uhome-empty">
                    <img src="https://api.iconify.design/noto/fork-and-knife-with-plate.svg" alt="" width="52" height="52" />
                    <p>No posts found — try a different filter!</p>
                  </div>
                )
                : merged.map(item =>
                    item._kind === "question"
                      ? <QuestionCard key={`q-${item.question_id}`} question={item} />
                      : <PostCard key={`p-${item.post_id}`} post={item} onLikeChange={handleLikeChange} />
                  )
              }
            </div>
          )}
        </main>
      </div>
    </div>
  );
}