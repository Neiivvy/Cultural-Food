import React, { useState, useEffect, useCallback } from "react";
import PostCard from "../components/PostCard";
import { getFeed } from "../api/postService";
import useCultures from "../hooks/useCultures";
import "./RecipesPage.css";

export default function RecipesPage() {
  const [posts,         setPosts]         = useState([]);
  const [typeFilter,    setTypeFilter]    = useState("all");
  const [cultureFilter, setCultureFilter] = useState("");
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const { cultures }                      = useCultures();

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = {};
      if (typeFilter !== "all") params.type       = typeFilter;
      if (cultureFilter)        params.culture_id = cultureFilter;
      const res = await getFeed(params);
      setPosts(res.data.data.posts || []);
    } catch {
      setError("Could not load posts.");
    } finally {
      setLoading(false);
    }
  }, [typeFilter, cultureFilter]);

  useEffect(() => { load(); }, [load]);

  const handleLikeChange = (postId, liked, count) => {
    setPosts((prev) =>
      prev.map((p) => p.post_id === postId ? { ...p, liked_by_me: liked, likes_count: count } : p)
    );
  };

  return (
    <div className="rpage">
      <div className="rpage-container">
        <div className="rpage-header">
          <div>
            <h2 className="rpage-title">
              <img src="https://api.iconify.design/noto/fork-and-knife-with-plate.svg" alt="" width="28" height="28" />
              Recipes &amp; Reels
            </h2>
            <p className="rpage-sub">Traditional dishes and cooking videos from across Nepal</p>
          </div>
        </div>

        <div className="rpage-filters">
          <div className="rpage-type-tabs">
            {[
              { id: "all",    label: "All",     emoji: "🍽" },
              { id: "recipe", label: "Recipes", emoji: "📖" },
              { id: "reel",   label: "Reels",   emoji: "▶"  },
            ].map((f) => (
              <button
                key={f.id}
                className={`rpage-tab ${typeFilter === f.id ? "active" : ""}`}
                onClick={() => setTypeFilter(f.id)}
              >
                {f.emoji} {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rpage-chips">
          <button className={`rpage-chip ${!cultureFilter ? "active" : ""}`} onClick={() => setCultureFilter("")}>
            All Cultures
          </button>
          {cultures.map((c) => (
            <button
              key={c.culture_id}
              className={`rpage-chip ${cultureFilter === String(c.culture_id) ? "active" : ""}`}
              onClick={() => setCultureFilter(String(c.culture_id))}
            >
              {c.culture_name}
            </button>
          ))}
        </div>

        {!loading && <p className="rpage-count">{posts.length} post{posts.length !== 1 ? "s" : ""} found</p>}

        {loading && <div className="rpage-empty"><p>Loading…</p></div>}
        {!loading && error && <div className="rpage-empty"><p>{error}</p></div>}
        {!loading && !error && (
          <div className="rpage-feed">
            {posts.length === 0
              ? <div className="rpage-empty">
                  <img src="https://api.iconify.design/noto/fork-and-knife-with-plate.svg" alt="" width="40" height="40" />
                  <p>No posts found for this filter.</p>
                </div>
              : posts.map((p) => <PostCard key={p.post_id} post={p} onLikeChange={handleLikeChange} />)
            }
          </div>
        )}
      </div>
    </div>
  );
}