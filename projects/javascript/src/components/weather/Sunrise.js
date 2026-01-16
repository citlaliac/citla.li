import React from 'react';
import './Sunrise.css';

/**
 * Sunrise Widget
 * Shows sun over horizon
 */
function Sunrise({ time }) {
  return (
    <div className="weather-sunrise">
      <div className="weather-sunrise-scene">
        <div className="weather-sunrise-horizon"></div>
        <div className="weather-sunrise-sun">☀️</div>
      </div>
      <div className="weather-sunrise-value">{time}</div>
      <div className="weather-sunrise-title">Sunrise</div>
    </div>
  );
}

export default Sunrise;
