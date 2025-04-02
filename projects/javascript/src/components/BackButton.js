import React from 'react';
import { useNavigate } from 'react-router-dom';

function BackButton() {
  const navigate = useNavigate();

  return (
    <a href="#" className="back-button" onClick={(e) => {
      e.preventDefault();
      navigate(-1);
    }}>
      <div className="icon-wrapper">
        {/* Placeholder for future gif icon */}
      </div>
      <span>back</span>
    </a>
  );
}

export default BackButton; 