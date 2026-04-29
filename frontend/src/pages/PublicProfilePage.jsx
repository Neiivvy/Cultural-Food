import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPublicProfile } from "../api/userService";
import { getFeed }          from "../api/postService";
import { getQuestions }     from "../api/questionService";
import { getAvatar }        from "../utils/avatar";
import PostCard             from "../components/PostCard";
import "./PublicProfilePage.css";

const TABS = [
  { id: "recipes",   label: "Recipes",   icon: "📖" },
  { id: "reels",     label: "Reels",     icon: "▶"  },
  { id: "questions", label: "Questions", icon: "❓" },
];

export default function PublicProfilePage() {
  const { userId }  = useParams();
  const navigate    = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  // Redirect to own profile page if viewing self
  useEffect(() => {
    if (String(currentUser.user_id) === String(userId)) {
      navigate("/profile", { replace: true });
    }
  }, [userId, currentUser.user_id, navigate]);

  const [user,      setUser]      = useState(null);
  const [posts,     setPosts]     = useState([]);
  const [questions, setQuestions] = useState([]);
  const [activeTab, setActiveTab] = useState("recipes");
  const [loading,   setLoading]   = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [notFound,  setNotFound]  = useState(false);

  useEffect(() => {
    if (String(currentUser.user_id) === String(userId)) return;

    const load = async () => {
      setLoading(true);
      try {
        const profileRes = await getPublicProfile(userId);
        const u = profileRes.data.data.user;
        setUser(u);

        // Load their posts and questions in parallel
        const [postsRes, qRes] = await Promise.all([
          getFeed({ user_id: userId, limit: 50 }),
          getQuestions(),
        ]);
        setPosts(postsRes.data.data.posts || []);
        const allQs = qRes.data.data.questions || [];
        setQuestions(allQs.filter(q => String(q.user_id) === String(userId)));
      } catch (err) {
        if (err.response?.status === 403) setForbidden(true);
        else if (err.response?.status === 404) setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userId, currentUser.user_id]);

  if (loading) return (
    <div className="pub-profile">
      <div className="pub-profile-state">
        <div className="pub-profile-spinner" />
      </div>
    </div>
  );

  if (notFound) return (
    <div className="pub-profile">
      <div className="pub-profile-state">
        <span className="pub-profile-state-icon">🔍</span>
        <p className="pub-profile-state-msg">User not found.</p>
        <button className="pub-profile-back" onClick={() => navigate(-1)}>Go back</button>
      </div>
    </div>
  );

  if (forbidden) return (
    <div className="pub-profile">
      <div className="pub-profile-state">
        <span className="pub-profile-state-icon">🔒</span>
        <p className="pub-profile-state-title">Private Profile</p>
        <p className="pub-profile-state-msg">This user has set their profile to private.</p>
        <button className="pub-profile-back" onClick={() => navigate(-1)}>Go back</button>
      </div>
    </div>
  );

  if (!user) return null;

  const myRecipes   = posts.filter(p => p.post_type === "recipe");
  const myReels     = posts.filter(p => p.post_type === "reel");
  const avatarSrc   = getAvatar(user.profile_picture, user.name, 100);

  const renderTab = () => {
    if (activeTab === "recipes") {
      return myRecipes.length === 0
        ? <p className="pub-profile-empty">No recipes posted yet.</p>
        : <div className="pub-profile-feed">{myRecipes.map(p => <PostCard key={p.post_id} post={p} />)}</div>;
    }
    if (activeTab === "reels") {
      return myReels.length === 0
        ? <p className="pub-profile-empty">No reels posted yet.</p>
        : <div className="pub-profile-feed">{myReels.map(p => <PostCard key={p.post_id} post={p} />)}</div>;
    }
    if (activeTab === "questions") {
      return questions.length === 0
        ? <p className="pub-profile-empty">No questions posted yet.</p>
        : (
          <div className="pub-profile-qlist">
            {questions.map(q => (
              <div key={q.question_id} className="pub-profile-qitem">
                <h4 className="pub-profile-qtitle">{q.title}</h4>
                {q.description && <p className="pub-profile-qdesc">{q.description}</p>}
                <div className="pub-profile-qmeta">
                  {q.culture_name && <span className="pub-profile-culture-chip">{q.culture_name}</span>}
                  <span>💬 {(q.answers || []).length} answers</span>
                  <span className="pub-profile-qdate">
                    {new Date(q.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        );
    }
    return null;
  };

  return (
    <div className="pub-profile">
      <div className="pub-profile-container">

        {/* Back button */}
        <button className="pub-profile-back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>

        {/* Header */}
        <div className="pub-profile-header">
          <img src={avatarSrc} alt={user.name} className="pub-profile-avatar" />
          <div className="pub-profile-info">
            <h2 className="pub-profile-name">{user.name}</h2>
            <p className="pub-profile-bio">{user.bio || "No bio yet."}</p>
            <div className="pub-profile-stats">
              <div className="pub-profile-stat">
                <span className="pub-profile-stat-n">{posts.length}</span>
                <span className="pub-profile-stat-l">Posts</span>
              </div>
              <div className="pub-profile-stat-div" />
              <div className="pub-profile-stat">
                <span className="pub-profile-stat-n">{questions.length}</span>
                <span className="pub-profile-stat-l">Questions</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="pub-profile-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`pub-profile-tab ${activeTab === t.id ? "active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="pub-profile-content">{renderTab()}</div>
      </div>
    </div>
  );
}