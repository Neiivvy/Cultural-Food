import React, { useState, useEffect, useCallback } from "react";
import PostCard from "../components/PostCard";
import { getFeed } from "../api/postService";
import useCultures from "../hooks/useCultures";
import CultureFilter from "../components/CultureFilter";
import "./RecipesPage.css";

export default function RecipesPage() {
  const [posts,         setPosts]         = useState([]);
  const [typeFilter,    setTypeFilter]    = useState("all");
  const [cultureFilter, setCultureFilter] = useState("");
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [mobileCulture, setMobileCulture] = useState(false);
  const { cultures } = useCultures();

const load = useCallback(async () => {
  setLoading(true); setError("");
  try {
    const params = {};
    if (typeFilter === "all") {
      params.types = "recipe,reel";
    } else {
      params.type = typeFilter;
    }
    if (cultureFilter) params.culture_id = cultureFilter;

    console.log("PARAMS SENT:", params);
    const res = await getFeed(params);
    console.log("RAW API RESPONSE:", res.data.data.posts?.map(p => ({
      id: p.post_id, type: p.post_type, likes: p.likes_count, comments: p.comments_count
    })));
    setPosts(res.data.data.posts || []);
  } catch {
    setError("Could not load posts.");
  } finally {
    setLoading(false);
  }
}, [typeFilter, cultureFilter]);

  useEffect(() => { load(); }, [load]);

  const handleLikeChange = (postId, liked, count) =>
    setPosts(prev => prev.map(p =>
      p.post_id === postId ? { ...p, liked_by_me: liked, likes_count: count } : p
    ));

  return (
    <div className="rpage">

      {/* LEFT: Culture filter sidebar */}
      <CultureFilter
        cultures={cultures}
        cultureFilter={cultureFilter}
        setCultureFilter={setCultureFilter}
      />

      {/* FIXED type-tab pill — top-right corner, always visible on scroll */}
      <div className="rpage-fixed-tabs">
        {[
          { id: "all",    label: "All"     },
          { id: "recipe", label: "Recipes" },
          { id: "reel",   label: "Reels"   },
        ].map(f => (
          <button
            key={f.id}
            className={`rpage-tab ${typeFilter === f.id ? "active" : ""}`}
            onClick={() => setTypeFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* MAIN */}
      <main className="rpage-main">
        <div className="rpage-feed-area">

          {/* Static header — scrolls with page */}
          <div className="rpage-feed-header">
            <div className="rpage-feed-header-left">
              <button
                className="rpage-culture-toggle"
                onClick={() => setMobileCulture(true)}
              >
                🌏 Culture
                {cultureFilter && <span className="rpage-culture-dot" />}
              </button>
            </div>
            <div className="rpage-feed-header-text">
              <h1 className="rpage-header-title">Recipes &amp; Reels</h1>
              <p className="rpage-header-sub">Traditional dishes and cooking videos from across Nepal</p>
            </div>
          </div>

          {/* Mobile culture drawer */}
          {mobileCulture && (
            <>
              <div className="rpage-mob-overlay" onClick={() => setMobileCulture(false)} />
              <div className="rpage-mob-drawer">
                <div className="rpage-mob-drawer-header">
                  <span>Filter by Culture</span>
                  <button onClick={() => setMobileCulture(false)}>✕</button>
                </div>
                <div className="rpage-mob-culture-list">
                  <button
                    className={`rpage-mob-chip ${!cultureFilter ? "active" : ""}`}
                    onClick={() => { setCultureFilter(""); setMobileCulture(false); }}
                  >All Cultures</button>
                  {cultures.map(c => (
                    <button
                      key={c.culture_id}
                      className={`rpage-mob-chip ${cultureFilter === String(c.culture_id) ? "active" : ""}`}
                      onClick={() => { setCultureFilter(String(c.culture_id)); setMobileCulture(false); }}
                    >{c.culture_name}</button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Feed */}
          {loading && <div className="rpage-state"><div className="rpage-spinner" /></div>}
          {!loading && error && (
            <div className="rpage-state">
              <p className="rpage-state-msg">{error}</p>
              <button className="rpage-retry" onClick={load}>Try again</button>
            </div>
          )}
          {!loading && !error && posts.length === 0 && (
            <div className="rpage-state">
              <span className="rpage-state-icon">🍽</span>
              <p className="rpage-state-msg">No posts found for this filter.</p>
            </div>
          )}
          {!loading && !error && posts.length > 0 && (
            <div className="rpage-feed">
              {posts.map(p => (
                <PostCard key={p.post_id} post={p} onLikeChange={handleLikeChange} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}