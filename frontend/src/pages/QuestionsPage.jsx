import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { dummyQuestions, CULTURE_TAGS } from '../data/dummyDataPost';
import './QuestionsPage.css';

export default function QuestionsPage() {
  const [cultureFilter, setCultureFilter] = useState('');

  const filtered = dummyQuestions.filter(
    q => !cultureFilter || q.culture === cultureFilter
  );

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
          <Link to="/add" className="qpage-ask-btn">
            <img src="https://api.iconify.design/material-symbols/add.svg?color=%23fff" alt="" width="16" height="16" />
            Ask Question
          </Link>
        </div>

        {/* Culture chips */}
        <div className="qpage-chips">
          <button className={`qpage-chip ${!cultureFilter ? 'active' : ''}`} onClick={() => setCultureFilter('')}>
            All
          </button>
          {CULTURE_TAGS.map(t => (
            <button
              key={t}
              className={`qpage-chip ${cultureFilter === t ? 'active' : ''}`}
              onClick={() => setCultureFilter(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Questions list */}
        <div className="qpage-list">
          {filtered.length === 0
            ? (
              <div className="qpage-empty">
                <img src="https://api.iconify.design/noto/speech-balloon.svg" alt="" width="36" height="36" />
                <p>No questions yet for this culture. Be the first!</p>
              </div>
            )
            : filtered.map(q => (
              <div key={q.id} className="qpage-card">
                <div className="qpage-card-header">
                  <div className="qpage-author">
                    <img src={q.author.avatar} alt={q.author.name} className="qpage-avatar" />
                    <div>
                      <span className="qpage-author-name">{q.author.name}</span>
                      <span className="qpage-date">{q.createdAt}</span>
                    </div>
                  </div>
                  <span className="qpage-culture-chip">{q.culture}</span>
                </div>

                <h3 className="qpage-q-title">{q.title}</h3>
                <p className="qpage-q-desc">{q.description}</p>

                <div className="qpage-footer">
                  <span className="qpage-stat">
                    <img src="https://api.iconify.design/material-symbols/chat-bubble-outline.svg?color=%239ca3af" alt="" width="14" height="14" />
                    {q.answers} answers
                  </span>
                  <span className="qpage-stat">
                    <img src="https://api.iconify.design/material-symbols/favorite-outline.svg?color=%239ca3af" alt="" width="14" height="14" />
                    {q.likes}
                  </span>
                  <button className="qpage-answer-btn">Answer</button>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}