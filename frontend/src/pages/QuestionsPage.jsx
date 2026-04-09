/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getQuestions, createQuestion } from "../api/questionService";
import useCultures from "../hooks/useCultures";
import CultureFilter from "../components/CultureFilter";
import QuestionCard from "../components/QuestionCard";
import "./QuestionsPage.css";

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
      setTimeout(() => setSuccessMsg(""), 2500);
    } catch (err) {
      setAskError(err.response?.data?.message || "Failed to post question.");
    } finally {
      setSubmitting(false);
    }
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

      {/* FIXED Ask Question button */}
      <button
        className="qpage-fixed-ask-btn"
        onClick={() => { setShowAskForm(s => !s); setAskError(""); }}
      >
        + Ask Question
      </button>

      {/* MAIN */}
      <main className="qpage-main">
        <div className="qpage-feed-area">

          {/* Static header */}
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

            {/* Use QuestionCard component — has three-dots, edit, delete, report built in */}
            {!loading && !error && displayed.map(q => (
              <QuestionCard key={q.question_id} question={q} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}