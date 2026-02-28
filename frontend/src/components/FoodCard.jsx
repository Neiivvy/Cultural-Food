import React from 'react';
import { useNavigate } from 'react-router-dom';
import './FoodCard.css';

const FoodCard = ({ id, name, culture, image, description, festival, season }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/food/${id}`);
  };

  return (
    <div onClick={handleClick} className="food-card">
      <div className="food-card-image-wrapper">
        <img
          src={image}
          alt={name}
          loading="lazy"
          width="400"
          height="300"
          className="food-card-image"
        />
      </div>
      <div className="food-card-body">
        <h3 className="food-card-title">{name}</h3>
        <p className="food-card-culture">{culture}</p>
        <p className="food-card-description">{description}</p>
        <div className="food-card-tags">
          {festival && (
            <span className="food-tag festival-tag">{festival}</span>
          )}
          {season && (
            <span className="food-tag season-tag">{season}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default FoodCard;