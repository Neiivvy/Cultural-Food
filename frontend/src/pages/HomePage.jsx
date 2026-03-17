import React, { useRef, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import NavBar from '../components/NavBar';
import './HomePage.css';
/* eslint-disable no-unused-vars */
export default function HomePage() {
  const navigate   = useNavigate();
  const aboutRef   = useRef(null);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const scrollToAbout = (e) => {
    e.preventDefault();
    aboutRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="hp">
      <NavBar onAboutClick={scrollToAbout} />

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section className={`hp-hero ${heroVisible ? 'visible' : ''}`}>
        <div className="hp-hero-bg">
          <div className="hp-hero-grain" />
          <div className="hp-hero-blob hp-hero-blob-1" />
          <div className="hp-hero-blob hp-hero-blob-2" />
        </div>
        <div className="hp-hero-inner">
          <div className="hp-hero-text">
            <span className="hp-hero-eyebrow">Nepal's Cultural Food Archive</span>
            <h1 className="hp-hero-title">
              Discover the<br />
              <span className="hp-hero-title-accent">Flavours of</span><br />
              Nepal
            </h1>
            <p className="hp-hero-sub">
              Explore traditional dishes from Newari, Brahmin/Chhetri, Madhesi, and
              Janajati communities — each dish a window into Nepal's living culture.
            </p>
            <div className="hp-hero-actions">
              <button
                className="hp-btn-primary"
                onClick={() => aboutRef.current?.scrollIntoView({ behavior: 'smooth' })}
              >
                Explore Foods
              </button>
              <Link to="/contribute" className="hp-btn-ghost">
                Contribute a Dish →
              </Link>
            </div>
          </div>

          {/* Mosaic */}
          <div className="hp-hero-mosaic">
            {[
              { name: 'Yomari',    culture: 'Newari',           image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&q=80' },
              { name: 'Momos',     culture: 'Sherpa · Janajati', image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500&q=80' },
              { name: 'Dal Bhat',  culture: 'Brahmin/Chhetri',  image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&q=80' },
              { name: 'Sel Roti',  culture: 'Brahmin/Chhetri',  image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&q=80' },
            ].map((f, i) => (
              <div key={i} className={`hp-mosaic-card hp-mosaic-card-${i + 1}`}>
                <img src={f.image} alt={f.name} className="hp-mosaic-img" />
                <div className="hp-mosaic-label">
                  <span className="hp-mosaic-name">{f.name}</span>
                  <span className="hp-mosaic-culture">{f.culture}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="hp-hero-scroll"
          onClick={() => aboutRef.current?.scrollIntoView({ behavior: 'smooth' })}
        >
          <span>Scroll to explore</span>
          <div className="hp-scroll-line" />
        </div>
      </section>

      {/* ══ ABOUT ═════════════════════════════════════════════════ */}
      <section className="hp-about" ref={aboutRef} id="about">
        <div className="hp-about-inner">
          <div className="hp-about-text">
            <span className="hp-section-eyebrow">About the project</span>
            <h2 className="hp-about-title">What is Khana Sanskriti?</h2>
            <p className="hp-about-body">
              <strong>Khana Sanskriti</strong> — meaning <em>Food Culture</em> — is a community-powered
              archive dedicated to documenting the traditional foods of Nepal's diverse ethnic communities.
            </p>
            <p className="hp-about-body">
              Nepal is home to over 125 ethnic groups, each with their own food traditions shaped by
              geography, festivals, seasons, and centuries of history. Many of these foods are disappearing
              as younger generations move to cities and traditional knowledge fades.
            </p>
            <p className="hp-about-body">
              Our mission is simple — document every traditional Nepali dish, who makes it, when it is eaten,
              and why it matters. Every dish submitted, every recipe shared, every question answered brings us
              closer to a complete record of Nepal's food heritage.
            </p>
            <div className="hp-about-actions">
              <Link to="/contribute" className="hp-btn-primary">Contribute a Food</Link>
              <Link to="/signup"     className="hp-btn-ghost">Join the Community</Link>
            </div>
          </div>

          <div className="hp-about-cards">
            <Link to="/signup" className="hp-action-card">
              <span className="hp-action-icon">🤝</span>
              <h3 className="hp-action-title">Join the Community</h3>
              <p className="hp-action-desc">Interact with others, share recipes, ask questions, and be part of Nepal's food archive.</p>
              <span className="hp-action-arrow">→</span>
            </Link>
            <Link to="/contribute" className="hp-action-card">
              <span className="hp-action-icon">✦</span>
              <h3 className="hp-action-title">Contribute a Food</h3>
              <p className="hp-action-desc">Submit a traditional dish from your community — help us document Nepal's culinary heritage.</p>
              <span className="hp-action-arrow">→</span>
            </Link>
            <Link to="/category/newari" className="hp-action-card">
              <span className="hp-action-icon">🍱</span>
              <h3 className="hp-action-title">Explore Foods by Culture</h3>
              <p className="hp-action-desc">Browse traditional dishes from Newari, Brahmin/Chhetri, Madhesi, and Janajati communities.</p>
              <span className="hp-action-arrow">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════════ */}
      <footer className="hp-footer">
        <div className="hp-footer-inner">
          <div className="hp-footer-brand">
            <span className="hp-footer-logo">
              <span className="hp-footer-logo-k">Khana</span>
              <span className="hp-footer-logo-s"> Sanskriti</span>
            </span>
            <p className="hp-footer-tagline">
              Documenting Nepal's food heritage, one dish at a time.
            </p>
          </div>
          <div className="hp-footer-links">
            <div className="hp-footer-col">
              <p className="hp-footer-col-title">Explore</p>
              <Link to="/category/newari"          className="hp-footer-link">Newari Foods</Link>
              <Link to="/category/brahmin-chhetri" className="hp-footer-link">Brahmin / Chhetri Foods</Link>
              <Link to="/category/madhesi"         className="hp-footer-link">Madhesi Foods</Link>
              <Link to="/category/janajati"        className="hp-footer-link">Janajati Foods</Link>
            </div>
            <div className="hp-footer-col">
              <p className="hp-footer-col-title">Community</p>
              <Link to="/homeUser"   className="hp-footer-link">Community Feed</Link>
              <Link to="/contribute" className="hp-footer-link">Contribute a Food</Link>
              <Link to="/signup"     className="hp-footer-link">Join Us</Link>
            </div>
            <div className="hp-footer-col">
              <p className="hp-footer-col-title">Account</p>
              <Link to="/login"  className="hp-footer-link">Login</Link>
              <Link to="/signup" className="hp-footer-link">Sign Up</Link>
              <a href="#about" className="hp-footer-link" onClick={scrollToAbout}>About</a>
            </div>
          </div>
        </div>
        <div className="hp-footer-bottom">
          <p className="hp-footer-copy">© {new Date().getFullYear()} Khana Sanskriti. Built with ♥ for Nepal.</p>
          <p className="hp-footer-note">All food traditions belong to their communities.</p>
        </div>
      </footer>
    </div>
  );
}