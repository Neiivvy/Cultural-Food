import React, { useState } from 'react';
import NavBar from '../components/NavBar';
import CultureCard from '../components/CultureCard';
import FilterSidebar from '../components/FilterSidebar';
import { cultures } from '../data/dummyData';
import './HomePage.css';

const HomePage = () => {
  const [filters, setFilters] = useState({
    season: '',
    festival: '',
    taste: ''
  });

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="homepage">
      <NavBar />
      
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-container">
          <h1 className="hero-title">
            Discover Nepal's <span className="hero-highlight">Culinary Heritage</span>
          </h1>
          <p className="hero-description">
            Explore authentic foods from diverse Nepali cultures, festivals, and traditions.
            Preserve and celebrate our rich food heritage.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="content-wrapper">
          {/* Sidebar Filters */}
          <div className="sidebar-wrapper">
            <FilterSidebar onFilterChange={handleFilterChange} />
          </div>

          {/* Culture Grid */}
          <div className="content-main">
            <div className="section-header">
              <h2 className="section-title">Explore by Culture</h2>
              <p className="section-description">
                Select a culture to discover traditional foods and recipes
              </p>
            </div>

            <div className="culture-grid">
              {cultures.map((culture) => (
                <CultureCard
                  key={culture.id}
                  name={culture.name}
                  description={culture.description}
                  image={culture.image}
                  foodCount={culture.foodCount}
                />
              ))}
            </div>

            {/* Recommendation Algorithm Info */}
            {(filters.season || filters.festival || filters.taste) && (
              <div className="active-filters">
                <h3 className="active-filters-title">Active Filters</h3>
                <div className="filter-tags">
                  {filters.season && (
                    <span className="filter-tag">Season: {filters.season}</span>
                  )}
                  {filters.festival && (
                    <span className="filter-tag">Festival: {filters.festival}</span>
                  )}
                  {filters.taste && (
                    <span className="filter-tag">Taste: {filters.taste}</span>
                  )}
                </div>
                <p className="active-filters-note">
                  Foods matching your preferences will be highlighted when you explore cultures
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <p>Preserving Nepal's Cultural Food Heritage</p>
          <p className="footer-copyright">© 2024 Khana Sanskriti. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;