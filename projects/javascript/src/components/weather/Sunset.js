import React from 'react';
import './Sunset.css';

/**
 * Sunset Widget
 * Shows sun below horizon
 */
function Sunset({ time }) {
  return (
    <div className="weather-sunset">
      <div className="weather-sunset-scene">
        <div className="weather-sunset-horizon"></div>
        <div className="weather-sunset-sun">☀️</div>
      </div>
      <div className="weather-sunset-value">{time}</div>
      <div className="weather-sunset-title">Sunset</div>
    </div>
  );
}

export default Sunset;
