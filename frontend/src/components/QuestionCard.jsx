import React, { useState } from "react";
import { getAvatar } from "../utils/avatar";
import { addAnswer, getQuestions } from "../api/questionService";
import "./QuestionCard.css";

export default function QuestionCard({ question: q }) {
  const [showAnswers, setShowAnswers] = useState(false);
  const [answers,     setAnswers]     = useState([]);
  const [loadingAns,  setLoadingAns]  = useState(false);
  const [answerCount, setAnswerCount] = useState(Number(q.answers_count) || 0);
  const [newAnswer,   setNewAnswer]   = useState("");
  const [posting,     setPosting]     = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

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

  return (
    <article className="qcard">
      {/* ── Header: avatar+name left | culture tag + ❓ badge right ── */}
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
          {q.culture_name && (
            <span className="qcard-culture">{q.culture_name}</span>
          )}
          <span className="qcard-type-badge">❓ Question</span>
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

          {!loadingAns && answers.map((a, i) => (
            <div key={a.answer_id || i} className="qcard-answer-item">
              <img
                src={getAvatar(a.profile_picture, a.author_name, 28)}
                alt={a.author_name}
                className="qcard-ans-avatar"
              />
              <div className="qcard-ans-body">
                <span className="qcard-ans-name">{a.author_name}</span>
                <p className="qcard-ans-text">{a.answer_text}</p>
                <span className="qcard-ans-time">
                  {new Date(a.created_at).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                </span>
              </div>
            </div>
          ))}

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
  );
}