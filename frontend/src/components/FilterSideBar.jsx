import React, { useState } from 'react';
import { Filter } from './Icons';
import './FilterSidebar.css';

const FilterSidebar = ({ onFilterChange }) => {
  const [selectedSeason, setSelectedSeason] = useState('');
  const [selectedFestival, setSelectedFestival] = useState('');
  const [selectedTaste, setSelectedTaste] = useState('');

  const seasons = ['Spring', 'Summer', 'Autumn', 'Winter'];
  const festivals = ['Dashain', 'Tihar', 'Holi', 'Teej', 'Maghe Sankranti', 'Lhosar'];
  const tastes = ['Sweet', 'Spicy', 'Sour', 'Savory', 'Tangy'];

  const handleFilterChange = (type, value) => {
    if (type === 'season') setSelectedSeason(value);
    if (type === 'festival') setSelectedFestival(value);
    if (type === 'taste') setSelectedTaste(value);
    
    if (onFilterChange) {
      onFilterChange({ season: selectedSeason, festival: selectedFestival, taste: selectedTaste });
    }
  };

  const clearFilters = () => {
    setSelectedSeason('');
    setSelectedFestival('');
    setSelectedTaste('');
  };

  return (
    <div className="filter-sidebar">
      <div className="filter-header">
        <div className="filter-title-wrapper">
          <Filter className="filter-icon" />
          <h3 className="filter-title">Filters</h3>
        </div>
        <button onClick={clearFilters} className="clear-button">
          Clear
        </button>
      </div>

      {/* Season Filter */}
      <div className="filter-section">
        <h4 className="filter-section-title">Season</h4>
        <div className="filter-options">
          {seasons.map((season) => (
            <label key={season} className="filter-option">
              <input
                type="radio"
                name="season"
                value={season}
                checked={selectedSeason === season}
                onChange={(e) => handleFilterChange('season', e.target.value)}
                className="filter-radio"
              />
              <span className="filter-label">{season}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Festival Filter */}
      <div className="filter-section">
        <h4 className="filter-section-title">Festival</h4>
        <div className="filter-options">
          {festivals.map((festival) => (
            <label key={festival} className="filter-option">
              <input
                type="radio"
                name="festival"
                value={festival}
                checked={selectedFestival === festival}
                onChange={(e) => handleFilterChange('festival', e.target.value)}
                className="filter-radio"
              />
              <span className="filter-label">{festival}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Taste Filter */}
      <div className="filter-section">
        <h4 className="filter-section-title">Taste</h4>
        <div className="filter-options">
          {tastes.map((taste) => (
            <label key={taste} className="filter-option">
              <input
                type="radio"
                name="taste"
                value={taste}
                checked={selectedTaste === taste}
                onChange={(e) => handleFilterChange('taste', e.target.value)}
                className="filter-radio"
              />
              <span className="filter-label">{taste}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;