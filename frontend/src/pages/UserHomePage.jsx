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

  const { cultures } = useCultures();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const loadFeed = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = {};
      if (typeFilter === "recipe" || typeFilter === "reel") params.type = typeFilter;
      if (cultureFilter) params.culture_id = cultureFilter;

      if (typeFilter === "question") {
        // Only fetch questions
        const qRes = await getQuestions();
        let qs = qRes.data.data.questions || [];
        if (cultureFilter) qs = qs.filter(q => String(q.culture_id) === cultureFilter);
        setQuestions(qs);
        setPosts([]);
      } else if (typeFilter === "all") {
        // Fetch posts + questions in parallel, merge by date
        const [postRes, qRes] = await Promise.all([getFeed(params), getQuestions()]);
        let qs = qRes.data.data.questions || [];
        if (cultureFilter) qs = qs.filter(q => String(q.culture_id) === cultureFilter);
        setPosts(postRes.data.data.posts || []);
        setQuestions(qs);
      } else {
        // recipe or reel only
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

  // Merge posts + questions sorted by date for "all" tab
  const merged = typeFilter === "all"
    ? [...posts.map(p => ({ ...p, _kind: "post" })),
       ...questions.map(q => ({ ...q, _kind: "question", created_at: q.created_at }))]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    : typeFilter === "question"
      ? questions.map(q => ({ ...q, _kind: "question" }))
      : posts.map(p => ({ ...p, _kind: "post" }));

  const total = merged.length;

  return (
    <div className="uhome">
      <div className="uhome-hero">
        <div className="uhome-hero-inner">
          <div className="uhome-greeting">
            <img src="https://api.iconify.design/noto/waving-hand.svg" alt="" width="28" height="28" className="uhome-wave" />
            <span>Welcome back, <strong>{user.name?.split(" ")[0] || "Friend"}</strong>!</span>
          </div>
          <h1 className="uhome-title">What's <span>cooking</span> today?</h1>
          <p className="uhome-sub">Discover recipes, reels, and cultural stories from across Nepal.</p>
        </div>
      </div>

      <div className="uhome-content">
        {/* Type tabs */}
        <div className="uhome-filters">
          <div className="uhome-type-tabs">
            {TYPE_TABS.map(f => (
              <button
                key={f.id}
                className={`uhome-tab ${typeFilter === f.id ? "active" : ""}`}
                onClick={() => setTypeFilter(f.id)}
              >
                <span>{f.emoji}</span> {f.label}
              </button>
            ))}
          </div>
          <select
            className="uhome-culture-select"
            value={cultureFilter}
            onChange={e => setCultureFilter(e.target.value)}
          >
            <option value="">All Cultures</option>
            {cultures.map(c => (
              <option key={c.culture_id} value={c.culture_id}>{c.culture_name}</option>
            ))}
          </select>
        </div>

        {/* Culture chips */}
        <div className="uhome-chips">
          <button className={`uhome-chip ${!cultureFilter ? "active" : ""}`} onClick={() => setCultureFilter("")}>All</button>
          {cultures.map(c => (
            <button
              key={c.culture_id}
              className={`uhome-chip ${cultureFilter === String(c.culture_id) ? "active" : ""}`}
              onClick={() => setCultureFilter(String(c.culture_id))}
            >
              {c.culture_name}
            </button>
          ))}
        </div>

        {!loading && !error && (
          <p className="uhome-count">{total} {total === 1 ? "post" : "posts"}</p>
        )}

        {loading && <div className="uhome-empty"><p>Loading…</p></div>}
        {!loading && error && (
          <div className="uhome-empty">
            <p>{error}</p>
            <button className="uhome-retry-btn" onClick={loadFeed}>Retry</button>
          </div>
        )}

        {!loading && !error && (
          <div className="uhome-feed">
            {merged.length === 0
              ? <div className="uhome-empty">
                  <img src="https://api.iconify.design/noto/fork-and-knife-with-plate.svg" alt="" width="48" height="48" />
                  <p>No posts found — try a different filter!</p>
                </div>
              : merged.map(item =>
                  item._kind === "question"
                    ? <QuestionCard key={`q-${item.question_id}`} question={item} />
                    : <PostCard key={`p-${item.post_id}`} post={item} onLikeChange={handleLikeChange} />
                )
            }
          </div>
        )}
      </div>
    </div>
  );
}