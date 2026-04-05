import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getQuestions, createQuestion, addAnswer, deleteQuestion, deleteAnswer } from "../api/questionService";
import useCultures from "../hooks/useCultures";
import CultureFilter from "../components/CultureFilter";
import { getAvatar } from "../utils/avatar";
import "./QuestionsPage.css";

const DESC_LIMIT = 200;

function AnswerText({ text }) {
  return (
    <p className="qpage-ans-text">
      {text.split(/(@\w[\w\s]*)/g).map((part, i) =>
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

  const [cultureFilter, setCultureFilter] = useState("");
  const [mobileCulture, setMobileCulture] = useState(false);

  const [answerText,  setAnswerText]  = useState({});
  const [postingAns,  setPostingAns]  = useState(null);
  const [openAnswers, setOpenAnswers] = useState({});
  const [expanded,    setExpanded]    = useState({});

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
      const newQ     = res.data.data.question;
      const enriched = {
        ...newQ,
        author_name:     currentUser.name            || "You",
        profile_picture: currentUser.profile_picture || null,
        culture_name:    cultures.find(c => String(c.culture_id) === String(askCulture))?.culture_name || null,
        answers:         [],
        answers_count:   0,
      };
      setQuestions(prev => [enriched, ...prev]);
      setAskTitle(""); setAskDesc(""); setAskCulture("");
      setShowAskForm(false);
      setSuccessMsg("Question published!");
      setTimeout(() => { setSuccessMsg(""); navigate("/homeUser"); }, 1800);
    } catch (err) {
      setAskError(err.response?.data?.message || "Failed to post question.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswer = async (qId) => {
    const text = answerText[qId]?.trim();
    if (!text || postingAns) return;
    setPostingAns(qId);
    try {
      const res = await addAnswer(qId, { answer_text: text });
      const ans = res.data.data.answer;
      setQuestions(prev => prev.map(q =>
        q.question_id === qId
          ? { ...q,
              answers: [...(q.answers || []), { ...ans,
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

  const mentionUser = (qId, name) =>
    setAnswerText(t => {
      const prev = (t[qId] || "").trimEnd();
      return { ...t, [qId]: prev ? `${prev} @${name} ` : `@${name} ` };
    });

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

  const displayed = cultureFilter
    ? questions.filter(q => String(q.culture_id) === cultureFilter)
    : questions;

  return (
    <div className="qpage">

      {/* LEFT: Culture filter sidebar */}
      <CultureFilter
        cultures={cultures}
        cultureFilter={cultureFilter}
        setCultureFilter={setCultureFilter}
      />

      {/* FIXED Ask Question button — top-right corner */}
      <button
        className="qpage-fixed-ask-btn"
        onClick={() => { setShowAskForm(s => !s); setAskError(""); }}
      >
        + Ask Question
      </button>

      {/* MAIN */}
      <main className="qpage-main">
        <div className="qpage-feed-area">

          {/* Static header — scrolls with page */}
          <div className="qpage-feed-header">
            <div className="qpage-feed-header-left">
              <button
                className="qpage-culture-toggle"
                onClick={() => setMobileCulture(true)}
              >
                🌏 Culture
                {cultureFilter && <span className="qpage-culture-dot" />}
              </button>
            </div>
            <div className="qpage-feed-header-text">
              <h1 className="qpage-header-title">Community Q&amp;A</h1>
              <p className="qpage-header-sub">Ask questions and share knowledge about food cultures</p>
            </div>
          </div>

          {/* Mobile culture drawer */}
          {mobileCulture && (
            <>
              <div className="qpage-mob-overlay" onClick={() => setMobileCulture(false)} />
              <div className="qpage-mob-drawer">
                <div className="qpage-mob-drawer-header">
                  <span>Filter by Culture</span>
                  <button onClick={() => setMobileCulture(false)}>✕</button>
                </div>
                <div className="qpage-mob-culture-list">
                  <button
                    className={`qpage-mob-chip ${!cultureFilter ? "active" : ""}`}
                    onClick={() => { setCultureFilter(""); setMobileCulture(false); }}
                  >All Cultures</button>
                  {cultures.map(c => (
                    <button
                      key={c.culture_id}
                      className={`qpage-mob-chip ${cultureFilter === String(c.culture_id) ? "active" : ""}`}
                      onClick={() => { setCultureFilter(String(c.culture_id)); setMobileCulture(false); }}
                    >{c.culture_name}</button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="qpage-feed">
            {successMsg && <div className="qpage-success-banner">✅ {successMsg}</div>}

            {/* Ask form */}
            {showAskForm && (
              <form className="qpage-ask-form" onSubmit={handleAsk}>
                {askError && <p className="qpage-ask-err">{askError}</p>}
                <div className="qpage-ask-field">
                  <label className="qpage-ask-label">Question title <span className="qpage-req">*</span></label>
                  <input
                    className="qpage-ask-input"
                    value={askTitle}
                    onChange={e => setAskTitle(e.target.value)}
                    placeholder="e.g. What makes Newari cuisine unique?"
                    disabled={submitting}
                  />
                </div>
                <div className="qpage-ask-field">
                  <label className="qpage-ask-label">More details <span className="qpage-ask-optional">(optional)</span></label>
                  <textarea
                    className="qpage-ask-input qpage-ask-textarea"
                    value={askDesc}
                    onChange={e => setAskDesc(e.target.value)}
                    placeholder="Add more context or background…"
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
                  <button type="button" className="qpage-ask-cancel"
                    onClick={() => { setShowAskForm(false); setAskError(""); }}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {loading && <div className="qpage-state"><div className="qpage-spinner" /></div>}
            {!loading && error && (
              <div className="qpage-state">
                <p className="qpage-state-msg">{error}</p>
                <button className="qpage-retry" onClick={loadQuestions}>Try again</button>
              </div>
            )}
            {!loading && !error && displayed.length === 0 && (
              <div className="qpage-state">
                <span className="qpage-state-icon">💬</span>
                <p className="qpage-state-msg">No questions yet. Be the first!</p>
              </div>
            )}

            {/* Question cards */}
            {!loading && !error && displayed.map(q => {
              const isOwner  = String(q.user_id) === String(currentUser.user_id);
              const isOpen   = openAnswers[q.question_id];
              const isExpand = expanded[q.question_id];
              const desc     = q.description || "";
              const isLong   = desc.length > DESC_LIMIT;
              const visDesc  = isLong && !isExpand ? desc.slice(0, DESC_LIMIT) + "…" : desc;

              return (
                <div key={q.question_id} className="qpage-card">
                  <div className="qpage-card-header">
                    <div className="qpage-author">
                      <img src={getAvatar(q.profile_picture, q.author_name, 34)} alt={q.author_name} className="qpage-avatar" />
                      <div>
                        <span className="qpage-author-name">{q.author_name}</span>
                        <span className="qpage-date">
                          {new Date(q.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                    <div className="qpage-card-header-right">
                      {q.culture_name && <span className="qpage-culture-tag">{q.culture_name}</span>}
                      {isOwner && (
                        <button className="qpage-delete-btn" onClick={() => handleDeleteQ(q.question_id)} title="Delete question">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="qpage-q-title">{q.title}</h3>

                  {desc && (
                    <div className="qpage-q-desc-wrap">
                      <p className="qpage-q-desc">{visDesc}</p>
                      {isLong && (
                        <button className="qpage-read-more"
                          onClick={() => setExpanded(x => ({ ...x, [q.question_id]: !x[q.question_id] }))}>
                          {isExpand ? "Show less" : "Read more"}
                        </button>
                      )}
                    </div>
                  )}

                  <div className="qpage-footer">
                    <span className="qpage-stat">
                      💬 {(q.answers || []).length} answer{(q.answers || []).length !== 1 ? "s" : ""}
                    </span>
                    <button className="qpage-answer-btn"
                      onClick={() => setOpenAnswers(o => ({ ...o, [q.question_id]: !o[q.question_id] }))}>
                      {isOpen ? "Hide ↑" : "Answers →"}
                    </button>
                  </div>

                  {isOpen && (
                    <div className="qpage-answers">
                      {(q.answers || []).length === 0 && (
                        <p className="qpage-no-answers">No answers yet — be the first!</p>
                      )}
                      {(q.answers || []).map(a => (
                        <div key={a.answer_id} className="qpage-answer-item">
                          <img src={getAvatar(a.profile_picture, a.author_name, 28)} alt={a.author_name}
                            className="qpage-ans-avatar" onClick={() => mentionUser(q.question_id, a.author_name)} style={{ cursor: "pointer" }} />
                          <div className="qpage-ans-body">
                            <div className="qpage-ans-top">
                              <span className="qpage-ans-name"
                                onClick={() => mentionUser(q.question_id, a.author_name)} style={{ cursor: "pointer" }}>
                                {a.author_name}
                              </span>
                              <span className="qpage-ans-time">{new Date(a.created_at).toLocaleDateString()}</span>
                              {String(a.user_id) === String(currentUser.user_id) && (
                                <button className="qpage-delete-btn qpage-delete-small"
                                  onClick={() => handleDeleteA(q.question_id, a.answer_id)}>✕</button>
                              )}
                            </div>
                            <AnswerText text={a.answer_text} />
                          </div>
                        </div>
                      ))}
                      <div className="qpage-ans-form">
                        <input type="text" className="qpage-ans-input"
                          value={answerText[q.question_id] || ""}
                          onChange={e => setAnswerText(t => ({ ...t, [q.question_id]: e.target.value }))}
                          placeholder="Write your answer…"
                          disabled={postingAns === q.question_id}
                          onKeyDown={e => e.key === "Enter" && handleAnswer(q.question_id)}
                        />
                        <button className="qpage-ans-submit"
                          onClick={() => handleAnswer(q.question_id)}
                          disabled={postingAns === q.question_id}>
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
      </main>
    </div>
  );
}