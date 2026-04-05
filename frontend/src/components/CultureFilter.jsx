import React from "react";
import "./CultureFilter.css";

export default function CultureFilter({ cultures, cultureFilter, setCultureFilter }) {
  return (
    <aside className="cf-aside">
      <div className="cf-header">
        <span className="cf-label">Cultures</span>
      </div>

      <div className="cf-list">
        <button
          className={`cf-chip ${!cultureFilter ? "active" : ""}`}
          onClick={() => setCultureFilter("")}
        >
          <span className="cf-chip-dot" />
          All Cultures
        </button>

        {cultures.map((c) => (
          <button
            key={c.culture_id}
            className={`cf-chip ${cultureFilter === String(c.culture_id) ? "active" : ""}`}
            onClick={() =>
              setCultureFilter((prev) =>
                prev === String(c.culture_id) ? "" : String(c.culture_id)
              )
            }
          >
            <span className="cf-chip-dot" />
            {c.culture_name}
          </button>
        ))}
      </div>
    </aside>
  );
}