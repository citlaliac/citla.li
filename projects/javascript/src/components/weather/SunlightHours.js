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
  
  // Calculate min and max for display
  const minDisplay = minHours.toFixed(1);
  const maxDisplay = maxHours.toFixed(1);
  
  return (
    <div className="weather-sunlight-hours">
      <div className="weather-sunlight-hours-scale">
        <div className="weather-sunlight-hours-scale-track">
          <div 
            className="weather-sunlight-hours-scale-fill"
            style={{ width: `${percentage}%` }}
          ></div>
          <div 
            className="weather-sunlight-hours-scale-indicator"
            style={{ left: `${percentage}%` }}
          >
            <div className="weather-sunlight-hours-scale-dot"></div>
          </div>
        </div>
        <div className="weather-sunlight-hours-scale-labels">
          <span>{minDisplay}</span>
          <span>{maxDisplay}</span>
        </div>
      </div>
      <div className="weather-sunlight-hours-value">{hours.toFixed(1)}</div>
      <div className="weather-sunlight-hours-title">Sunlight Hours</div>
    </div>
  );
}

export default SunlightHours;
