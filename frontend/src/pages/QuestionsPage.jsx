import React, { useState, useEffect } from "react";
import { getQuestions, createQuestion, addAnswer, deleteQuestion, deleteAnswer } from "../api/questionService";
import useCultures from "../hooks/useCultures";
import { getAvatar } from "../utils/avatar";
import "./QuestionsPage.css";

export default function QuestionsPage() {
  const [questions,   setQuestions]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [showAskForm, setShowAskForm] = useState(false);

  // Ask form fields — match actual DB columns: title, description, culture_id
  const [askTitle,    setAskTitle]    = useState("");
  const [askDesc,     setAskDesc]     = useState("");
  const [askCulture,  setAskCulture]  = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [askError,    setAskError]    = useState("");

  const [answerText,  setAnswerText]  = useState({});  // { [questionId]: string }
  const [postingAns,  setPostingAns]  = useState(null);
  const [openAnswers, setOpenAnswers] = useState({});   // { [questionId]: bool }

  const { cultures }  = useCultures();
  const currentUser   = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => { loadQuestions(); }, []);

  const loadQuestions = async () => {
    setLoading(true);
    setError("");
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
    setSubmitting(true);
    setAskError("");
    try {
      const res = await createQuestion({
        title:       askTitle.trim(),
        description: askDesc.trim() || undefined,
        culture_id:  askCulture || undefined,
      });
      const newQ = res.data.data.question;
      // Enrich with author info from localStorage so it shows immediately
      setQuestions(prev => [{
        ...newQ,
        author_name:     currentUser.name || "You",
        profile_picture: currentUser.profile_picture || null,
        answers:         [],
        answers_count:   0,
      }, ...prev]);
      setAskTitle(""); setAskDesc(""); setAskCulture("");
      setShowAskForm(false);
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
      setQuestions(prev =>
        prev.map(q =>
          q.question_id === qId
            ? {
                ...q,
                answers: [...(q.answers || []), {
                  ...ans,
                  author_name:     currentUser.name || "You",
                  profile_picture: currentUser.profile_picture || null,
                }],
                answers_count: (Number(q.answers_count) || 0) + 1,
              }
            : q
        )
      );
      setAnswerText(t => ({ ...t, [qId]: "" }));
    } catch { /* ignore */ }
    finally { setPostingAns(null); }
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
      setQuestions(prev =>
        prev.map(q =>
          q.question_id === qId
            ? { ...q, answers: (q.answers || []).filter(a => a.answer_id !== aId) }
            : q
        )
      );
    } catch { /* ignore */ }
  };

  return (
    <div className="qpage">
      <div className="qpage-container">

        {/* Header */}
        <div className="qpage-header">
          <div>
            <h2 className="qpage-title">
              <img src="https://api.iconify.design/noto/speech-balloon.svg" alt="" width="26" height="26" />
              Community Q&amp;A
            </h2>
            <p className="qpage-sub">Ask questions and share knowledge about food cultures</p>
          </div>
          <button className="qpage-ask-btn" onClick={() => { setShowAskForm(s => !s); setAskError(""); }}>
            <img src="https://api.iconify.design/material-symbols/add.svg?color=%23fff" alt="" width="16" height="16" />
            Ask Question
          </button>
        </div>

        {/* Ask form */}
        {showAskForm && (
          <form className="qpage-ask-form" onSubmit={handleAsk}>
            {askError && <p className="qpage-ask-err">{askError}</p>}

            <input
              className="qpage-ask-input qpage-ask-input-single"
              value={askTitle}
              onChange={e => setAskTitle(e.target.value)}
              placeholder="Question title *"
              disabled={submitting}
            />

            <textarea
              className="qpage-ask-input"
              value={askDesc}
              onChange={e => setAskDesc(e.target.value)}
              placeholder="More details (optional)…"
              rows={3}
              disabled={submitting}
            />

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

            <div className="qpage-ask-actions">
              <button type="submit" className="qpage-ask-submit" disabled={submitting}>
                {submitting ? "Posting…" : "Post Question"}
              </button>
              <button type="button" className="qpage-ask-cancel"
                onClick={() => { setShowAskForm(false); setAskError(""); }}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Culture chips */}
        <div className="qpage-chips">
          <button className="qpage-chip active">All</button>
          {cultures.map(c => (
            <button key={c.culture_id} className="qpage-chip">{c.culture_name}</button>
          ))}
        </div>

        {/* States */}
        {loading && <div className="qpage-empty"><p>Loading…</p></div>}
        {!loading && error && <div className="qpage-empty"><p>{error}</p></div>}

        {/* Question list */}
        <div className="qpage-list">
          {!loading && !error && questions.length === 0 && (
            <div className="qpage-empty">
              <img src="https://api.iconify.design/noto/speech-balloon.svg" alt="" width="36" height="36" />
              <p>No questions yet. Be the first!</p>
            </div>
          )}

          {questions.map(q => {
            const isOwner   = q.user_id === currentUser.user_id;
            const isOpen    = openAnswers[q.question_id];

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

                {/* Title + description — matches actual DB columns */}
                <h3 className="qpage-q-title">{q.title}</h3>
                {q.description && <p className="qpage-q-desc">{q.description}</p>}

                {/* Footer */}
                <div className="qpage-footer">
                  <span className="qpage-stat">
                    <img src="https://api.iconify.design/material-symbols/chat-bubble-outline.svg?color=%239ca3af"
                      alt="" width="14" height="14" />
                    {(q.answers || []).length} answers
                  </span>
                  <button
                    className="qpage-answer-btn"
                    onClick={() => setOpenAnswers(o => ({ ...o, [q.question_id]: !o[q.question_id] }))}
                  >
                    {isOpen ? "Hide" : "Answer"}
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
                        />
                        <div className="qpage-ans-body">
                          <div className="qpage-ans-top">
                            <span className="qpage-ans-name">{a.author_name}</span>
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
                          <p className="qpage-ans-text">{a.answer_text}</p>
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
                        placeholder="Write your answer…"
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