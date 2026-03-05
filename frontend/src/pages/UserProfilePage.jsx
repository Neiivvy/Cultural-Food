import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getProfile, updateProfile } from "../api/userService";
import { getFeed } from "../api/postService";
import { getQuestions } from "../api/questionService";
import { getAvatar } from "../utils/avatar";
import "./UserProfilePage.css";

const TABS = [
  { id: "recipes",   label: "My Recipes",  icon: "📖" },
  { id: "reels",     label: "My Reels",    icon: "▶"  },
  { id: "questions", label: "Questions",   icon: "❓" },
  { id: "answers",   label: "My Answers",  icon: "💬" },
];

export default function UserProfilePage() {
  const [user,      setUser]      = useState(null);
  const [myPosts,   setMyPosts]   = useState([]);
  const [myQs,      setMyQs]      = useState([]);
  const [activeTab, setActiveTab] = useState("recipes");
  const [editing,   setEditing]   = useState(false);
  const [editName,  setEditName]  = useState("");
  const [editBio,   setEditBio]   = useState("");
  const [picFile,   setPicFile]   = useState(null);
  const [picPreview,setPicPreview]= useState(null);
  const [saving,    setSaving]    = useState(false);
  const [loading,   setLoading]   = useState(true);

  const stored = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, feedRes, qRes] = await Promise.all([
          getProfile(stored.user_id),
          getFeed({ limit: 50 }),
          getQuestions(),
        ]);
        const u = profileRes.data.data.user;
        setUser(u);
        setEditName(u.name);
        setEditBio(u.bio || "");

        const allPosts = feedRes.data.data.posts || [];
        setMyPosts(allPosts.filter((p) => p.author_id === stored.user_id));

        const allQs = qRes.data.data.questions || [];
        setMyQs(allQs.filter((q) => q.user_id === stored.user_id));
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    load();
  }, [stored.user_id]);

  const handlePicChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPicFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPicPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", editName.trim());
      fd.append("bio",  editBio.trim());
      if (picFile) fd.append("profile_picture", picFile);

      const res = await updateProfile(stored.user_id, fd);
      const updated = res.data.data.user;
      setUser(updated);
      // Update localStorage so navbar shows new name
      localStorage.setItem("user", JSON.stringify({ ...stored, ...updated }));
      setEditing(false); setPicFile(null); setPicPreview(null);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  if (loading) return <div className="uprofile-page"><p style={{ padding: "2rem", color: "var(--text-3)" }}>Loading…</p></div>;
  if (!user)   return <div className="uprofile-page"><p style={{ padding: "2rem", color: "var(--text-3)" }}>Could not load profile.</p></div>;

  const myRecipes = myPosts.filter((p) => p.post_type === "recipe");
  const myReels   = myPosts.filter((p) => p.post_type === "reel");
  const avatarSrc = picPreview || getAvatar(user.profile_picture, user.name, 120);

  const renderTab = () => {
    switch (activeTab) {
      case "recipes":
        return <PostGrid posts={myRecipes} />;
      case "reels":
        return <PostGrid posts={myReels} />;
      case "questions":
        return (
          <div className="uprofile-qlist">
            {myQs.length === 0
              ? <p className="uprofile-empty">No questions yet.</p>
              : myQs.map((q) => (
                <div key={q.question_id} className="uprofile-qitem">
                  <h4 className="uprofile-qtitle">{q.title}</h4>
                  <div className="uprofile-qmeta">
                    <span>💬 {q.answers_count} answers</span>
                    <span className="uprofile-qdate">{new Date(q.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            }
          </div>
        );
      case "answers":
        return <p className="uprofile-empty">No answers yet.</p>;
      default:
        return null;
    }
  };

  return (
    <div className="uprofile-page">
      <div className="uprofile-container">
        {/* Header */}
        <div className="uprofile-header">
          <div className="uprofile-avatar-wrap">
            <img src={avatarSrc} alt="avatar" className="uprofile-avatar" />
            {editing && (
              <label className="uprofile-avatar-edit" title="Change photo">
                <img src="https://api.iconify.design/material-symbols/edit-outline.svg?color=%23fff" alt="edit" width="14" height="14" />
                <input type="file" accept="image/*" onChange={handlePicChange} style={{ display: "none" }} />
              </label>
            )}
          </div>

          <div className="uprofile-info">
            <div className="uprofile-name-row">
              {editing
                ? <input className="uprofile-name-input" value={editName} onChange={(e) => setEditName(e.target.value)} />
                : <h2 className="uprofile-name">{user.name}</h2>
              }
              {editing
                ? (
                  <div className="uprofile-edit-actions">
                    <button className="uprofile-save-btn" onClick={saveProfile} disabled={saving}>
                      {saving ? "Saving…" : "Save"}
                    </button>
                    <button className="uprofile-cancel-btn" onClick={() => { setEditing(false); setEditName(user.name); setEditBio(user.bio || ""); setPicPreview(null); setPicFile(null); }}>
                      Cancel
                    </button>
                  </div>
                )
                : (
                  <button className="uprofile-edit-btn" onClick={() => setEditing(true)}>
                    <img src="https://api.iconify.design/material-symbols/edit-outline.svg?color=%234b5563" alt="" width="14" height="14" />
                    Edit Profile
                  </button>
                )
              }
            </div>

            <p className="uprofile-email">
              <img src="https://api.iconify.design/material-symbols/mail-outline.svg?color=%239ca3af" alt="" width="14" height="14" />
              {user.email}
            </p>

            {editing
              ? <textarea className="uprofile-bio-edit" value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={3} placeholder="Write something about yourself…" />
              : <p className="uprofile-bio">{user.bio || "No bio yet."}</p>
            }

            <div className="uprofile-stats">
              <div className="uprofile-stat"><span className="uprofile-stat-n">{myPosts.length}</span><span className="uprofile-stat-l">Posts</span></div>
              <div className="uprofile-stat-div" />
              <div className="uprofile-stat"><span className="uprofile-stat-n">{myQs.length}</span><span className="uprofile-stat-l">Questions</span></div>
              <div className="uprofile-stat-div" />
              <div className="uprofile-stat"><span className="uprofile-stat-n">{myReels.length}</span><span className="uprofile-stat-l">Reels</span></div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="uprofile-tabs">
          {TABS.map((t) => (
            <button key={t.id} className={`uprofile-tab ${activeTab === t.id ? "active" : ""}`} onClick={() => setActiveTab(t.id)}>
              <span>{t.icon}</span><span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="uprofile-content">{renderTab()}</div>
      </div>
    </div>
  );
}

// Sub-component: post grid
function PostGrid({ posts }) {
  if (posts.length === 0) return <p className="uprofile-empty">Nothing here yet.</p>;
  return (
    <div className="uprofile-grid">
      {posts.map((p) => (
        <Link to={`/post/${p.post_id}`} key={p.post_id} className="uprofile-grid-item">
          {p.media_url
            ? <img src={p.media_url} alt={p.title} />
            : <div className="uprofile-grid-placeholder">📖</div>
          }
          <div className="uprofile-grid-overlay">
            <span>❤ {p.likes_count}</span>
            <span>💬 {p.comments_count}</span>
          </div>
          {p.post_type === "reel" && <span className="ugrid-reel">▶</span>}
        </Link>
      ))}
    </div>
  );
}