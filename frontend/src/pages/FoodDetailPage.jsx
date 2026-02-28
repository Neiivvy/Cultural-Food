import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';
import { getFoodById } from '../data/dummyData';
import { ArrowLeft, Clock, Users, Calendar } from '../components/Icons';
import './FoodDetailPage.css';

const FoodDetailPage = () => {
  const { foodId } = useParams();
  const navigate = useNavigate();
  const [food, setFood] = useState(null);

  useEffect(() => {
    const foodData = getFoodById(foodId);
    setFood(foodData);
  }, [foodId]);

  const handleBack = () => {
    navigate(-1);
  };

  if (!food) {
    return (
      <div className="food-detail-page">
        <NavBar />
        <div className="not-found">
          <h2 className="not-found-title">Food not found</h2>
          <button onClick={handleBack} className="not-found-button">
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="food-detail-page">
      <NavBar />

      <div className="detail-container">
        {/* Back Button */}
        <button onClick={handleBack} className="back-button">
          <ArrowLeft className="back-icon" />
          Back
        </button>

        {/* Hero Image */}
        <div className="hero-card">
          <div className="hero-image-wrapper">
            <img
              src={food.image}
              alt={food.name}
              loading="lazy"
              width="1200"
              height="600"
              className="hero-image"
            />
            <div className="hero-overlay"></div>
            <div className="hero-content">
              <h1 className="hero-title">{food.name}</h1>
              <p className="hero-subtitle">{food.culture} Cuisine</p>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="content-grid">
          {/* Main Content */}
          <div className="main-column">
            {/* Description */}
            <div className="content-card">
              <h2 className="card-title">About</h2>
              <p className="card-text">{food.description}</p>
            </div>

            {/* Ingredients */}
            {food.ingredients && (
              <div className="content-card">
                <h2 className="card-title">Ingredients</h2>
                <ul className="ingredients-list">
                  {food.ingredients.map((ingredient, index) => (
                    <li key={index} className="ingredient-item">
                      <span className="ingredient-bullet"></span>
                      {ingredient}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Preparation */}
            {food.preparation && (
              <div className="content-card">
                <h2 className="card-title">Preparation</h2>
                <p className="card-text">{food.preparation}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="sidebar-column">
            {/* Quick Info */}
            <div className="info-card">
              <h3 className="info-title">Quick Info</h3>
              <div className="info-items">
                <div className="info-item">
                  <Users className="info-icon" />
                  <div>
                    <p className="info-label">Culture</p>
                    <p className="info-value">{food.culture}</p>
                  </div>
                </div>

                {food.festival && (
                  <div className="info-item">
                    <Calendar className="info-icon" />
                    <div>
                      <p className="info-label">Festival</p>
                      <p className="info-value">{food.festival}</p>
                    </div>
                  </div>
                )}

                {food.season && (
                  <div className="info-item">
                    <Clock className="info-icon" />
                    <div>
                      <p className="info-label">Season</p>
                      <p className="info-value">{food.season}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Cultural Significance */}
            <div className="significance-card">
              <h3 className="significance-title">Cultural Significance</h3>
              <p className="significance-text">
                This dish holds special importance in {food.culture} culture and is often
                prepared during traditional celebrations and gatherings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodDetailPage;