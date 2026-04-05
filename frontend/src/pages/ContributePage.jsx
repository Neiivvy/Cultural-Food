import React from "react";
import { useNavigate } from "react-router-dom";
import PublicNavBar from "../components/NavBar";
import "./ContributePage.css";

const WHY_CARDS = [
  { title: "Preserve Heritage", desc: "Many traditional foods are disappearing. Documenting them keeps culture alive for future generations." },
  { title: "Share Knowledge",    desc: "You may know a dish that no one else has documented. Your submission could be someone's discovery." },
  { title: "Build a Resource",   desc: "Together we're building Nepal's most complete cultural food archive — one dish at a time." },
];

const STEPS = [
  { n: "1", label: "Fill the form",       desc: "Name, culture, taste, season, festival, description and an optional photo." },
  { n: "2", label: "Submit for review",   desc: "Our admins review every submission to ensure accuracy and quality." },
  { n: "3", label: "Goes live",           desc: "Once approved, the food appears in the discovery section for everyone to explore." },
];

export default function ContributePage() {
  const navigate = useNavigate();
  const isLoggedIn = !!(localStorage.getItem("token") && localStorage.getItem("user"));

  const handleContributeClick = () => {
    if (isLoggedIn) {
      navigate("/contribute/form");
    } else {
      // Save redirect target so after login they land on the form
      sessionStorage.setItem("redirectAfterAuth", "/contribute/form");
      navigate("/login");
    }
  };

  return (
    <>
      <PublicNavBar />
      <div className="contrib-page">

        {/* ── Hero ── */}
        <section className="contrib-hero">
          <div className="contrib-hero-inner">
            <span className="contrib-hero-tag">Community-Powered Archive</span>
            <h1 className="contrib-hero-title">
              Help Us Map Nepal's<br />
              <span className="contrib-hero-accent">Cultural Foods</span>
            </h1>
            <p className="contrib-hero-sub">
              Khana Sanskriti is built by the community, for the community. 
              Every dish you submit enriches our shared understanding of Nepal's 
              incredibly diverse food culture — from Newari feasts to Tharu harvests.
            </p>
            <button className="contrib-cta-btn" onClick={handleContributeClick}>
              <span className="contrib-cta-icon">✦</span>
              Contribute a Food
            </button>
            {!isLoggedIn && (
              <p className="contrib-login-hint">
                You'll be asked to log in or sign up — it only takes a minute.
              </p>
            )}
          </div>

          {/* Decorative food grid */}
          {/* <div className="contrib-hero-visual">
            {["🍱","🫕","🍲","🥘","🍜","🫓","🥗","🍛","🧆"].map((e, i) => (
              <div key={i} className="contrib-food-bubble" style={{ animationDelay: `${i * 0.15}s` }}>{e}</div>
            ))}
          </div> */}
        </section>

        {/* ── Why contribute ── */}
        <section className="contrib-section">
          <h2 className="contrib-section-title">Why Contribute?</h2>
          <div className="contrib-why-grid">
            {WHY_CARDS.map(c => (
              <div key={c.title} className="contrib-why-card">
                <span className="contrib-why-icon">{c.icon}</span>
                <h3 className="contrib-why-title">{c.title}</h3>
                <p  className="contrib-why-desc">{c.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="contrib-section contrib-section-alt">
          <h2 className="contrib-section-title">How It Works</h2>
          <div className="contrib-steps">
            {STEPS.map((s, i) => (
              <React.Fragment key={s.n}>
                <div className="contrib-step">
                  <div className="contrib-step-num">{s.n}</div>
                  <h3 className="contrib-step-label">{s.label}</h3>
                  <p  className="contrib-step-desc">{s.desc}</p>
                </div>
                {i < STEPS.length - 1 && <div className="contrib-step-arrow">→</div>}
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* ── What to include ── */}
        <section className="contrib-section">
          <h2 className="contrib-section-title">What You'll Fill In</h2>
          <div className="contrib-fields-grid">
            {[
              ["Food Name",        "The authentic name in Nepali or local language."],
              ["Culture / Ethnicity","Which community is this food from?"],
              ["Location",          "Region or district where it's common."],
              ["Festival",          "Is it tied to a celebration? (e.g. Dashain, Tihar)"],
              ["Season",            "When is it traditionally eaten?"],
              ["Taste Profile",     "Sweet, Spicy, Sour, Salty, Umami or Mixed."],
              ["Description",       "Tell the story of the food — ingredients, preparation, significance."],
              ["Photo (optional)",  "A clear image goes a long way in the archive."],
            ].map(([ label, hint]) => (
              <div key={label} className="contrib-field-chip">

                <div>
                  <p className="contrib-field-label">{label}</p>
                  <p className="contrib-field-hint">{hint}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section className="contrib-bottom-cta">
          <h2 className="contrib-bottom-title">Ready to Share a Dish?</h2>
          <p className="contrib-bottom-sub">Your knowledge is priceless. Let's document it together.</p>
          <button className="contrib-cta-btn contrib-cta-lg" onClick={handleContributeClick}>
            <span className="contrib-cta-icon">✦</span>
            Contribute a Food
          </button>
        </section>

      </div>
    </>
  );
}