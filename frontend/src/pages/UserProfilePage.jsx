import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getProfile, updateProfile }    from "../api/userService";
import { getFeed }                       from "../api/postService";
import { getQuestions }                  from "../api/questionService";
import { getNotifications, markAllRead } from "../api/notificationService";
import { getAvatar }                     from "../utils/avatar";
import { getMyContributions }            from "../api/contributionService";
import "./UserProfilePage.css";

const TABS = [
  { id: "recipes",       label: "My Recipes",       icon: "📖" },
  { id: "reels",         label: "My Reels",          icon: "▶"  },
  { id: "questions",     label: "My Questions",      icon: "❓" },
  { id: "answers",       label: "My Answers",        icon: "💬" },
  { id: "contributions", label: "My Contributions",  icon: "🍽"  },
  { id: "notifications", label: "Notifications",     icon: "🔔" },
];

const NOTIF_ICONS = {
  like:                     "❤️",
  comment:                  "💬",
  answer:                   "💡",
  contribution_approved:    "✓",
  contribution_rejected:    "✕",
};

export default function UserProfilePage() {
  const navigate = useNavigate();
  const [user,          setUser]          = useState(null);
  const [myPosts,       setMyPosts]       = useState([]);
  const [myQs,          setMyQs]          = useState([]);
  const [myAnswers,     setMyAnswers]     = useState([]);
  const [notifs,        setNotifs]        = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [contributions, setContributions] = useState([]);
  const [activeTab,     setActiveTab]     = useState("recipes");
  const [editing,       setEditing]       = useState(false);
  const [editName,      setEditName]      = useState("");
  const [editBio,       setEditBio]       = useState("");
  const [picFile,       setPicFile]       = useState(null);
  const [picPreview,    setPicPreview]    = useState(null);
  const [saving,        setSaving]        = useState(false);
  const [loading,       setLoading]       = useState(true);

  const stored = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, myPostsRes, allQsRes, notifRes] = await Promise.all([
          getProfile(stored.user_id),
          getFeed({ user_id: stored.user_id, limit: 100 }),
          getQuestions(),
          getNotifications(),
        ]);

        const u = profileRes.data.data.user;
        setUser(u);
        setEditName(u.name);
        setEditBio(u.bio || "");

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

        setNotifs(notifRes.data.data.notifications || []);
        setUnreadCount(notifRes.data.data.unreadCount || 0);
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

  const handlePicChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPicFile(file);
    const reader = new FileReader();
    reader.onload = ev => setPicPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", editName.trim());
      fd.append("bio",  editBio.trim());
      if (picFile) fd.append("profile_picture", picFile);
      const res     = await updateProfile(stored.user_id, fd);
      const updated = res.data.data.user;
      setUser(updated);
      const merged = { ...stored, ...updated };
      localStorage.setItem("user", JSON.stringify(merged));
      window.dispatchEvent(new CustomEvent('profile-updated', { detail: merged }));
      setEditing(false); setPicFile(null); setPicPreview(null);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const openNotifications = async () => {
    setActiveTab("notifications");
    if (unreadCount > 0) {
      try {
        await markAllRead();
        setUnreadCount(0);
        setNotifs(prev => prev.map(n => ({ ...n, is_read: 1 })));
        window.dispatchEvent(new Event('notif-cleared'));
      } catch { /* ignore */ }
    }
  };

  if (loading) return <div className="uprofile-page"><p className="uprofile-loading">Loading…</p></div>;
  if (!user)   return <div className="uprofile-page"><p className="uprofile-loading">Could not load profile.</p></div>;

  const myRecipes = myPosts.filter(p => p.post_type === "recipe");
  const myReels   = myPosts.filter(p => p.post_type === "reel");
  const avatarSrc = picPreview || getAvatar(user.profile_picture, user.name, 120);

  const renderTab = () => {
    switch (activeTab) {

      case "recipes":
        return <PostGrid posts={myRecipes} emptyMsg="No recipes posted yet." />;

      case "reels":
        return <PostGrid posts={myReels} emptyMsg="No reels posted yet." />;

      case "questions":
        return myQs.length === 0
          ? <p className="uprofile-empty">No questions posted yet.</p>
          : (
            <div className="uprofile-qlist">
              {myQs.map(q => (
                <div
                  key={q.question_id}
                  className="uprofile-qitem uprofile-qitem-click"
                  onClick={() => navigate("/questions")}
                >
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
                <div
                  key={a.answer_id}
                  className="uprofile-qitem uprofile-qitem-click"
                  onClick={() => navigate("/questions")}
                >
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
                <div
                  key={c.contribution_id}
                  className={`uprof-contrib-card uprof-contrib-${c.status}`}
                >
                  {c.image_url && (
                    <img src={c.image_url} alt={c.food_name} className="uprof-contrib-img" />
                  )}
                  <div className="uprof-contrib-body">
                    <div className="uprof-contrib-name">
                      {c.food_name}
                      {c.food_name_nepali && (
                        <span className="uprof-contrib-nepali"> · {c.food_name_nepali}</span>
                      )}
                    </div>
                    <div className="uprof-contrib-meta">
                      {c.culture_name && (
                        <span className="uprof-contrib-chip">{c.culture_name}</span>
                      )}
                      <span className={`uprof-contrib-status uprof-status-${c.status}`}>
                        {c.status === 'pending'  && '⏳ Pending Review'}
                        {c.status === 'approved' && '✓ Approved & Live'}
                        {c.status === 'rejected' && '✕ Not Approved'}
                      </span>
                    </div>

                    {/* Admin message — shown for approved and rejected */}
                    {c.admin_message && (
                      <div className={`uprof-contrib-msg uprof-msg-${c.status}`}>
                        <span className="uprof-contrib-msg-label">
                          {c.status === 'approved' ? '✓ Admin:' : '⚠ Reason:'}
                        </span>
                        {' '}{c.admin_message}
                      </div>
                    )}

                    <div className="uprof-contrib-date">
                      Submitted{' '}
                      {new Date(c.created_at).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                      {c.reviewed_at && (
                        <> · Reviewed{' '}
                          {new Date(c.reviewed_at).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'short', day: 'numeric'
                          })}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        );

      case "notifications":
        return notifs.length === 0
          ? <p className="uprofile-empty">No notifications yet.</p>
          : (
            <div className="uprofile-notif-list">
              {notifs.map(n => (
                <div
                  key={n.notification_id}
                  className={`uprofile-notif-item ${!n.is_read ? "unread" : ""} uprofile-qitem-click`}
                  onClick={() => {
                    if (n.type === 'contribution_approved' || n.type === 'contribution_rejected') {
                      setActiveTab('contributions');
                    } else if (n.post_id) {
                      navigate(`/post/${n.post_id}`);
                    } else if (n.question_id) {
                      navigate("/questions");
                    }
                  }}
                >
                  <div className={`uprofile-notif-icon uprof-notif-icon-${n.type}`}>
                    {NOTIF_ICONS[n.type] || "🔔"}
                  </div>
                  <div className="uprofile-notif-body">
                    <div className="uprofile-notif-actor">
                      <img
                        src={getAvatar(n.actor_pic, n.actor_name, 28)}
                        alt={n.actor_name}
                        className="uprofile-notif-avatar"
                      />
                      <span className="uprofile-notif-msg">{n.message}</span>
                    </div>
                    <span className="uprofile-notif-time">
                      {new Date(n.created_at).toLocaleDateString("en-US", {
                        month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </span>
                  </div>
                  {!n.is_read && <div className="uprofile-notif-dot" />}
                </div>
              ))}
            </div>
          );

      default: return null;
    }
  };

  return (
    <div className="uprofile-page">
      <div className="uprofile-container">

        <div className="uprofile-header">
          <div className="uprofile-avatar-wrap">
            <img src={avatarSrc} alt="avatar" className="uprofile-avatar" />
            {editing && (
              <label className="uprofile-avatar-edit" title="Change photo">
                <img
                  src="https://api.iconify.design/material-symbols/edit-outline.svg?color=%23fff"
                  alt="edit" width="14" height="14"
                />
                <input type="file" accept="image/*" onChange={handlePicChange} style={{ display: "none" }} />
              </label>
            )}
          </div>

          <div className="uprofile-info">
            <div className="uprofile-name-row">
              {editing
                ? <input
                    className="uprofile-name-input"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                  />
                : <h2 className="uprofile-name">{user.name}</h2>
              }
              {editing ? (
                <div className="uprofile-edit-actions">
                  <button
                    className="uprofile-save-btn"
                    onClick={saveProfile}
                    disabled={saving}
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button
                    className="uprofile-cancel-btn"
                    onClick={() => {
                      setEditing(false);
                      setEditName(user.name);
                      setEditBio(user.bio || "");
                      setPicPreview(null);
                      setPicFile(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button className="uprofile-edit-btn" onClick={() => setEditing(true)}>
                  ✎ Edit Profile
                </button>
              )}
            </div>

            <p className="uprofile-email">
              <img
                src="https://api.iconify.design/material-symbols/mail-outline.svg?color=%239ca3af"
                alt="" width="14" height="14"
              />
              {user.email}
            </p>

            {editing
              ? <textarea
                  className="uprofile-bio-edit"
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  rows={3}
                  placeholder="Write something about yourself…"
                />
              : <p className="uprofile-bio">{user.bio || "No bio yet."}</p>
            }

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
              onClick={t.id === "notifications" ? openNotifications : () => setActiveTab(t.id)}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
              {t.id === "notifications" && unreadCount > 0 && (
                <span className="uprofile-notif-badge">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="uprofile-content">{renderTab()}</div>
      </div>
    </div>
  );
}

function PostGrid({ posts, emptyMsg = "Nothing here yet." }) {
  if (posts.length === 0) return <p className="uprofile-empty">{emptyMsg}</p>;
  return (
    <div className="uprofile-grid">
      {posts.map(p => (
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