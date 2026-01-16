import React from 'react';
import './Temperature.css';

/**
 * Temperature Widget
 * Shows temperature with thermometer visual
 */
function Temperature({ temp, feelsLike }) {
  // Normalize temperature for thermometer (0-100 scale)
  // Assuming range from -20°F to 120°F
  const minTemp = -20;
  const maxTemp = 120;
  const normalizedTemp = Math.max(0, Math.min(100, ((temp - minTemp) / (maxTemp - minTemp)) * 100));
  
  return (
    <div className="weather-temperature">
      <div className="weather-temperature-thermometer">
        <div className="weather-temperature-bulb"></div>
        <div className="weather-temperature-stem">
          <div 
            className="weather-temperature-mercury"
            style={{ height: `${normalizedTemp}%` }}
          ></div>
        </div>
      </div>
      <div className="weather-temperature-value">{Math.round(temp)}°F</div>
      <div className="weather-temperature-title">Temperature</div>
    </div>
  );
}

export default Temperature;
