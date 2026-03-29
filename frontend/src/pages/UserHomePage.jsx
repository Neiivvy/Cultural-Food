import React, { useState, useEffect, useCallback } from "react";
import PostCard from "../components/PostCard";
import QuestionCard from "../components/QuestionCard";
import { getFeed } from "../api/postService";
import { getQuestions } from "../api/questionService";
import useCultures from "../hooks/useCultures";
import "./UserHomePage.css";

const TYPE_TABS = [
  { id: "all",      label: "All",       emoji: "🍽️" },
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
  const [mobileSidebar, setMobileSidebar] = useState(false);

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
        setQuestions(qs); setPosts([]);
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
       ...questions.map(q => ({ ...q, _kind: "question" }))]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    : typeFilter === "question"
      ? questions.map(q => ({ ...q, _kind: "question" }))
      : posts.map(p => ({ ...p, _kind: "post" }));

  const activeCultureName = cultures.find(c => String(c.culture_id) === cultureFilter)?.culture_name;
  const total = merged.length;

  return (
    <div className="uhome">

      {/* ── Culture tag strip (below UserNavBar) ── */}
      <div className="uhome-culture-strip">
        <div className="uhome-culture-strip-inner">
          <span className="uhome-culture-strip-label">Culture:</span>
          <div className="uhome-culture-chips">
            <button
              className={`uhome-culture-chip ${!cultureFilter ? "active" : ""}`}
              onClick={() => setCultureFilter("")}
            >
              🌏 All
            </button>
            {cultures.map(c => (
              <button
                key={c.culture_id}
                className={`uhome-culture-chip ${cultureFilter === String(c.culture_id) ? "active" : ""}`}
                onClick={() => setCultureFilter(prev => prev === String(c.culture_id) ? "" : String(c.culture_id))}
              >
                {c.culture_name}
              </button>
            ))}
          </div>
          {/* Mobile: toggle type panel */}
          <button
            className="uhome-mob-filter-btn"
            onClick={() => setMobileSidebar(o => !o)}
            aria-label="Toggle feed type"
          >
            {TYPE_TABS.find(t => t.id === typeFilter)?.emoji} Filter
            {typeFilter !== "all" && <span className="uhome-mob-dot" />}
          </button>
        </div>
      </div>

      {/* ── Body: left aside + main feed ── */}
      <div className="uhome-body">

        {/* ── Left aside: type tabs + stats ── */}
        {mobileSidebar && (
          <div className="uhome-mob-overlay" onClick={() => setMobileSidebar(false)} />
        )}

        <aside className={`uhome-aside ${mobileSidebar ? "open" : ""}`}>

          {/* Welcome */}
          <div className="uhome-aside-welcome">
            <span className="uhome-wave">👋</span>
            <div>
              <p className="uhome-welcome-name">
                Welcome, <strong>{user.name?.split(" ")[0] || "Friend"}</strong>
              </p>
              <p className="uhome-welcome-sub">
                What's <em>cooking</em>?
              </p>
            </div>
          </div>

          <div className="uhome-aside-divider" />

          {/* Type navigation */}
          <p className="uhome-aside-heading">Browse Feed</p>
          <nav className="uhome-type-nav">
            {TYPE_TABS.map(f => (
              <button
                key={f.id}
                className={`uhome-type-btn ${typeFilter === f.id ? "active" : ""}`}
                onClick={() => { setTypeFilter(f.id); setMobileSidebar(false); }}
              >
                <span className="uhome-type-emoji">{f.emoji}</span>
                <span className="uhome-type-label">{f.label}</span>
                {typeFilter === f.id && <span className="uhome-type-indicator" />}
              </button>
            ))}
          </nav>

          <div className="uhome-aside-divider" />

          {/* Stats card */}
          <p className="uhome-aside-heading">📊 Feed</p>
          <div className="uhome-stat-card">
            <span className="uhome-stat-num">{total}</span>
            <span className="uhome-stat-label">
              {total === 1 ? "post" : "posts"}{activeCultureName ? ` · ${activeCultureName}` : ""}
            </span>
          </div>
        </aside>

        {/* ── Main feed ── */}
        <main className="uhome-main">

          {/* Active filter badges */}
          {(cultureFilter || typeFilter !== "all") && (
            <div className="uhome-active-filters">
              {typeFilter !== "all" && (
                <span className="uhome-filter-badge uhome-filter-badge--maroon">
                  {TYPE_TABS.find(t => t.id === typeFilter)?.emoji}{" "}
                  {TYPE_TABS.find(t => t.id === typeFilter)?.label}
                  <button onClick={() => setTypeFilter("all")}>×</button>
                </span>
              )}
              {cultureFilter && (
                <span className="uhome-filter-badge uhome-filter-badge--teal">
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