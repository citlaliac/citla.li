import React from 'react';
import './WeatherCard.css';

/**
 * Weather Card Component
 * Reusable card for displaying weather information
 */
function WeatherCard({ title, value, icon, subtitle, className = '' }) {
  return (
    <div className={`weather-card ${className}`}>
      {icon && <div className="weather-card-icon">{icon}</div>}
      <div className="weather-card-content">
        <div className="weather-card-title">{title}</div>
        <div className="weather-card-value">{value}</div>
        {subtitle && <div className="weather-card-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
}

export default WeatherCard;

