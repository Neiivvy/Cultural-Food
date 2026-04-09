import React, { useState, useRef, useEffect } from "react";
import { getAvatar } from "../utils/avatar";
import { addAnswer, getQuestions, deleteQuestion, updateQuestion } from "../api/questionService";
import "./QuestionCard.css";

/* ── Dots icon ── */
const DotsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="5"  r="1.5"/>
    <circle cx="12" cy="12" r="1.5"/>
    <circle cx="12" cy="19" r="1.5"/>
  </svg>
);

/* ── Three-dots dropdown ── */
function DotsMenu({ isOwner, onEdit, onDelete, onReport }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="qcard-dots-wrap" ref={ref}>
      <button
        className="qcard-dots-btn"
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        title="More options"
      >
        <DotsIcon />
      </button>
      {open && (
        <div className="qcard-dots-menu">
          {isOwner ? (
            <>
              <button className="qcard-dots-item" onClick={() => { setOpen(false); onEdit(); }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit question
              </button>
              <button className="qcard-dots-item qcard-dots-danger" onClick={() => { setOpen(false); onDelete(); }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
                Delete question
              </button>
            </>
          ) : (
            <button className="qcard-dots-item qcard-dots-report" onClick={() => { setOpen(false); onReport(); }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                <line x1="4" y1="22" x2="4" y2="15"/>
              </svg>
              Report question
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Answer dots menu (for own answers) ── */
function AnswerDotsMenu({ isOwner, onDelete, onReport }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="qcard-dots-wrap" ref={ref} style={{ marginLeft: "auto" }}>
      <button className="qcard-dots-btn qcard-dots-btn-sm" onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}>
        <DotsIcon />
      </button>
      {open && (
        <div className="qcard-dots-menu qcard-dots-menu-sm">
          {isOwner ? (
            <button className="qcard-dots-item qcard-dots-danger" onClick={() => { setOpen(false); onDelete(); }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
              Delete answer
            </button>
          ) : (
            <button className="qcard-dots-item qcard-dots-report" onClick={() => { setOpen(false); onReport(); }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                <line x1="4" y1="22" x2="4" y2="15"/>
              </svg>
              Report answer
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Report modal ── */
const REPORT_REASONS = [
  "Inappropriate or offensive content",
  "Spam or misleading information",
  "Incorrect cultural information",
  "Harassment or hate speech",
  "Other",
];

function ReportModal({ contentType, onSubmit, onCancel }) {
  const [selected, setSelected] = useState("");
  const [custom,   setCustom]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async () => {
    const reason = selected === "Other" ? custom.trim() : selected;
    if (!reason) { setErr("Please select or write a reason."); return; }
    setSubmitting(true); setErr("");
    try { await onSubmit(reason); }
    catch { setErr("Failed to submit. Please try again."); setSubmitting(false); }
  };

  return (
    <div className="qcard-overlay" onClick={onCancel}>
      <div className="qcard-report-modal" onClick={e => e.stopPropagation()}>
        <div className="qcard-report-header">
          <h3 className="qcard-report-title">Report {contentType}</h3>
          <button className="qcard-modal-close" onClick={onCancel}>✕</button>
        </div>
        <p className="qcard-report-sub">Why are you reporting this content?</p>
        {err && <p className="qcard-edit-err">{err}</p>}
        <div className="qcard-report-reasons">
          {REPORT_REASONS.map(r => (
            <button
              key={r}
              className={`qcard-report-reason ${selected === r ? "selected" : ""}`}
              onClick={() => { setSelected(r); setErr(""); }}
            >
              <span className="qcard-report-radio">{selected === r ? "●" : "○"}</span>
              {r}
            </button>
          ))}
        </div>
        {selected === "Other" && (
          <textarea
            className="qcard-report-custom"
            rows={3}
            placeholder="Describe the issue…"
            value={custom}
            onChange={e => setCustom(e.target.value)}
          />
        )}
        <div className="qcard-report-footer">
          <button className="qcard-modal-cancel" onClick={onCancel}>Cancel</button>
          <button className="qcard-report-submit" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit Report"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Delete confirm modal ── */
function DeleteModal({ contentType, onConfirm, onCancel }) {
  return (
    <div className="qcard-overlay" onClick={onCancel}>
      <div className="qcard-delete-modal" onClick={e => e.stopPropagation()}>
        <div className="qcard-delete-icon">🗑️</div>
        <h3 className="qcard-delete-title">Delete {contentType}?</h3>
        <p className="qcard-delete-body">This cannot be undone. Are you sure?</p>
        <div className="qcard-modal-btns">
          <button className="qcard-modal-cancel" onClick={onCancel}>Cancel</button>
          <button className="qcard-modal-confirm" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ── Edit question modal ── */
function EditQuestionModal({ question, onSave, onCancel }) {
  const [title, setTitle]   = useState(question.title || "");
  const [desc,  setDesc]    = useState(question.description || "");
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState("");

  const handleSave = async () => {
    if (!title.trim()) { setErr("Title is required."); return; }
    setSaving(true); setErr("");
    try {
      await updateQuestion(question.question_id, { title: title.trim(), description: desc.trim() });
      onSave({ ...question, title: title.trim(), description: desc.trim() });
    } catch {
      setErr("Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="qcard-overlay" onClick={onCancel}>
      <div className="qcard-edit-modal" onClick={e => e.stopPropagation()}>
        <div className="qcard-edit-header">
          <h3 className="qcard-edit-title">Edit Question</h3>
          <button className="qcard-modal-close" onClick={onCancel}>✕</button>
        </div>
        {err && <p className="qcard-edit-err">{err}</p>}
        <div className="qcard-edit-fields">
          <div className="qcard-edit-field">
            <label className="qcard-edit-label">Question title</label>
            <input className="qcard-edit-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" />
          </div>
          <div className="qcard-edit-field">
            <label className="qcard-edit-label">More details</label>
            <textarea className="qcard-edit-input qcard-edit-textarea" value={desc} onChange={e => setDesc(e.target.value)} rows={4} placeholder="Additional context…" />
          </div>
        </div>
        <div className="qcard-edit-footer">
          <button className="qcard-modal-cancel" onClick={onCancel}>Cancel</button>
          <button className="qcard-edit-save" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Report success toast ── */
function ReportToast({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="qcard-report-toast">
      🛡️ Report sent to admin. Thank you for keeping the community safe.
    </div>
  );
}

function AnswerText({ text }) {
  return (
    <p className="qcard-ans-text">
      {text.split(/(@\w[\w\s]*)/g).map((part, i) =>
        part.startsWith("@")
          ? <span key={i} className="qcard-mention">{part}</span>
          : part
      )}
    </p>
  );
}

/* ── Main QuestionCard ── */
export default function QuestionCard({ question: initialQ }) {
  const [q,           setQ]           = useState(initialQ);
  const [showAnswers, setShowAnswers] = useState(false);
  const [answers,     setAnswers]     = useState([]);
  const [loadingAns,  setLoadingAns]  = useState(false);
  const [answerCount, setAnswerCount] = useState(Number(initialQ.answers_count) || 0);
  const [newAnswer,   setNewAnswer]   = useState("");
  const [posting,     setPosting]     = useState(false);
  const [deleted,     setDeleted]     = useState(false);

  const [showDelete,   setShowDelete]   = useState(false);
  const [showEdit,     setShowEdit]     = useState(false);
  const [showReport,   setShowReport]   = useState(false);
  const [showToast,    setShowToast]    = useState(false);

  // For reporting an answer
  const [reportingAnswerId, setReportingAnswerId] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isOwner     = String(q.user_id) === String(currentUser.user_id);

  if (deleted) return null;

  const toggleAnswers = async () => {
    if (showAnswers) { setShowAnswers(false); return; }
    if (answers.length === 0) {
      setLoadingAns(true);
      try {
        const res   = await getQuestions();
        const found = (res.data.data.questions || []).find(
          item => String(item.question_id) === String(q.question_id)
        );
        setAnswers(found?.answers || []);
      } catch { /* silent */ }
      finally { setLoadingAns(false); }
    }
    setShowAnswers(true);
  };

  const submitAnswer = async (e) => {
    e.preventDefault();
    if (!newAnswer.trim() || posting) return;
    setPosting(true);
    try {
      const res      = await addAnswer(q.question_id, { answer_text: newAnswer.trim() });
      const a        = res.data.data.answer;
      const enriched = {
        ...a,
        author_name:     currentUser.name || "You",
        profile_picture: currentUser.profile_picture || null,
      };
      setAnswers(prev => [...prev, enriched]);
      setAnswerCount(n => n + 1);
      setNewAnswer("");
    } catch { /* silent */ }
    finally { setPosting(false); }
  };

  const handleDeleteQuestion = async () => {
    try {
      await deleteQuestion(q.question_id);
      setShowDelete(false);
      setDeleted(true);
    } catch { /* ignore */ }
  };

  const handleDeleteAnswer = async (answerId) => {
    try {
      const { deleteAnswer } = await import("../api/questionService");
      await deleteAnswer(answerId);
      setAnswers(prev => prev.filter(a => a.answer_id !== answerId));
      setAnswerCount(n => Math.max(0, n - 1));
    } catch { /* ignore */ }
  };

  const handleReport = async (reason) => {
    const { default: axiosInstance } = await import("../api/axiosInstance");
    await axiosInstance.post("/reports", {
      question_id: q.question_id,
      reason,
    });
    setShowReport(false);
    setShowToast(true);
  };

  const handleReportAnswer = async (reason) => {
    const { default: axiosInstance } = await import("../api/axiosInstance");
    await axiosInstance.post("/reports", {
      question_id: q.question_id,  // link to parent question
      reason: `Answer report: ${reason}`,
    });
    setReportingAnswerId(null);
    setShowToast(true);
  };

  const handleEditSave = (updated) => {
    setQ(updated);
    setShowEdit(false);
  };

  return (
    <>
      {showDelete && (
        <DeleteModal contentType="question" onConfirm={handleDeleteQuestion} onCancel={() => setShowDelete(false)} />
      )}
      {showEdit && (
        <EditQuestionModal question={q} onSave={handleEditSave} onCancel={() => setShowEdit(false)} />
      )}
      {showReport && (
        <ReportModal contentType="question" onSubmit={handleReport} onCancel={() => setShowReport(false)} />
      )}
      {reportingAnswerId && (
        <ReportModal contentType="answer" onSubmit={handleReportAnswer} onCancel={() => setReportingAnswerId(null)} />
      )}
      {showToast && <ReportToast onDone={() => setShowToast(false)} />}

      <article className="qcard">
        {/* ── Header ── */}
        <div className="qcard-header">
          <div className="qcard-author">
            <img
              src={getAvatar(q.profile_picture, q.author_name, 36)}
              alt={q.author_name}
              className="qcard-avatar"
            />
            <div>
              <span className="qcard-author-name">{q.author_name}</span>
              <span className="qcard-date">
                {new Date(q.created_at).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric",
                })}
              </span>
            </div>
          </div>

          <div className="qcard-header-right">
            {q.culture_name && <span className="qcard-culture">{q.culture_name}</span>}
            <span className="qcard-type-badge">❓ Question</span>
            <DotsMenu
              isOwner={isOwner}
              onEdit={() => setShowEdit(true)}
              onDelete={() => setShowDelete(true)}
              onReport={() => setShowReport(true)}
            />
          </div>
        </div>

        {/* ── Body ── */}
        <div className="qcard-body">
          <h3 className="qcard-title">{q.title}</h3>
          {q.description && <p className="qcard-desc">{q.description}</p>}
        </div>

        {/* ── Footer ── */}
        <div className="qcard-footer">
          <span className="qcard-stat">💬 {answerCount} {answerCount === 1 ? "answer" : "answers"}</span>
          <button
            className={`qcard-answer-btn ${showAnswers ? "active" : ""}`}
            onClick={toggleAnswers}
          >
            {showAnswers ? "Hide answers ↑" : "Answers →"}
          </button>
        </div>

        {/* ── Inline answers ── */}
        {showAnswers && (
          <div className="qcard-answers">
            <div className="qcard-answers-header">
              <span>Answers ({answerCount})</span>
            </div>

            {loadingAns && <p className="qcard-no-answers">Loading…</p>}

            {!loadingAns && answers.length === 0 && (
              <p className="qcard-no-answers">No answers yet — be the first!</p>
            )}

            {!loadingAns && answers.map((a, i) => {
              const isAnswerOwner = String(a.user_id) === String(currentUser.user_id);
              return (
                <div key={a.answer_id || i} className="qcard-answer-item">
                  <img
                    src={getAvatar(a.profile_picture, a.author_name, 28)}
                    alt={a.author_name}
                    className="qcard-ans-avatar"
                  />
                  <div className="qcard-ans-body">
                    <div className="qcard-ans-top">
                      <span className="qcard-ans-name">{a.author_name}</span>
                      <span className="qcard-ans-time">
                        {new Date(a.created_at).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </span>
                      <AnswerDotsMenu
                        isOwner={isAnswerOwner}
                        onDelete={() => handleDeleteAnswer(a.answer_id)}
                        onReport={() => setReportingAnswerId(a.answer_id)}
                      />
                    </div>
                    <AnswerText text={a.answer_text} />
                  </div>
                </div>
              );
            })}

            <form className="qcard-ans-form" onSubmit={submitAnswer}>
              <input
                type="text"
                value={newAnswer}
                onChange={e => setNewAnswer(e.target.value)}
                placeholder="Write an answer…"
                className="qcard-ans-input"
                disabled={posting}
              />
              <button type="submit" className="qcard-ans-submit" disabled={posting}>
                {posting ? "…" : "Post"}
              </button>
            </form>
          </div>
        )}
      </article>
    </>
  );
}