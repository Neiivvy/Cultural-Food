import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile }                    from "../api/userService";
import { getFeed }                       from "../api/postService";
import { getQuestions }                  from "../api/questionService";
import { getAvatar }                     from "../utils/avatar";
import { getMyContributions }            from "../api/contributionService";
import PostCard                          from "../components/PostCard";
import "./UserProfilePage.css";

const TABS = [
  { id: "recipes",       label: "My Recipes",      icon: "📖" },
  { id: "reels",         label: "My Reels",         icon: "▶"  },
  { id: "questions",     label: "My Questions",     icon: "❓" },
  { id: "answers",       label: "My Answers",       icon: "💬" },
  { id: "contributions", label: "My Contributions", icon: "🍽"  },
];

export default function UserProfilePage() {
  const navigate = useNavigate();
  const [user,          setUser]          = useState(null);
  const [myPosts,       setMyPosts]       = useState([]);
  const [myQs,          setMyQs]          = useState([]);
  const [myAnswers,     setMyAnswers]     = useState([]);
  const [contributions, setContributions] = useState([]);
  const [activeTab,     setActiveTab]     = useState("recipes");
  const [loading,       setLoading]       = useState(true);

  const stored = JSON.parse(localStorage.getItem("user") || "{}");

  // Listen for profile updates from the UserNavBar's Manage Profile overlay
  useEffect(() => {
    const handler = (e) => {
      const updated = e.detail || JSON.parse(localStorage.getItem("user") || "{}");
      setUser(prev => prev ? { ...prev, ...updated } : updated);
    };
    window.addEventListener("profile-updated", handler);
    return () => window.removeEventListener("profile-updated", handler);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, myPostsRes, allQsRes] = await Promise.all([
          getProfile(stored.user_id),
          getFeed({ user_id: stored.user_id, limit: 100 }),
          getQuestions(),
        ]);

        const u = profileRes.data.data.user;
        setUser(u);
        setMyPosts(myPostsRes.data.data.posts || []);

        const allQs = allQsRes.data.data.questions || [];
        setMyQs(allQs.filter(q => Number(q.user_id) === Number(stored.user_id)));

        const answers = [];
        allQs.forEach(q => {
          (q.answers || []).forEach(a => {
            if (Number(a.user_id) === Number(stored.user_id)) {
              answers.push({ ...a, questionTitle: q.title, questionId: q.question_id });
            }
          });
        });
        setMyAnswers(answers.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      } catch (e) {
        console.error("Profile load error:", e);
      } finally {
        setLoading(false);
      }
    };
    load();

    getMyContributions()
      .then(r => setContributions(r.data.data?.contributions || []))
      .catch(() => {});
  }, [stored.user_id]);

  if (loading) return <div className="uprofile-page"><p className="uprofile-loading">Loading…</p></div>;
  if (!user)   return <div className="uprofile-page"><p className="uprofile-loading">Could not load profile.</p></div>;

  const myRecipes = myPosts.filter(p => p.post_type === "recipe");
  const myReels   = myPosts.filter(p => p.post_type === "reel");
  const avatarSrc = getAvatar(user.profile_picture, user.name, 120);

  const renderTab = () => {
    switch (activeTab) {
      case "recipes":
        return myRecipes.length === 0
          ? <p className="uprofile-empty">No recipes posted yet.</p>
          : <div className="uprofile-feed">{myRecipes.map(p => <PostCard key={p.post_id} post={p} />)}</div>;

      case "reels":
        return myReels.length === 0
          ? <p className="uprofile-empty">No reels posted yet.</p>
          : <div className="uprofile-feed">{myReels.map(p => <PostCard key={p.post_id} post={p} />)}</div>;

      case "questions":
        return myQs.length === 0
          ? <p className="uprofile-empty">No questions posted yet.</p>
          : (
            <div className="uprofile-qlist">
              {myQs.map(q => (
                <div key={q.question_id} className="uprofile-qitem" onClick={() => navigate("/questions")}>
                  <h4 className="uprofile-qtitle">{q.title}</h4>
                  {q.description && <p className="uprofile-qdesc">{q.description}</p>}
                  <div className="uprofile-qmeta">
                    {q.culture_name && <span className="uprofile-culture-chip">{q.culture_name}</span>}
                    <span>💬 {(q.answers || []).length} answers</span>
                    <span className="uprofile-qdate">{new Date(q.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          );

      case "answers":
        return myAnswers.length === 0
          ? <p className="uprofile-empty">No answers yet.</p>
          : (
            <div className="uprofile-qlist">
              {myAnswers.map(a => (
                <div key={a.answer_id} className="uprofile-qitem" onClick={() => navigate("/questions")}>
                  <p className="uprofile-ans-q">Re: <em>{a.questionTitle}</em></p>
                  <p className="uprofile-ans-text">{a.answer_text}</p>
                  <span className="uprofile-qdate">{new Date(a.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          );

      case "contributions":
        return (
          <div className="uprof-contributions">
            {contributions.length === 0 ? (
              <div className="uprofile-empty">
                <p>You haven't submitted any food contributions yet.</p>
                <a href="/contribute" className="uprof-contrib-link">Contribute a food →</a>
              </div>
            ) : (
              contributions.map(c => (
                <div key={c.contribution_id} className={`uprof-contrib-card uprof-contrib-${c.status}`}>
                  {c.image_url && (
                    <img src={c.image_url} alt={c.food_name} className="uprof-contrib-img" />
                  )}
                  <div className="uprof-contrib-body">
                    <div className="uprof-contrib-name">
                      {c.food_name}
                      {c.food_name_nepali && <span className="uprof-contrib-nepali"> · {c.food_name_nepali}</span>}
                    </div>
                    <div className="uprof-contrib-meta">
                      {c.culture_name && <span className="uprof-contrib-chip">{c.culture_name}</span>}
                      <span className={`uprof-contrib-status uprof-status-${c.status}`}>
                        {c.status === "pending"  && "⏳ Pending Review"}
                        {c.status === "approved" && "✓ Approved & Live"}
                        {c.status === "rejected" && "✕ Not Approved"}
                      </span>
                    </div>
                    {c.admin_message && (
                      <div className={`uprof-contrib-msg uprof-msg-${c.status}`}>
                        <span className="uprof-contrib-msg-label">
                          {c.status === "approved" ? "✓ Admin:" : "⚠ Reason:"}
                        </span>{" "}{c.admin_message}
                      </div>
                    )}
                    <div className="uprof-contrib-date">
                      Submitted{" "}
                      {new Date(c.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      {c.reviewed_at && (
                        <> · Reviewed{" "}
                          {new Date(c.reviewed_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="uprofile-page">
      <div className="uprofile-container">

        {/* Profile header — no edit button here; editing is via navbar Manage Profile */}
        <div className="uprofile-header">
          <div className="uprofile-avatar-wrap">
            <img src={avatarSrc} alt="avatar" className="uprofile-avatar" />
          </div>

          <div className="uprofile-info">
            <div className="uprofile-name-row">
              <h2 className="uprofile-name">{user.name}</h2>
            </div>

            <p className="uprofile-email">{user.email}</p>
            <p className="uprofile-bio">{user.bio || "No bio yet."}</p>

            <div className="uprofile-stats">
              <div className="uprofile-stat">
                <span className="uprofile-stat-n">{myPosts.length}</span>
                <span className="uprofile-stat-l">Posts</span>
              </div>
              <div className="uprofile-stat-div" />
              <div className="uprofile-stat">
                <span className="uprofile-stat-n">{myQs.length}</span>
                <span className="uprofile-stat-l">Questions</span>
              </div>
              <div className="uprofile-stat-div" />
              <div className="uprofile-stat">
                <span className="uprofile-stat-n">{myAnswers.length}</span>
                <span className="uprofile-stat-l">Answers</span>
              </div>
              <div className="uprofile-stat-div" />
              <div className="uprofile-stat">
                <span className="uprofile-stat-n">{contributions.length}</span>
                <span className="uprofile-stat-l">Contributions</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="uprofile-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`uprofile-tab ${activeTab === t.id ? "active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="uprofile-content">{renderTab()}</div>
      </div>
    </div>
  );
}