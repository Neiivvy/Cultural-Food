import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import NavBar from '../components/NavBar';
import FoodCard from '../components/FoodCard';
import FilterSidebar from '../components/FilterSidebar';
import { getFoodsByCulture } from '../data/dummyData';
import { ArrowLeft } from '../components/Icons';
import './CultureBasedFoodPage.css';

const CultureBasedFoodPage = () => {
  const { cultureName } = useParams();
  const [foods, setFoods] = useState([]);
  const [filters, setFilters] = useState({
    season: '',
    festival: '',
    taste: ''
  });

  useEffect(() => {
    const cultureFoods = getFoodsByCulture(cultureName);
    setFoods(cultureFoods);
  }, [cultureName]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  // Filter foods based on selected filters
  const filteredFoods = foods.filter(food => {
    if (filters.season && food.season !== filters.season && food.season !== 'All') {
      return false;
    }
    if (filters.festival && food.festival !== filters.festival) {
      return false;
    }
    return true;
  });

  const displayName = cultureName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <div className="culture-food-page">
      <NavBar />

      {/* Header */}
      <div className="page-header">
        <div className="page-header-container">
          <Link to="/" className="back-link">
            <ArrowLeft className="back-icon" />
            Back to Cultures
          </Link>
          <h1 className="page-title">{displayName} Cuisine</h1>
          <p className="page-description">
            Explore {filteredFoods.length} traditional dishes from the {displayName} culture
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

          {/* Food Grid */}
          <div className="content-main">
            {filteredFoods.length > 0 ? (
              <div className="food-grid">
                {filteredFoods.map((food) => (
                  <FoodCard
                    key={food.id}
                    id={food.id}
                    name={food.name}
                    culture={food.culture}
                    image={food.image}
                    description={food.description}
                    festival={food.festival}
                    season={food.season}
                  />
                ))}
              </div>
            ) : (
              <div className="no-results">
                <div className="no-results-icon">🍽️</div>
                <h3 className="no-results-title">No foods found</h3>
                <p className="no-results-text">
                  Try adjusting your filters or explore other cultures
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CultureBasedFoodPage;