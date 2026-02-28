import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, User, MapPin, Search } from './Icons';
import './NavBar.css';

const NavBar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-content">
          {/* Logo */}
          <Link to="/" className="navbar-logo">
            <span className="logo-primary">Khana</span>
            <span className="logo-secondary">Sanskriti</span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="navbar-search desktop-search">
            <div className="search-wrapper">
              <input
                type="text"
                placeholder="Search for foods, festivals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <Search className="search-icon" />
            </div>
          </div>

          {/* Right Icons */}
          <div className="navbar-icons">
            <Link to="/" className="nav-icon">
              <Home className="icon" />
            </Link>
            <button className="nav-icon">
              <MapPin className="icon" />
            </button>
            <Link to="/login" className="nav-icon">
              <User className="icon" />
            </Link>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="navbar-search mobile-search">
          <div className="search-wrapper">
            <input
              type="text"
              placeholder="Search foods..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <Search className="search-icon" />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;