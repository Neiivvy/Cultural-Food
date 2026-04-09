import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer({ onAboutClick }) {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="footer-logo">
            <span className="footer-logo-k">Khana</span>
            <span className="footer-logo-s"> Sanskriti</span>
          </span>
          <p className="footer-tagline">
            Documenting Nepal's food heritage, one dish at a time.
          </p>
        </div>
        <div className="footer-links">
          <div className="footer-col">
            <p className="footer-col-title">Explore</p>
            <Link to="/foods?category=newari"          className="footer-link">Newari Foods</Link>
            <Link to="/foods?category=brahmin-chhetri" className="footer-link">Brahmin / Chhetri Foods</Link>
            <Link to="/foods?category=madhesi"         className="footer-link">Madhesi Foods</Link>
            <Link to="/foods?category=janajati"        className="footer-link">Janajati Foods</Link>
          </div>
          <div className="footer-col">
            <p className="footer-col-title">Community</p>
            <Link to="/homeUser"   className="footer-link">Community Feed</Link>
            <Link to="/contribute" className="footer-link">Contribute a Food</Link>
            <Link to="/signup"     className="footer-link">Join Us</Link>
          </div>
          <div className="footer-col">
            <p className="footer-col-title">Account</p>
            <Link to="/login"  className="footer-link">Login</Link>
            <Link to="/signup" className="footer-link">Sign Up</Link>
            {onAboutClick
              ? <a href="#about" className="footer-link" onClick={onAboutClick}>About</a>
              : <Link to="/#about" className="footer-link">About</Link>
            }
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p className="footer-copy">© {new Date().getFullYear()} Khana Sanskriti. Built with ♥ for Nepal.</p>
        <p className="footer-note">All food traditions belong to their communities.</p>
      </div>
    </footer>
  );
}