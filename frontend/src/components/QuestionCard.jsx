import React from "react";
import { Link } from "react-router-dom";
import { getAvatar } from "../utils/avatar";
import "./QuestionCard.css";

export default function QuestionCard({ question: q }) {
  return (
    <article className="qcard">
      <div className="qcard-header">
        <div className="qcard-author">
          <img src={getAvatar(q.profile_picture, q.author_name, 36)} alt={q.author_name} className="qcard-avatar" />
          <div>
            <span className="qcard-author-name">{q.author_name}</span>
            <div className="qcard-meta">
              {q.culture_name && <span className="qcard-culture">{q.culture_name}</span>}
              <span className="qcard-date">
                {new Date(q.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>
        <span className="qcard-type-badge">❓ Question</span>
      </div>

      <div className="qcard-body">
        <Link to="/questions">
          <h3 className="qcard-title">{q.title}</h3>
        </Link>
        {q.description && <p className="qcard-desc">{q.description}</p>}
      </div>

      <div className="qcard-footer">
        <span className="qcard-stat">💬 {Number(q.answers_count) || 0} answers</span>
        <Link to="/questions" className="qcard-answer-btn">Answer →</Link>
      </div>
    </article>
  );
}