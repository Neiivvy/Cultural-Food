import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  adminGetStats, adminGetFoods,
  adminApproveFood, adminRejectFood, adminDeleteFood,
  adminGetReports, adminActReport,
} from "../api/foodService";
import "./AdminDashboard.css";

/* ── helpers ── */
const fmt = (d) => new Date(d).toLocaleDateString("en-NP", { day:"numeric", month:"short", year:"numeric" });

/* ── Stat card ── */
const StatCard = ({ label, value, color, icon }) => (
  <div className="adash-stat" style={{ "--stat-color": color }}>
    <span className="adash-stat-icon">{icon}</span>
    <span className="adash-stat-val">{value ?? "—"}</span>
    <span className="adash-stat-label">{label}</span>
  </div>
);

/* ── Reject modal ── */
function RejectModal({ food, onConfirm, onCancel }) {
  const [note, setNote] = useState("");
  return (
    <div className="adash-overlay" onClick={onCancel}>
      <div className="adash-modal" onClick={e => e.stopPropagation()}>
        <h3 className="adash-modal-title">Reject Submission</h3>
        <p  className="adash-modal-sub">Rejecting: <strong>{food.food_name}</strong></p>
        <textarea
          className="adash-modal-note"
          rows={3} placeholder="Optional note to the submitter…"
          value={note} onChange={e => setNote(e.target.value)}
        />
        <div className="adash-modal-actions">
          <button className="adash-btn-ghost"  onClick={onCancel}>Cancel</button>
          <button className="adash-btn-reject" onClick={() => onConfirm(note)}>Reject</button>
        </div>
      </div>
    </div>
  );
}

/* ── Food detail modal ── */
function FoodDetailModal({ food, onClose, onApprove, onReject }) {
  return (
    <div className="adash-overlay" onClick={onClose}>
      <div className="adash-modal adash-modal-lg" onClick={e => e.stopPropagation()}>
        <button className="adash-modal-close" onClick={onClose}>✕</button>
        {food.image_url && <img src={food.image_url} alt={food.food_name} className="adash-detail-img" />}
        <h2 className="adash-detail-name">{food.food_name}</h2>
        <div className="adash-detail-meta">
          {food.culture_name && <span className="adash-tag teal">{food.culture_name}</span>}
          {food.season       && <span className="adash-tag">{food.season}</span>}
          {food.taste        && <span className="adash-tag">{food.taste}</span>}
          {food.festival     && <span className="adash-tag">{food.festival}</span>}
          {food.location     && <span className="adash-tag">📍 {food.location}</span>}
        </div>
        <p className="adash-detail-desc">{food.description}</p>
        {food.cultural_significance && (
          <div className="adash-detail-sig">
            <strong>Cultural Significance:</strong>
            <p>{food.cultural_significance}</p>
          </div>
        )}
        <p className="adash-detail-by">Submitted by <strong>{food.submitter_name || "Unknown"}</strong> ({food.submitter_email}) · {fmt(food.created_at)}</p>
        {food.status === "pending" && (
          <div className="adash-modal-actions">
            <button className="adash-btn-ghost"    onClick={onClose}>Close</button>
            <button className="adash-btn-reject"   onClick={() => { onReject(food); onClose(); }}>Reject</button>
            <button className="adash-btn-approve"  onClick={() => { onApprove(food.food_id); onClose(); }}>Approve</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main Dashboard ── */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const admin = JSON.parse(localStorage.getItem("adminUser") || "null");

  const [tab,       setTab]       = useState("pending");
  const [stats,     setStats]     = useState(null);
  const [foods,     setFoods]     = useState([]);
  const [reports,   setReports]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [rejectFood,setRejectFood]= useState(null);
  const [detailFood,setDetailFood]= useState(null);
  const [toast,     setToast]     = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, foodsRes] = await Promise.all([
        adminGetStats(),
        adminGetFoods(tab === "reports" ? "" : tab),
      ]);
      setStats(statsRes.data.data);
      setFoods(foodsRes.data.data.foods || []);
      if (tab === "reports") {
        const rr = await adminGetReports();
        setReports(rr.data.data.reports || []);
      }
    } catch {/* ignore */}
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleApprove = async (id) => {
    await adminApproveFood(id);
    showToast("✓ Food approved and published!");
    loadData();
  };
  const handleRejectConfirm = async (note) => {
    await adminRejectFood(rejectFood.food_id, note);
    setRejectFood(null);
    showToast("Food rejected.");
    loadData();
  };
  const handleDelete = async (id) => {
    if (!window.confirm("Permanently delete this food?")) return;
    await adminDeleteFood(id);
    showToast("Food deleted.");
    loadData();
  };
  const handleReport = async (id, action) => {
    await adminActReport(id, action);
    showToast(`Report ${action}.`);
    loadData();
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/admin/login");
  };

  // Guard — placed after all hooks to satisfy Rules of Hooks
  const adminToken = localStorage.getItem("adminToken");
  if (!adminToken || !admin) {
    navigate("/admin/login");
    return null;
  }

  const TABS = [
    { id:"pending",  label:"Pending",  count: stats?.foods?.pending  },
    { id:"approved", label:"Approved", count: stats?.foods?.approved },
    { id:"rejected", label:"Rejected", count: stats?.foods?.rejected },
    { id:"reports",  label:"Reports",  count: stats?.pending_reports },
  ];

  return (
    <div className="adash-page">

      {/* Toast */}
      {toast && <div className="adash-toast">{toast}</div>}

      {/* Sidebar */}
      <aside className="adash-sidebar">
        <div className="adash-sidebar-brand">
          <span className="adash-brand-k">Khana</span>
          <span className="adash-brand-s"> Sanskriti</span>
          <span className="adash-admin-badge">Admin</span>
        </div>
        <nav className="adash-nav">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`adash-nav-item ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              <span className="adash-nav-label">{t.label}</span>
              {t.count > 0 && <span className="adash-nav-badge">{t.count}</span>}
            </button>
          ))}
        </nav>
        <div className="adash-sidebar-footer">
          <p className="adash-sidebar-user">{admin?.name}</p>
          <button className="adash-logout" onClick={handleLogout}>Sign Out</button>
        </div>
      </aside>

      {/* Main content */}
      <main className="adash-main">

        {/* Stats row */}
        {stats && (
          <div className="adash-stats-row">
            <StatCard label="Pending Review" value={stats.foods.pending}     color="#f59e0b" icon="⏳" />
            <StatCard label="Approved Foods" value={stats.foods.approved}    color="#10b981" icon="✅" />
            <StatCard label="Total Users"    value={stats.total_users}       color="#6366f1" icon="👥" />
            <StatCard label="Total Posts"    value={stats.total_posts}       color="#7c2d2d" icon="📝" />
          </div>
        )}

        {/* Section header */}
        <div className="adash-section-header">
          <h2 className="adash-section-title">
            {tab === "pending"  && "Pending Submissions"}
            {tab === "approved" && "Approved Foods"}
            {tab === "rejected" && "Rejected Submissions"}
            {tab === "reports"  && "Pending Reports"}
          </h2>
          <button className="adash-refresh" onClick={loadData}>↻ Refresh</button>
        </div>

        {loading ? (
          <div className="adash-loading">Loading…</div>
        ) : tab === "reports" ? (
          /* ── Reports table ── */
          reports.length === 0 ? (
            <div className="adash-empty">🎉 No pending reports</div>
          ) : (
            <div className="adash-table-wrap">
              <table className="adash-table">
                <thead><tr>
                  <th>Post</th><th>Reporter</th><th>Reason</th><th>Date</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {reports.map(r => (
                    <tr key={r.report_id}>
                      <td className="adash-td-bold">{r.post_title || `#${r.post_id}`}</td>
                      <td>{r.reporter_name}</td>
                      <td className="adash-td-reason">{r.reason}</td>
                      <td className="adash-td-date">{fmt(r.created_at)}</td>
                      <td>
                        <div className="adash-row-actions">
                          <button className="adash-btn-sm adash-btn-approve" onClick={() => handleReport(r.report_id,"resolved")}>Resolve</button>
                          <button className="adash-btn-sm adash-btn-ghost"   onClick={() => handleReport(r.report_id,"ignored")}>Ignore</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* ── Foods grid ── */
          foods.length === 0 ? (
            <div className="adash-empty">No {tab} submissions found.</div>
          ) : (
            <div className="adash-foods-grid">
              {foods.map(food => (
                <div key={food.food_id} className="adash-food-card">
                  <div className="adash-food-img-wrap" onClick={() => setDetailFood(food)}>
                    {food.image_url
                      ? <img src={food.image_url} alt={food.food_name} className="adash-food-img" />
                      : <div className="adash-food-img-placeholder">🍽️</div>
                    }
                    <span className={`adash-status-badge ${food.status}`}>{food.status}</span>
                  </div>
                  <div className="adash-food-body">
                    <h3 className="adash-food-name" onClick={() => setDetailFood(food)}>{food.food_name}</h3>
                    <div className="adash-food-tags">
                      {food.culture_name && <span className="adash-tag teal">{food.culture_name}</span>}
                      {food.taste        && <span className="adash-tag">{food.taste}</span>}
                      {food.season       && <span className="adash-tag">{food.season}</span>}
                    </div>
                    <p className="adash-food-desc">{food.description?.slice(0,100)}{food.description?.length > 100 ? "…" : ""}</p>
                    <p className="adash-food-meta">
                      By <strong>{food.submitter_name || "Unknown"}</strong> · {fmt(food.created_at)}
                    </p>
                    {food.rejection_note && (
                      <p className="adash-food-rejection">Note: {food.rejection_note}</p>
                    )}
                  </div>
                  <div className="adash-food-actions">
                    <button className="adash-btn-sm adash-btn-ghost" onClick={() => setDetailFood(food)}>View</button>
                    {food.status === "pending" && <>
                      <button className="adash-btn-sm adash-btn-reject"  onClick={() => setRejectFood(food)}>Reject</button>
                      <button className="adash-btn-sm adash-btn-approve" onClick={() => handleApprove(food.food_id)}>Approve</button>
                    </>}
                    {food.status !== "pending" && (
                      <button className="adash-btn-sm adash-btn-delete" onClick={() => handleDelete(food.food_id)}>Delete</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </main>

      {/* Modals */}
      {rejectFood && (
        <RejectModal
          food={rejectFood}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectFood(null)}
        />
      )}
      {detailFood && (
        <FoodDetailModal
          food={detailFood}
          onClose={() => setDetailFood(null)}
          onApprove={handleApprove}
          onReject={(f) => { setDetailFood(null); setRejectFood(f); }}
        />
      )}
    </div>
  );
}