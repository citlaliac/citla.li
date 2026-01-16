import React from 'react';
import './SunlightHours.css';

/**
 * Sunlight Hours Widget
 * Shows sunlight hours with sun icon and progress bar
 * Bar scales from minimum (empty) to maximum (full) sunlight hours in a year
 */
function SunlightHours({ hours, maxHours, minHours = 9.0 }) {
  // Calculate percentage: (current - min) / (max - min) * 100
  // This makes the bar empty at minimum hours and full at maximum hours
  const range = maxHours - minHours;
  const percentage = range > 0 
    ? Math.max(0, Math.min(100, ((hours - minHours) / range) * 100))
    : 0;
  
  return (
    <div className="weather-sunlight-hours">
      <div className="weather-sunlight-hours-bar-container">
        <div className="weather-sunlight-hours-bar">
          <div 
            className="weather-sunlight-hours-bar-fill"
            style={{ width: `${percentage}%` }}
          ></div>
          <div 
            className="weather-sunlight-hours-icon"
            style={{ left: `${percentage}%` }}
          >
            ☀️
          </div>
        </div>
      </div>
      <div className="weather-sunlight-hours-value">{hours.toFixed(1)} hrs</div>
      <div className="weather-sunlight-hours-title">Sunlight Hours</div>
    </div>
  );
}

export default SunlightHours;
