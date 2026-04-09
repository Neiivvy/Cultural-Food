
import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAdminContributions,
  getAdminContributionById,
  updateContribution,
  approveContribution,
  rejectContribution,
} from "../api/contributionService";
import adminAxios from "../api/adminAxios";
import "./AdminDashboard.css";

const STATUS_COLORS = { pending: "#b45309", approved: "#15803d", rejected: "#b91c1c" };

const SECTION_TABS = ["contributions", "reports"];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const admin    = JSON.parse(localStorage.getItem("admin") || "null");

  // ── Section: contributions or reports ──
  const [section,  setSection]  = useState("contributions");

  // ── Contributions state ──
  const [contribTab,    setContribTab]  = useState("pending");
  const [contributions, setContribs]   = useState([]);
  const [contribLoading, setContribLoading] = useState(true);
  const [selected, setSelected]        = useState(null);
  const [editMode, setEditMode]        = useState(false);
  const [editData, setEditData]        = useState(null);
  const [actionMsg, setActionMsg]      = useState("");
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [saving, setSaving]            = useState(false);

  // ── Reports state ──
  const [reports,       setReports]      = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportStatus,  setReportStatus] = useState("pending");
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportActing,  setReportActing] = useState(false);
  // Persistent pending count — visible in sidebar regardless of active tab
  const [pendingReportCount, setPendingReportCount] = useState(0);

  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!admin || !localStorage.getItem("adminToken")) navigate("/admin/login");
  }, []); // eslint-disable-line

  // ── Fetch contributions ──
  const fetchContribs = useCallback(async () => {
    setContribLoading(true);
    try {
      const res = await getAdminContributions(contribTab);
      setContribs(res.data.data?.contributions || []);
    } catch { setContribs([]); }
    finally  { setContribLoading(false); }
  }, [contribTab]);

  useEffect(() => {
    if (section === "contributions") fetchContribs();
  }, [fetchContribs, section]);

  // ── Fetch reports ──
  const fetchReports = useCallback(async () => {
    setReportsLoading(true);
    try {
      const res = await adminAxios.get(`/reports?status=${reportStatus}`);
      setReports(res.data.data?.reports || []);
    } catch { setReports([]); }
    finally { setReportsLoading(false); }
  }, [reportStatus]);

  useEffect(() => {
    if (section === "reports") fetchReports();
  }, [fetchReports, section]);

  // Always fetch pending count for sidebar badge — independent of active section
  const fetchPendingCount = useCallback(async () => {
    try {
      const res = await adminAxios.get("/reports?status=pending");
      setPendingReportCount((res.data.data?.reports || []).length);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchPendingCount(); }, [fetchPendingCount]);

  // ── Contribution detail ──
  const openDetail = async (id) => {
    try {
      const res = await getAdminContributionById(id);
      const contrib = res.data.data?.contribution;
      setSelected(contrib);
      setEditData({ ...contrib });
      setEditMode(false);
      setActionMsg("");
      setShowRejectBox(false);
    } catch { showToast("Failed to load contribution."); }
  };
  const closeDetail = () => { setSelected(null); setEditData(null); };

  // ── Edit helpers ──
  const setEditField = (key, val) => setEditData(d => ({ ...d, [key]: val }));
  const toggleAttr   = (type, value) => {
    setEditData(d => {
      const attrs  = d.attributes || [];
      const exists = attrs.some(a => a.attribute_type === type && a.attribute_value === value);
      return {
        ...d,
        attributes: exists
          ? attrs.filter(a => !(a.attribute_type === type && a.attribute_value === value))
          : [...attrs, { attribute_type: type, attribute_value: value }],
      };
    });
  };

  const saveEdits = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      ["food_name","food_name_nepali","culture_id","location","description","cultural_significance","preparation_summary","veg_status"]
        .forEach(f => { if (editData[f] !== undefined) fd.append(f, editData[f] || ""); });
      fd.append("attributes",  JSON.stringify((editData.attributes || []).map(a => ({ type: a.attribute_type, value: a.attribute_value }))));
      fd.append("ingredients", JSON.stringify(editData.ingredients || []));
      await updateContribution(selected.contribution_id, fd);
      showToast("Changes saved.");
      openDetail(selected.contribution_id);
    } catch { showToast("Failed to save changes."); }
    finally  { setSaving(false); }
  };

  const handleApprove = async () => {
    setSaving(true);
    try {
      await approveContribution(selected.contribution_id, actionMsg);
      showToast("✓ Approved and published! User has been notified.");
      closeDetail(); setContribTab("approved");
    } catch (err) { showToast(err.response?.data?.message || "Error approving."); }
    finally { setSaving(false); }
  };

  const handleReject = async () => {
    if (!actionMsg.trim()) { showToast("Please write a reason for rejection."); return; }
    setSaving(true);
    try {
      await rejectContribution(selected.contribution_id, actionMsg);
      showToast("Contribution rejected. User notified with reason.");
      closeDetail(); setContribTab("rejected");
    } catch (err) { showToast(err.response?.data?.message || "Error rejecting."); }
    finally { setSaving(false); }
  };

  // ── Report actions ──
  const handleDismissReport = async (action) => {
    if (!selectedReport) return;
    setReportActing(true);
    try {
      await adminAxios.put(`/reports/${selectedReport.report_id}`, { action });
      showToast(`Report ${action}.`);
      setSelectedReport(null);
      fetchReports();
      fetchPendingCount();
    } catch { showToast("Failed to update report."); }
    finally { setReportActing(false); }
  };

  const handleDeleteContent = async () => {
    if (!selectedReport) return;
    setReportActing(true);
    try {
      await adminAxios.delete(`/reports/${selectedReport.report_id}`);
      showToast("Content deleted. Both parties notified.");
      setSelectedReport(null);
      fetchReports();
      fetchPendingCount();
    } catch { showToast("Failed to delete content."); }
    finally { setReportActing(false); }
  };

  const showToast  = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3500); };
  const handleLogout = () => { localStorage.removeItem("adminToken"); localStorage.removeItem("admin"); navigate("/admin/login"); };

  const ATTR_OPTIONS = {
    taste:     ["Sweet","Spicy","Sour","Salty","Bitter","Umami","Mixed"],
    season:    ["Spring","Summer","Autumn","Winter","All Season"],
    festival:  ["Dashain","Tihar","Chhath","Maghe Sankranti","Indra Jatra","Yomari Punhi","Maghi","Janai Purnima","Teej","Other"],
    meal_type: ["Breakfast","Lunch","Dinner","Snack","Dessert"],
    occasion:  ["Festival","Wedding","Everyday","Offering","Funeral"],
  };

  return (
    <div className="adm-wrap">
      {/* ── Sidebar ── */}
      <aside className="adm-sidebar">
        <div className="adm-brand">Khana Sanskriti<span>Admin</span></div>
        <nav className="adm-nav">
          {/* Section selector */}
          <div className="adm-section-label">Content</div>
          {["pending","approved","rejected"].map(s => (
            <button
              key={s}
              className={`adm-nav-btn${section === "contributions" && contribTab === s ? " active" : ""}`}
              onClick={() => { setSection("contributions"); setContribTab(s); closeDetail(); setSelectedReport(null); }}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
              {s === "pending" && contributions.length > 0 && contribTab === "pending" && section === "contributions" &&
                <span className="adm-badge">{contributions.length}</span>}
            </button>
          ))}

          <div className="adm-section-label" style={{ marginTop: "1rem" }}>Reports</div>
          {["pending","resolved","ignored"].map(s => (
            <button
              key={`r-${s}`}
              className={`adm-nav-btn${section === "reports" && reportStatus === s ? " active" : ""}`}
              onClick={() => { setSection("reports"); setReportStatus(s); setSelectedReport(null); closeDetail(); }}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
              {/* Always show pending count in sidebar regardless of active section */}
              {s === "pending" && pendingReportCount > 0 && (
                <span className="adm-badge adm-badge-red">{pendingReportCount}</span>
              )}
            </button>
          ))}
        </nav>
        <button className="adm-logout" onClick={handleLogout}>Logout</button>
      </aside>

      {/* ── Main ── */}
      <main className="adm-main">
        <div className="adm-topbar">
          <h1 className="adm-title">
            {section === "contributions"
              ? `${contribTab.charAt(0).toUpperCase() + contribTab.slice(1)} Contributions`
              : `${reportStatus.charAt(0).toUpperCase() + reportStatus.slice(1)} Reports`
            }
          </h1>
          <span className="adm-admin-name">👤 {admin?.name}</span>
        </div>

        {toast && <div className="adm-toast">{toast}</div>}

        {/* ════ CONTRIBUTIONS LIST ════ */}
        {section === "contributions" && (
          contribLoading ? <div className="adm-loading">Loading…</div>
          : contributions.length === 0 ? <div className="adm-empty">No {contribTab} contributions.</div>
          : (
            <div className="adm-list">
              {contributions.map(c => (
                <div key={c.contribution_id}
                  className={`adm-card${selected?.contribution_id === c.contribution_id ? " active" : ""}`}
                  onClick={() => openDetail(c.contribution_id)}>
                  {c.image_url
                    ? <img src={c.image_url} alt={c.food_name} className="adm-card-img" />
                    : <div className="adm-card-img adm-card-img-placeholder">🍽</div>}
                  <div className="adm-card-body">
                    <div className="adm-card-name">{c.food_name}</div>
                    <div className="adm-card-meta">
                      {c.culture_name && <span className="adm-chip">{c.culture_name}</span>}
                      <span className="adm-chip" style={{ color: STATUS_COLORS[c.status] }}>{c.status}</span>
                    </div>
                    <div className="adm-card-submitter">By <strong>{c.submitter_name}</strong> · {c.submitter_email}</div>
                    <div className="adm-card-date">{new Date(c.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ════ REPORTS LIST ════ */}
        {section === "reports" && (
          reportsLoading ? <div className="adm-loading">Loading…</div>
          : reports.length === 0 ? <div className="adm-empty">No {reportStatus} reports.</div>
          : (
            <div className="adm-list">
              {reports.map(r => (
                <div
                  key={r.report_id}
                  className={`adm-card${selectedReport?.report_id === r.report_id ? " active" : ""}`}
                  onClick={() => setSelectedReport(r)}
                >
                  <div className="adm-report-icon">🚩</div>
                  <div className="adm-card-body">
                    <div className="adm-card-name">
                      {r.post_title || r.question_title || "Untitled content"}
                    </div>
                    <div className="adm-card-meta">
                      <span className="adm-chip">{r.post_id ? "Post" : "Question"}</span>
                      <span className="adm-chip" style={{ color: "#b45309" }}>{r.status}</span>
                    </div>
                    <div className="adm-card-submitter">
                      Reported by <strong>{r.reporter_name}</strong>
                    </div>
                    <div className="adm-card-submitter" style={{ marginTop: 2 }}>
                      Reason: <em>{r.reason}</em>
                    </div>
                    <div className="adm-card-date">{new Date(r.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </main>

      {/* ── Contribution detail panel ── */}
      {section === "contributions" && selected && (
        <div className="adm-detail">
          <div className="adm-detail-header">
            <h2>{editMode ? "Editing" : "Review"}: {selected.food_name}</h2>
            <div className="adm-detail-actions-top">
              {!editMode && selected.status === "pending" && (
                <button className="adm-btn adm-btn-edit" onClick={() => setEditMode(true)}>Edit</button>
              )}
              {editMode && (
                <>
                  <button className="adm-btn adm-btn-save" onClick={saveEdits} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
                  <button className="adm-btn adm-btn-cancel" onClick={() => { setEditMode(false); setEditData({ ...selected }); }}>Cancel</button>
                </>
              )}
              <button className="adm-btn adm-btn-close" onClick={closeDetail}>✕</button>
            </div>
          </div>

          <div className="adm-detail-scroll">
            <div className="adm-submitter-row">
              {selected.submitter_picture
                ? <img src={selected.submitter_picture} alt="" className="adm-sub-avatar" />
                : <div className="adm-sub-avatar adm-sub-initials">{selected.submitter_name?.charAt(0).toUpperCase()}</div>}
              <div>
                <div className="adm-sub-name">{selected.submitter_name}</div>
                <div className="adm-sub-email">{selected.submitter_email}</div>
              </div>
            </div>

            {selected.image_url && (
              <img src={selected.image_url} alt={selected.food_name} className="adm-detail-img" />
            )}

            {[
              { label: "Food Name (English)", key: "food_name" },
              { label: "Food Name (Nepali)",  key: "food_name_nepali" },
              { label: "Location",            key: "location" },
            ].map(({ label, key }) => (
              <div className="adm-field" key={key}>
                <label className="adm-field-label">{label}</label>
                {editMode
                  ? <input className="adm-field-input" value={editData[key] || ""} onChange={e => setEditField(key, e.target.value)} />
                  : <p className="adm-field-val">{selected[key] || "—"}</p>}
              </div>
            ))}

            <div className="adm-field">
              <label className="adm-field-label">Diet</label>
              {editMode
                ? <select className="adm-field-input" value={editData.veg_status} onChange={e => setEditField("veg_status", e.target.value)}>
                    <option value="veg">Veg</option><option value="non-veg">Non-Veg</option><option value="vegan">Vegan</option>
                  </select>
                : <p className="adm-field-val">{selected.veg_status}</p>}
            </div>

            {[
              { label: "Description",           key: "description" },
              { label: "Cultural Significance", key: "cultural_significance" },
              { label: "Preparation Summary",   key: "preparation_summary" },
            ].map(({ label, key }) => (
              <div className="adm-field" key={key}>
                <label className="adm-field-label">{label}</label>
                {editMode
                  ? <textarea className="adm-field-textarea" value={editData[key] || ""} onChange={e => setEditField(key, e.target.value)} rows={3} />
                  : <p className="adm-field-val">{selected[key] || "—"}</p>}
              </div>
            ))}

            <div className="adm-field">
              <label className="adm-field-label">Attributes</label>
              {editMode ? (
                Object.entries(ATTR_OPTIONS).map(([type, opts]) => (
                  <div key={type} className="adm-attr-group">
                    <div className="adm-attr-type">{type}</div>
                    <div className="adm-chips">
                      {opts.map(opt => {
                        const active = (editData.attributes || []).some(a => a.attribute_type === type && a.attribute_value === opt);
                        return <button type="button" key={opt} className={`adm-chip${active ? " active" : ""}`} onClick={() => toggleAttr(type, opt)}>{opt}</button>;
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="adm-chips">
                  {(selected.attributes || []).map((a, i) => (
                    <span key={i} className="adm-chip active">{a.attribute_type}: {a.attribute_value}</span>
                  ))}
                  {(!selected.attributes || selected.attributes.length === 0) && <span className="adm-field-val">None</span>}
                </div>
              )}
            </div>

            <div className="adm-field">
              <label className="adm-field-label">Ingredients</label>
              {editMode ? (
                <div className="adm-ing-list">
                  {(editData.ingredients || []).map((ing, i) => (
                    <div key={i} className="adm-ing-row">
                      <input className="adm-field-input" value={ing}
                        onChange={e => { const arr = [...editData.ingredients]; arr[i] = e.target.value; setEditField("ingredients", arr); }} />
                      <button type="button" className="adm-ing-remove"
                        onClick={() => setEditField("ingredients", editData.ingredients.filter((_,j) => j !== i))}>✕</button>
                    </div>
                  ))}
                  <button type="button" className="adm-ing-add"
                    onClick={() => setEditField("ingredients", [...(editData.ingredients || []), ""])}>+ Add</button>
                </div>
              ) : (
                <ul className="adm-ing-display">
                  {(selected.ingredients || []).map((ing, i) => <li key={i}>{ing}</li>)}
                  {(!selected.ingredients || selected.ingredients.length === 0) && <li style={{color:"#999"}}>None listed</li>}
                </ul>
              )}
            </div>

            {selected.admin_message && (
              <div className="adm-field">
                <label className="adm-field-label">Admin Note</label>
                <p className="adm-field-val">{selected.admin_message}</p>
              </div>
            )}

            {selected.status === "pending" && !editMode && (
              <div className="adm-action-panel">
                <div className="adm-field">
                  <label className="adm-field-label">Message to user (optional for approval, required for rejection)</label>
                  <textarea className="adm-field-textarea" value={actionMsg} onChange={e => setActionMsg(e.target.value)} placeholder="Write a message to send to the contributor…" rows={3} />
                </div>
                <div className="adm-action-btns">
                  <button className="adm-btn adm-btn-approve" onClick={handleApprove} disabled={saving}>{saving ? "Processing…" : "✓ Approve & Publish"}</button>
                  <button className="adm-btn adm-btn-reject" onClick={() => setShowRejectBox(r => !r)}>✕ Reject</button>
                </div>
                {showRejectBox && (
                  <button className="adm-btn adm-btn-reject-confirm" onClick={handleReject} disabled={saving}>
                    Confirm Rejection (user will be notified)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Report detail panel ── */}
      {section === "reports" && selectedReport && (
        <div className="adm-detail">
          <div className="adm-detail-header">
            <h2>Report Detail</h2>
            <button className="adm-btn adm-btn-close" onClick={() => setSelectedReport(null)}>✕</button>
          </div>
          <div className="adm-detail-scroll">
            {/* Reporter info */}
            <div className="adm-submitter-row">
              <div className="adm-sub-avatar adm-sub-initials">
                {selectedReport.reporter_name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="adm-sub-name">{selectedReport.reporter_name}</div>
                <div className="adm-sub-email">{selectedReport.reporter_email}</div>
              </div>
            </div>

            <div className="adm-field">
              <label className="adm-field-label">Reported Content</label>
              <p className="adm-field-val">
                {selectedReport.post_title || selectedReport.question_title || "—"}
              </p>
              <p className="adm-field-val" style={{ fontSize: "0.78rem", color: "#9c7c6a", marginTop: 2 }}>
                {selectedReport.post_id ? "Post" : "Question"} · by {selectedReport.content_owner_name || "unknown"}
              </p>
            </div>

            <div className="adm-field">
              <label className="adm-field-label">Reason</label>
              <p className="adm-field-val">{selectedReport.reason}</p>
            </div>

            <div className="adm-field">
              <label className="adm-field-label">Reported</label>
              <p className="adm-field-val">{new Date(selectedReport.created_at).toLocaleString()}</p>
            </div>

            <div className="adm-field">
              <label className="adm-field-label">Status</label>
              <p className="adm-field-val" style={{ color: STATUS_COLORS[selectedReport.status] || "#b45309" }}>
                {selectedReport.status}
              </p>
            </div>

            {selectedReport.status === "pending" && (
              <div className="adm-action-panel">
                <p className="adm-report-action-note">
                  Choose an action. Deleting content will notify both the reporter and the content owner.
                </p>
                <div className="adm-action-btns" style={{ flexDirection: "column" }}>
                  <button
                    className="adm-btn adm-btn-reject-confirm"
                    onClick={handleDeleteContent}
                    disabled={reportActing}
                    style={{ background: "#b91c1c" }}
                  >
                    {reportActing ? "Processing…" : "🗑 Delete Content & Notify Both Parties"}
                  </button>
                  <button
                    className="adm-btn adm-btn-edit"
                    onClick={() => handleDismissReport("ignored")}
                    disabled={reportActing}
                  >
                    Ignore Report (keep content)
                  </button>
                  <button
                    className="adm-btn adm-btn-cancel"
                    onClick={() => handleDismissReport("resolved")}
                    disabled={reportActing}
                  >
                    Mark Resolved (no action)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}