import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getNotifications, markAllRead } from "../api/notificationService";
import "./NotificationPanel.css";

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

function notifConfig(type) {
  switch (type) {
    case "like":
    case "post_liked":
      return { icon: "❤️", color: "#e07b54", bg: "#fff4f0", label: "liked your post" };
    case "comment":
    case "post_commented":
      return { icon: "💬", color: "#2a7d6f", bg: "#edf7f5", label: "commented on your post" };
    case "answer":
    case "question_answered":
      return { icon: "💡", color: "#5a7dc4", bg: "#eef2fb", label: "answered your question" };
    case "contribution_approved":
      return { icon: "✓", color: "#15803d", bg: "#f0fdf4", label: "contribution approved" };
    case "contribution_rejected":
      return { icon: "✕", color: "#b91c1c", bg: "#fef2f2", label: "contribution not approved" };
    case "content_removed":
      return { icon: "🚫", color: "#b91c1c", bg: "#fef2f2", label: "content removed" };
    case "report_actioned":
      return { icon: "🛡️", color: "#15803d", bg: "#f0fdf4", label: "report actioned" };
    default:
      return { icon: "🔔", color: "#9c7c6a", bg: "#fdf8f5", label: type?.replace(/_/g, " ") || "notification" };
  }
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function NotificationPanel({ onClose }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifications()
      .then((res) => {
        const data = res.data.data;
        setNotifications(data.notifications || []);
        if (data.unreadCount > 0) {
          markAllRead().catch(() => {});
          window.dispatchEvent(new Event("notif-cleared"));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleClick = (n) => {
    setNotifications((prev) =>
      prev.map((x) => x.notification_id === n.notification_id ? { ...x, is_read: 1 } : x)
    );

    if (n.type === "contribution_approved" || n.type === "contribution_rejected") {
      onClose?.(); navigate("/profile"); return;
    }
    if (n.type === "content_removed") {
      onClose?.(); navigate("/profile"); return;
    }
    if (n.type === "report_actioned") {
      onClose?.(); return;
    }
    if (n.post_id) { onClose?.(); navigate("/recipes"); return; }
    if (n.question_id) { onClose?.(); navigate("/questions"); return; }
  };

  return (
    <div className="np-panel">
      <div className="np-panel-header">
        <span className="np-panel-title">Notifications</span>
        {onClose && (
          <button className="np-panel-close" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        )}
      </div>

      <div className="np-panel-body">
        {loading && (
          <div className="np-empty">
            <div className="np-spinner" />
            <p>Loading…</p>
          </div>
        )}
        {!loading && notifications.length === 0 && (
          <div className="np-empty">
            <span className="np-empty-icon">🔔</span>
            <p>No notifications yet</p>
          </div>
        )}
        {!loading && notifications.map((n) => {
          const cfg    = notifConfig(n.type);
          const unread = !n.is_read;
          const actor  = n.actor_name || "Someone";
          const message = n.message || `${actor} ${cfg.label}`;
          const ref    = n.post_title || n.question_title || null;

          return (
            <div
              key={n.notification_id}
              className={`np-item ${unread ? "unread" : ""}`}
              onClick={() => handleClick(n)}
            >
              <div className="np-item-icon-wrap" style={{ background: cfg.bg, color: cfg.color }}>
                <span className="np-item-icon">{cfg.icon}</span>
              </div>
              <div className="np-item-content">
                <p className="np-item-message">{message}</p>
                {ref && <p className="np-item-ref">"{ref}"</p>}
                {n.admin_message && (
                  <p className="np-item-admin" style={{ borderLeftColor: cfg.color }}>
                    {n.admin_message}
                  </p>
                )}
                <p className="np-item-time">{timeAgo(n.created_at)}</p>
              </div>
              {unread && <div className="np-unread-dot" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}