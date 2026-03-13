import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getQuestions, createQuestion, addAnswer, deleteQuestion, deleteAnswer } from "../api/questionService";
import useCultures from "../hooks/useCultures";
import { getAvatar } from "../utils/avatar";
import "./QuestionsPage.css";

const DESC_LIMIT = 200;

// Render answer text with @mention highlights
function AnswerText({ text }) {
  const parts = text.split(/(@\w[\w\s]*)/g);
  return (
    <p className="qpage-ans-text">
      {parts.map((part, i) =>
        part.startsWith("@")
          ? <span key={i} className="qpage-mention">{part}</span>
          : part
      )}
    </p>
  );
}

export default function QuestionsPage() {
  const navigate = useNavigate();

  const [questions,   setQuestions]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [showAskForm, setShowAskForm] = useState(false);
  const [successMsg,  setSuccessMsg]  = useState("");

  const [askTitle,   setAskTitle]   = useState("");
  const [askDesc,    setAskDesc]    = useState("");
  const [askCulture, setAskCulture] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [askError,   setAskError]   = useState("");

  // Culture filter chip
  const [cultureFilter, setCultureFilter] = useState("");

  // Per-card state
  const [answerText,  setAnswerText]  = useState({});   // { [qId]: string }
  const [postingAns,  setPostingAns]  = useState(null);
  const [openAnswers, setOpenAnswers] = useState({});   // { [qId]: bool }
  const [expanded,    setExpanded]    = useState({});   // { [qId]: bool } for description

  const { cultures } = useCultures();
  const currentUser  = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => { loadQuestions(); }, []);

  const loadQuestions = async () => {
    setLoading(true); setError("");
    try {
      const res = await getQuestions();
      setQuestions(res.data.data.questions || []);
    } catch {
      setError("Could not load questions.");
    } finally {
      setLoading(false);
    }
  };

  // ── Post question ─────────────────────────────────────────────
  const handleAsk = async (e) => {
    e.preventDefault();
    if (!askTitle.trim()) { setAskError("Title is required."); return; }
    setSubmitting(true); setAskError("");
    try {
      const res = await createQuestion({
        title:       askTitle.trim(),
        description: askDesc.trim() || undefined,
        culture_id:  askCulture || undefined,
      });
      const newQ = res.data.data.question;
      const enriched = {
        ...newQ,
        author_name:     currentUser.name            || "You",
        profile_picture: currentUser.profile_picture || null,
        culture_name:    cultures.find(c => String(c.culture_id) === String(askCulture))?.culture_name || null,
        answers:         [],
        answers_count:   0,
      };

      // Prepend to list so it's immediately visible
      setQuestions(prev => [enriched, ...prev]);

      // Reset form
      setAskTitle(""); setAskDesc(""); setAskCulture("");
      setShowAskForm(false);

      // Show success banner briefly, then navigate home
      setSuccessMsg("Question published successfully!");
      setTimeout(() => {
        setSuccessMsg("");
        navigate("/homeUser");
      }, 1800);
    } catch (err) {
      setAskError(err.response?.data?.message || "Failed to post question.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Answer ────────────────────────────────────────────────────
  const handleAnswer = async (qId) => {
    const text = answerText[qId]?.trim();
    if (!text || postingAns) return;
    setPostingAns(qId);
    try {
      const res = await addAnswer(qId, { answer_text: text });
      const ans = res.data.data.answer;
      setQuestions(prev => prev.map(q =>
        q.question_id === qId
          ? {
              ...q,
              answers: [...(q.answers || []), {
                ...ans,
                author_name:     currentUser.name            || "You",
                profile_picture: currentUser.profile_picture || null,
              }],
              answers_count: (Number(q.answers_count) || 0) + 1,
            }
          : q
      ));
      setAnswerText(t => ({ ...t, [qId]: "" }));
    } catch { /* ignore */ }
    finally { setPostingAns(null); }
  };

  // Insert @mention into answer input
  const mentionUser = (qId, name) => {
    setAnswerText(t => {
      const prev = (t[qId] || "").trimEnd();
      return { ...t, [qId]: prev ? `${prev} @${name} ` : `@${name} ` };
    });
  };

  const handleDeleteQ = async (qId) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      await deleteQuestion(qId);
      setQuestions(prev => prev.filter(q => q.question_id !== qId));
    } catch { /* ignore */ }
  };

  const handleDeleteA = async (qId, aId) => {
    if (!window.confirm("Delete this answer?")) return;
    try {
      await deleteAnswer(aId);
      setQuestions(prev => prev.map(q =>
        q.question_id === qId
          ? { ...q, answers: (q.answers || []).filter(a => a.answer_id !== aId) }
          : q
      ));
    } catch { /* ignore */ }
  };

  // ── Filtered list ─────────────────────────────────────────────
  const displayed = cultureFilter
    ? questions.filter(q => String(q.culture_id) === cultureFilter)
    : questions;

  return (
    <div className="qpage">
      <div className="qpage-container">

        {/* Success banner */}
        {successMsg && (
          <div className="qpage-success-banner">
            ✅ {successMsg}
          </div>
        )}

        {/* Header */}
        <div className="qpage-header">
          <div>
            <h2 className="qpage-title">
              <img src="https://api.iconify.design/noto/speech-balloon.svg" alt="" width="26" height="26" />
              Community Q&amp;A
            </h2>
            <p className="qpage-sub">Ask questions and share knowledge about food cultures</p>
          </div>
          <button
            className="qpage-ask-btn"
            onClick={() => { setShowAskForm(s => !s); setAskError(""); }}
          >
            <img src="https://api.iconify.design/material-symbols/add.svg?color=%23fff" alt="" width="16" height="16" />
            Ask Question
          </button>
        </div>

        {/* Ask form */}
        {showAskForm && (
          <form className="qpage-ask-form" onSubmit={handleAsk}>
            {askError && <p className="qpage-ask-err">{askError}</p>}

            <div className="qpage-ask-field">
              <label className="qpage-ask-label">Question title <span className="qpage-req">*</span></label>
              <input
                className="qpage-ask-input qpage-ask-input-single"
                value={askTitle}
                onChange={e => setAskTitle(e.target.value)}
                placeholder="e.g. What makes Newari cuisine unique?"
                disabled={submitting}
              />
            </div>

            <div className="qpage-ask-field">
              <label className="qpage-ask-label">More details <span className="qpage-ask-optional">(optional)</span></label>
              <textarea
                className="qpage-ask-input"
                value={askDesc}
                onChange={e => setAskDesc(e.target.value)}
                placeholder="Add more context, background, or details about your question…"
                disabled={submitting}
              />
            </div>

            <div className="qpage-ask-field">
              <label className="qpage-ask-label">Culture tag <span className="qpage-ask-optional">(optional)</span></label>
              <select
                className="qpage-ask-input qpage-ask-select"
                value={askCulture}
                onChange={e => setAskCulture(e.target.value)}
                disabled={submitting}
              >
                <option value="">All cultures</option>
                {cultures.map(c => (
                  <option key={c.culture_id} value={c.culture_id}>{c.culture_name}</option>
                ))}
              </select>
            </div>

            <div className="qpage-ask-actions">
              <button type="submit" className="qpage-ask-submit" disabled={submitting}>
                {submitting ? "Publishing…" : "Publish Question"}
              </button>
              <button
                type="button"
                className="qpage-ask-cancel"
                onClick={() => { setShowAskForm(false); setAskError(""); }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Culture filter chips */}
        <div className="qpage-chips">
          <button
            className={`qpage-chip ${!cultureFilter ? "active" : ""}`}
            onClick={() => setCultureFilter("")}
          >All</button>
          {cultures.map(c => (
            <button
              key={c.culture_id}
              className={`qpage-chip ${cultureFilter === String(c.culture_id) ? "active" : ""}`}
              onClick={() => setCultureFilter(String(c.culture_id))}
            >
              {c.culture_name}
            </button>
          ))}
        </div>

        {/* States */}
        {loading && <div className="qpage-empty"><p>Loading…</p></div>}
        {!loading && error && <div className="qpage-empty"><p>{error}</p></div>}

        {/* Question list */}
        <div className="qpage-list">
          {!loading && !error && displayed.length === 0 && (
            <div className="qpage-empty">
              <img src="https://api.iconify.design/noto/speech-balloon.svg" alt="" width="36" height="36" />
              <p>No questions yet. Be the first!</p>
            </div>
          )}

          {displayed.map(q => {
            const isOwner  = q.user_id === currentUser.user_id;
            const isOpen   = openAnswers[q.question_id];
            const isExpand = expanded[q.question_id];
            const desc     = q.description || "";
            const isLong   = desc.length > DESC_LIMIT;
            const visDesc  = isLong && !isExpand ? desc.slice(0, DESC_LIMIT) + "…" : desc;

            return (
              <div key={q.question_id} className="qpage-card">

                {/* Card header */}
                <div className="qpage-card-header">
                  <div className="qpage-author">
                    <img
                      src={getAvatar(q.profile_picture, q.author_name, 34)}
                      alt={q.author_name}
                      className="qpage-avatar"
                    />
                    <div>
                      <span className="qpage-author-name">{q.author_name}</span>
                      <span className="qpage-date">
                        {new Date(q.created_at).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {q.culture_name && (
                      <span className="qpage-culture-tag">{q.culture_name}</span>
                    )}
                    {isOwner && (
                      <button className="qpage-delete-btn" onClick={() => handleDeleteQ(q.question_id)}>✕</button>
                    )}
                  </div>
                </div>

                {/* Title — always fully visible */}
                <h3 className="qpage-q-title">{q.title}</h3>

                {/* Description — full text, read-more only if very long */}
                {desc && (
                  <div className="qpage-q-desc-wrap">
                    <p className="qpage-q-desc">{visDesc}</p>
                    {isLong && (
                      <button
                        className="qpage-read-more"
                        onClick={() => setExpanded(x => ({ ...x, [q.question_id]: !x[q.question_id] }))}
                      >
                        {isExpand ? "Show less" : "Read more"}
                      </button>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="qpage-footer">
                  <span className="qpage-stat">
                    <img src="https://api.iconify.design/material-symbols/chat-bubble-outline.svg?color=%239ca3af"
                      alt="" width="14" height="14" />
                    {(q.answers || []).length} answer{(q.answers || []).length !== 1 ? "s" : ""}
                  </span>
                  <button
                    className="qpage-answer-btn"
                    onClick={() => setOpenAnswers(o => ({ ...o, [q.question_id]: !o[q.question_id] }))}
                  >
                    {isOpen ? "Hide" : "Answer / View"}
                  </button>
                </div>

                {/* Answers section */}
                {isOpen && (
                  <div className="qpage-answers">
                    {(q.answers || []).length === 0 && (
                      <p className="qpage-no-answers">No answers yet.</p>
                    )}

                    {(q.answers || []).map(a => (
                      <div key={a.answer_id} className="qpage-answer-item">
                        <img
                          src={getAvatar(a.profile_picture, a.author_name, 28)}
                          alt={a.author_name}
                          className="qpage-ans-avatar"
                          title={`Mention @${a.author_name}`}
                          onClick={() => mentionUser(q.question_id, a.author_name)}
                          style={{ cursor: "pointer" }}
                        />
                        <div className="qpage-ans-body">
                          <div className="qpage-ans-top">
                            <span
                              className="qpage-ans-name"
                              title="Click to mention"
                              onClick={() => mentionUser(q.question_id, a.author_name)}
                              style={{ cursor: "pointer" }}
                            >
                              {a.author_name}
                            </span>
                            <span className="qpage-ans-time">
                              {new Date(a.created_at).toLocaleDateString()}
                            </span>
                            {a.user_id === currentUser.user_id && (
                              <button
                                className="qpage-delete-btn qpage-delete-small"
                                onClick={() => handleDeleteA(q.question_id, a.answer_id)}
                              >✕</button>
                            )}
                          </div>
                          <AnswerText text={a.answer_text} />
                        </div>
                      </div>
                    ))}

                    {/* Answer input */}
                    <div className="qpage-ans-form">
                      <input
                        type="text"
                        className="qpage-ans-input"
                        value={answerText[q.question_id] || ""}
                        onChange={e => setAnswerText(t => ({ ...t, [q.question_id]: e.target.value }))}
                        placeholder="Write your answer… (click a name to @mention)"
                        disabled={postingAns === q.question_id}
                        onKeyDown={e => e.key === "Enter" && handleAnswer(q.question_id)}
                      />
                      <button
                        className="qpage-ans-submit"
                        onClick={() => handleAnswer(q.question_id)}
                        disabled={postingAns === q.question_id}
                      >
                        {postingAns === q.question_id ? "…" : "Post"}
                      </button>
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}