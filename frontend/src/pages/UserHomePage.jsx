import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PostCard from "../components/PostCard";
import QuestionCard from "../components/QuestionCard";
import { getFeed } from "../api/postService";
import { getQuestions } from "../api/questionService";
import { getTopUsers, getContributors, searchUsers } from "../api/userService";
import { getAvatar } from "../utils/avatar";
import useCultures from "../hooks/useCultures";
import CultureFilter from "../components/CultureFilter";
import "./UserHomePage.css";


const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

/* ── People search bar ── */
function PeopleSearch() {
  const navigate  = useNavigate();
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open,    setOpen]    = useState(false);
  const wrapRef  = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q || q.length < 2) {
      setResults([]); setOpen(false); return;
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchUsers(q);
        setResults(res.data.data.users || []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 260);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  const handleSelect = (user) => {
    setQuery(""); setResults([]); setOpen(false);
    if (user.is_public) {
      navigate(`/user/${user.user_id}`);
    } else {
      // Show private notice inline — navigate with state
      navigate(`/user/${user.user_id}`);
    }
  };

  return (
    <div className="uhome-people-search" ref={wrapRef}>
      <div className="uhome-people-search-wrap">
        <span className="uhome-people-search-icon"><SearchIcon /></span>
        <input
          className="uhome-people-search-input"
          type="text"
          placeholder="Search people…"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => results.length > 0 && setOpen(true)}
          autoComplete="off"
        />
        {loading && <span className="uhome-people-spinner" />}
        {query && !loading && (
          <button className="uhome-people-clear" onClick={() => { setQuery(""); setResults([]); setOpen(false); }}>✕</button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="uhome-people-dropdown">
          {results.map(user => (
            <button
              key={user.user_id}
              className="uhome-people-result"
              onClick={() => handleSelect(user)}
            >
              <img
                src={getAvatar(user.profile_picture, user.name, 32)}
                alt={user.name}
                className="uhome-people-av"
              />
              <div className="uhome-people-info">
                <span className="uhome-people-name">{user.name}</span>
                {!user.is_public && (
                  <span className="uhome-people-private">🔒 Private</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {open && !loading && query.trim().length >= 2 && results.length === 0 && (
        <div className="uhome-people-empty">No users found for "{query}"</div>
      )}
    </div>
  );
}

/* ── Top Users sidebar section ── */
function TopUsersSidebar() {
  const navigate = useNavigate();
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTopUsers()
      .then(res => setUsers(res.data.data.users || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="uhome-sidebar-section">
      <p className="uhome-sidebar-label">Top Members</p>
      {loading && <div className="uhome-sidebar-spinner" />}
      {!loading && !users.length && <p className="uhome-sidebar-empty">No top members yet.</p>}
      {!loading && users.length > 0 && (
        <div className="uhome-top-users">
          {users.map((u, i) => (
            <button
              key={u.user_id}
              className="uhome-top-user"
              onClick={() => navigate(`/user/${u.user_id}`)}
            >
              <span className="uhome-top-user-rank">#{i + 1}</span>
              <img
                src={getAvatar(u.profile_picture, u.name, 32)}
                alt={u.name}
                className="uhome-top-user-av"
              />
              <div className="uhome-top-user-info">
                <span className="uhome-top-user-name">{u.name}</span>
                <span className="uhome-top-user-meta">
                  {u.recipe_count}r · {u.reel_count}v · {u.question_count}q
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Contributors sidebar section ── */
function ContributorsSidebar() {
  const navigate = useNavigate();
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getContributors()
      .then(res => setItems(res.data.data.contributors || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="uhome-sidebar-section">
      <p className="uhome-sidebar-label">Contributors</p>
      {loading && <div className="uhome-sidebar-spinner" />}
      {!loading && !items.length && <p className="uhome-sidebar-empty">No contributions yet.</p>}
      {!loading && items.length > 0 && (
        <div className="uhome-contributors">
          {items.map((c, i) => (
            <button
              key={`${c.user_id}-${c.food_id}-${i}`}
              className="uhome-contributor"
              onClick={() => navigate(`/food/${c.food_id}`)}
              title={`${c.food_name} by ${c.name}`}
            >
              {c.food_image
                ? <img src={c.food_image} alt={c.food_name} className="uhome-contrib-food-img" />
                : <span className="uhome-contrib-food-placeholder">🍽</span>
              }
              <div className="uhome-contrib-info">
                <span className="uhome-contrib-food-name">{c.food_name}</span>
                <div className="uhome-contrib-user">
                  <img src={getAvatar(c.profile_picture, c.name, 16)} alt={c.name} className="uhome-contrib-av" />
                  <span className="uhome-contrib-name">{c.name}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════
   Main UserHomePage
   ════════════════════════════════════════ */
export default function UserHomePage() {
  const [posts,         setPosts]         = useState([]);
  const [questions,     setQuestions]     = useState([]);
  const [typeFilter,    setTypeFilter]    = useState("all");
  const [cultureFilter, setCultureFilter] = useState("");
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [mobileCulture, setMobileCulture] = useState(false);

  const { cultures } = useCultures();
  const currentUser  = JSON.parse(localStorage.getItem("user") || "{}");

  const loadFeed = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = { requesterId: currentUser.user_id };
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
        setPosts(postRes.data.data.posts || []); setQuestions([]);
      }
    } catch {
      setError("Failed to load posts. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [typeFilter, cultureFilter, currentUser.user_id]);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  const handleLikeChange = (postId, liked, newCount) =>
    setPosts(prev => prev.map(p =>
      p.post_id === postId ? { ...p, liked_by_me: liked, likes_count: newCount } : p
    ));

  const merged =
    typeFilter === "all"
      ? [
          ...posts.map(p => ({ ...p, _kind: "post", _score: Number(p.likes_count || 0) + Number(p.comments_count || 0) })),
          ...questions.map(q => ({ ...q, _kind: "question", _score: Number(q.answers_count || 0) })),
        ].sort((a, b) => b._score - a._score || new Date(b.created_at) - new Date(a.created_at))
      : typeFilter === "question"
      ? questions.map(q => ({ ...q, _kind: "question" }))
      : posts.map(p => ({ ...p, _kind: "post" }));

  return (
    <div className="uhome">

      {/* ── LEFT: Culture filter ── */}
      <CultureFilter
        cultures={cultures}
        cultureFilter={cultureFilter}
        setCultureFilter={setCultureFilter}
      />

      {/* ── MAIN ── */}
      <main className="uhome-main">

        {mobileCulture && (
          <>
            <div className="uhome-mob-overlay" onClick={() => setMobileCulture(false)} />
            <div className="uhome-mob-culture-drawer">
              <div className="uhome-mob-drawer-header">
                <span>Filter by Culture</span>
                <button onClick={() => setMobileCulture(false)}>✕</button>
              </div>
              <div className="uhome-mob-culture-list">
                <button className={`uhome-mob-chip ${!cultureFilter ? "active" : ""}`}
                  onClick={() => { setCultureFilter(""); setMobileCulture(false); }}>
                  All Cultures
                </button>
                {cultures.map(c => (
                  <button key={c.culture_id}
                    className={`uhome-mob-chip ${cultureFilter === String(c.culture_id) ? "active" : ""}`}
                    onClick={() => { setCultureFilter(prev => prev === String(c.culture_id) ? "" : String(c.culture_id)); setMobileCulture(false); }}>
                    {c.culture_name}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="uhome-feed-area">
          <div className="uhome-feed-header">
            <div className="uhome-feed-header-text">
              <h1 className="uhome-header-title">Community Feed</h1>
              <p className="uhome-header-sub">Recipes, reels and questions from Nepal's food communities</p>
            </div>
            <div className="uhome-feed-header-actions">
              <button className="uhome-culture-toggle" onClick={() => setMobileCulture(true)}>
                🌏 Culture{cultureFilter && <span className="uhome-culture-dot" />}
              </button>
            </div>
          </div>

          {/* Type tabs */}
          <div className="uhome-type-tabs">
            {[
              { id: "all",      label: "All"       },
              { id: "recipe",   label: "Recipes"   },
              { id: "reel",     label: "Reels"     },
              { id: "question", label: "Questions" },
            ].map(f => (
              <button key={f.id}
                className={`uhome-type-tab ${typeFilter === f.id ? "active" : ""}`}
                onClick={() => setTypeFilter(f.id)}>
                {f.label}
              </button>
            ))}
          </div>

          {loading && <div className="uhome-state"><div className="uhome-spinner" /></div>}
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

      {/* ── RIGHT sidebar ── */}
      <aside className="uhome-right-sidebar">
        {/* People search — top of sidebar */}
        <div className="uhome-sidebar-section uhome-sidebar-section--search">
          <p className="uhome-sidebar-label">Find People</p>
          <PeopleSearch />
        </div>

        <TopUsersSidebar />
        <ContributorsSidebar />
      </aside>
    </div>
  );
}