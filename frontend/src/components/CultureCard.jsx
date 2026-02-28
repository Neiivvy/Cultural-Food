import React from 'react';
import { useNavigate } from 'react-router-dom';
import './CultureCard.css';

const CultureCard = ({ name, description, image, foodCount }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/culture/${name.toLowerCase().replace(/\s+/g, '-')}`);
  };

  return (
    <div onClick={handleClick} className="culture-card">
      <div className="culture-card-image-wrapper">
        <img
          src={image}
          alt={name}
          loading="lazy"
          width="400"
          height="300"
          className="culture-card-image"
        />
        <div className="culture-card-overlay"></div>
        <div className="culture-card-content">
          <h3 className="culture-card-title">{name}</h3>
          <p className="culture-card-count">{foodCount} dishes</p>
        </div>
      </div>
      <div className="culture-card-description">
        <p>{description}</p>
      </div>
    </div>
  );
};

export default CultureCard;