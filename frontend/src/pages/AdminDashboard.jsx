import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAdminContributions,
  getAdminContributionById,
  updateContribution,
  approveContribution,
  rejectContribution,
} from "../api/contributionService";
import "./AdminDashboard.css";

const STATUS_COLORS = { pending: "#b45309", approved: "#15803d", rejected: "#b91c1c" };

export default function AdminDashboard() {
  const navigate = useNavigate();
  const admin    = JSON.parse(localStorage.getItem("admin") || "null");

  const [tab, setTab]               = useState("pending");
  const [contributions, setContribs]= useState([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);   // full detail of one submission
  const [editMode, setEditMode]     = useState(false);
  const [editData, setEditData]     = useState(null);
  const [actionMsg, setActionMsg]   = useState("");     // admin message for approve/reject
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState("");

  // ── Guard ──────────────────────────────────────────────────
  useEffect(() => {
    if (!admin || !localStorage.getItem("adminToken")) {
      navigate("/admin/login");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch list ─────────────────────────────────────────────
  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminContributions(tab);
      setContribs(res.data.data?.contributions || []);
    } catch { setContribs([]); }
    finally  { setLoading(false); }
  }, [tab]);

  useEffect(() => { fetchList(); }, [fetchList]);

  // ── Open detail ────────────────────────────────────────────
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

  // ── Edit helpers ───────────────────────────────────────────
  const setEditField = (key, val) => setEditData(d => ({ ...d, [key]: val }));

  const toggleAttr = (type, value) => {
    setEditData(d => {
      const attrs = d.attributes || [];
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
      const fields = ["food_name","food_name_nepali","culture_id","location",
                      "description","cultural_significance","preparation_summary","veg_status"];
      fields.forEach(f => { if (editData[f] !== undefined) fd.append(f, editData[f] || ""); });
      fd.append("attributes",  JSON.stringify(
        (editData.attributes || []).map(a => ({ type: a.attribute_type, value: a.attribute_value }))
      ));
      fd.append("ingredients", JSON.stringify(editData.ingredients || []));
      await updateContribution(selected.contribution_id, fd);
      showToast("Changes saved.");
      openDetail(selected.contribution_id); // reload
    } catch { showToast("Failed to save changes."); }
    finally  { setSaving(false); }
  };

  // ── Approve ────────────────────────────────────────────────
  const handleApprove = async () => {
    setSaving(true);
    try {
      await approveContribution(selected.contribution_id, actionMsg);
      showToast("✓ Approved and published! User has been notified.");
      closeDetail();
      setTab("approved");   // switch to approved tab so admin can see it there
    } catch (err) { showToast(err.response?.data?.message || "Error approving."); }
    finally { setSaving(false); }
  };

  // ── Reject ─────────────────────────────────────────────────
  const handleReject = async () => {
    if (!actionMsg.trim()) { showToast("Please write a reason for rejection."); return; }
    setSaving(true);
    try {
      await rejectContribution(selected.contribution_id, actionMsg);
      showToast("Contribution rejected. User notified with reason.");
      closeDetail();
      setTab("rejected");   // switch to rejected tab so admin can see it there
    } catch (err) { showToast(err.response?.data?.message || "Error rejecting."); }
    finally { setSaving(false); }
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    navigate("/admin/login");
  };

  // ── Attr options ───────────────────────────────────────────
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
          {["pending","approved","rejected"].map(s => (
            <button key={s} className={`adm-nav-btn${tab === s ? " active" : ""}`}
              onClick={() => { setTab(s); closeDetail(); }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
              {s === "pending" && contributions.length > 0 && tab === "pending" &&
                <span className="adm-badge">{contributions.length}</span>}
            </button>
          ))}
        </nav>
        <button className="adm-logout" onClick={handleLogout}>Logout</button>
      </aside>

      {/* ── Main ── */}
      <main className="adm-main">
        <div className="adm-topbar">
          <h1 className="adm-title">
            {tab.charAt(0).toUpperCase() + tab.slice(1)} Contributions
          </h1>
          <span className="adm-admin-name">👤 {admin?.name}</span>
        </div>

        {toast && <div className="adm-toast">{toast}</div>}

        {loading ? (
          <div className="adm-loading">Loading…</div>
        ) : contributions.length === 0 ? (
          <div className="adm-empty">No {tab} contributions.</div>
        ) : (
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
                    <span className="adm-chip" style={{ color: STATUS_COLORS[c.status] }}>
                      {c.status}
                    </span>
                  </div>
                  <div className="adm-card-submitter">
                    By <strong>{c.submitter_name}</strong> · {c.submitter_email}
                  </div>
                  <div className="adm-card-date">
                    {new Date(c.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Detail Panel ── */}
      {selected && (
        <div className="adm-detail">
          <div className="adm-detail-header">
            <h2>{editMode ? "Editing" : "Review"}: {selected.food_name}</h2>
            <div className="adm-detail-actions-top">
              {!editMode && selected.status === "pending" && (
                <button className="adm-btn adm-btn-edit" onClick={() => setEditMode(true)}>Edit</button>
              )}
              {editMode && (
                <>
                  <button className="adm-btn adm-btn-save" onClick={saveEdits} disabled={saving}>
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button className="adm-btn adm-btn-cancel" onClick={() => { setEditMode(false); setEditData({ ...selected }); }}>
                    Cancel
                  </button>
                </>
              )}
              <button className="adm-btn adm-btn-close" onClick={closeDetail}>✕</button>
            </div>
          </div>

          <div className="adm-detail-scroll">
            {/* Submitter */}
            <div className="adm-submitter-row">
              {selected.submitter_picture
                ? <img src={selected.submitter_picture} alt="" className="adm-sub-avatar" />
                : <div className="adm-sub-avatar adm-sub-initials">
                    {selected.submitter_name?.charAt(0).toUpperCase()}
                  </div>}
              <div>
                <div className="adm-sub-name">{selected.submitter_name}</div>
                <div className="adm-sub-email">{selected.submitter_email}</div>
              </div>
            </div>

            {/* Image */}
            {selected.image_url && (
              <img src={selected.image_url} alt={selected.food_name} className="adm-detail-img" />
            )}

            {/* Fields */}
            {[
              { label: "Food Name (English)", key: "food_name" },
              { label: "Food Name (Nepali)",  key: "food_name_nepali" },
              { label: "Location",            key: "location" },
            ].map(({ label, key }) => (
              <div className="adm-field" key={key}>
                <label className="adm-field-label">{label}</label>
                {editMode
                  ? <input className="adm-field-input" value={editData[key] || ""}
                      onChange={e => setEditField(key, e.target.value)} />
                  : <p className="adm-field-val">{selected[key] || "—"}</p>}
              </div>
            ))}

            {/* Veg status */}
            <div className="adm-field">
              <label className="adm-field-label">Diet</label>
              {editMode
                ? <select className="adm-field-input" value={editData.veg_status}
                    onChange={e => setEditField("veg_status", e.target.value)}>
                    <option value="veg">Veg</option>
                    <option value="non-veg">Non-Veg</option>
                    <option value="vegan">Vegan</option>
                  </select>
                : <p className="adm-field-val">{selected.veg_status}</p>}
            </div>

            {/* Textareas */}
            {[
              { label: "Description",           key: "description" },
              { label: "Cultural Significance", key: "cultural_significance" },
              { label: "Preparation Summary",   key: "preparation_summary" },
            ].map(({ label, key }) => (
              <div className="adm-field" key={key}>
                <label className="adm-field-label">{label}</label>
                {editMode
                  ? <textarea className="adm-field-textarea" value={editData[key] || ""}
                      onChange={e => setEditField(key, e.target.value)} rows={3} />
                  : <p className="adm-field-val">{selected[key] || "—"}</p>}
              </div>
            ))}

            {/* Attributes */}
            <div className="adm-field">
              <label className="adm-field-label">Attributes</label>
              {editMode ? (
                Object.entries(ATTR_OPTIONS).map(([type, opts]) => (
                  <div key={type} className="adm-attr-group">
                    <div className="adm-attr-type">{type}</div>
                    <div className="adm-chips">
                      {opts.map(opt => {
                        const active = (editData.attributes || []).some(
                          a => a.attribute_type === type && a.attribute_value === opt
                        );
                        return (
                          <button type="button" key={opt}
                            className={`adm-chip${active ? " active" : ""}`}
                            onClick={() => toggleAttr(type, opt)}>{opt}</button>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="adm-chips">
                  {(selected.attributes || []).map((a, i) => (
                    <span key={i} className="adm-chip active">
                      {a.attribute_type}: {a.attribute_value}
                    </span>
                  ))}
                  {(!selected.attributes || selected.attributes.length === 0) && <span className="adm-field-val">None</span>}
                </div>
              )}
            </div>

            {/* Ingredients */}
            <div className="adm-field">
              <label className="adm-field-label">Ingredients</label>
              {editMode ? (
                <div className="adm-ing-list">
                  {(editData.ingredients || []).map((ing, i) => (
                    <div key={i} className="adm-ing-row">
                      <input className="adm-field-input" value={ing}
                        onChange={e => {
                          const arr = [...editData.ingredients];
                          arr[i] = e.target.value;
                          setEditField("ingredients", arr);
                        }} />
                      <button type="button" className="adm-ing-remove"
                        onClick={() => setEditField("ingredients", editData.ingredients.filter((_,j) => j !== i))}>✕</button>
                    </div>
                  ))}
                  <button type="button" className="adm-ing-add"
                    onClick={() => setEditField("ingredients", [...(editData.ingredients || []), ""])}>
                    + Add
                  </button>
                </div>
              ) : (
                <ul className="adm-ing-display">
                  {(selected.ingredients || []).map((ing, i) => <li key={i}>{ing}</li>)}
                  {(!selected.ingredients || selected.ingredients.length === 0) && <li style={{color:"#999"}}>None listed</li>}
                </ul>
              )}
            </div>

            {/* Admin message display if already reviewed */}
            {selected.admin_message && (
              <div className="adm-field">
                <label className="adm-field-label">Admin Note</label>
                <p className="adm-field-val">{selected.admin_message}</p>
              </div>
            )}

            {/* Approve / Reject actions — only for pending */}
            {selected.status === "pending" && !editMode && (
              <div className="adm-action-panel">
                <div className="adm-field">
                  <label className="adm-field-label">Message to user (optional for approval, required for rejection)</label>
                  <textarea className="adm-field-textarea"
                    value={actionMsg} onChange={e => setActionMsg(e.target.value)}
                    placeholder="Write a message to send to the contributor…" rows={3} />
                </div>
                <div className="adm-action-btns">
                  <button className="adm-btn adm-btn-approve" onClick={handleApprove} disabled={saving}>
                    {saving ? "Processing…" : "✓ Approve & Publish"}
                  </button>
                  <button className="adm-btn adm-btn-reject"
                    onClick={() => setShowRejectBox(r => !r)}>
                    ✕ Reject
                  </button>
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
    </div>
  );
}