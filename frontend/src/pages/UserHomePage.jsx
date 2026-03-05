import React, { useState, useEffect, useCallback } from "react";
import PostCard from "../components/PostCard";
import { getFeed } from "../api/postService";
import useCultures from "../hooks/useCultures";
import "./UserHomePage.css";

export default function UserHomePage() {
  const [posts,         setPosts]         = useState([]);
  const [typeFilter,    setTypeFilter]    = useState("all");
  const [cultureFilter, setCultureFilter] = useState("");
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");

  const { cultures } = useCultures();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (typeFilter    !== "all") params.type       = typeFilter;
      if (cultureFilter)           params.culture_id = cultureFilter;

      const res = await getFeed(params);
      setPosts(res.data.data.posts || []);
    } catch {
      setError("Failed to load posts. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [typeFilter, cultureFilter]);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  const handleLikeChange = (postId, liked, newCount) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.post_id === postId
          ? { ...p, liked_by_me: liked, likes_count: newCount }
          : p
      )
    );
  };

  return (
    <div className="uhome">
      {/* Hero */}
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
        {/* Filters */}
        <div className="uhome-filters">
          <div className="uhome-type-tabs">
            {[
              { id: "all",    label: "All Posts", emoji: "🍽" },
              { id: "recipe", label: "Recipes",   emoji: "📖" },
              { id: "reel",   label: "Reels",     emoji: "▶"  },
            ].map((f) => (
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
            onChange={(e) => setCultureFilter(e.target.value)}
          >
            <option value="">All Cultures</option>
            {cultures.map((c) => (
              <option key={c.culture_id} value={c.culture_id}>
                {c.culture_name}
              </option>
            ))}
          </select>
        </div>

        {/* Culture chips */}
        <div className="uhome-chips">
          <button
            className={`uhome-chip ${!cultureFilter ? "active" : ""}`}
            onClick={() => setCultureFilter("")}
          >
            All
          </button>
          {cultures.map((c) => (
            <button
              key={c.culture_id}
              className={`uhome-chip ${cultureFilter === String(c.culture_id) ? "active" : ""}`}
              onClick={() => setCultureFilter(String(c.culture_id))}
            >
              {c.culture_name}
            </button>
          ))}
        </div>

        {/* Feed */}
        {loading && (
          <div className="uhome-empty">
            <p>Loading posts…</p>
          </div>
        )}
        {!loading && error && (
          <div className="uhome-empty">
            <p>{error}</p>
            <button className="uhome-retry" onClick={loadFeed}>Retry</button>
          </div>
        )}
        {!loading && !error && (
          <div className="uhome-feed">
            {posts.length === 0
              ? (
                <div className="uhome-empty">
                  <img src="https://api.iconify.design/noto/fork-and-knife-with-plate.svg" alt="" width="48" height="48" />
                  <p>No posts found — try a different filter!</p>
                </div>
              )
              : posts.map((post) => (
                <PostCard key={post.post_id} post={post} onLikeChange={handleLikeChange} />
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
}