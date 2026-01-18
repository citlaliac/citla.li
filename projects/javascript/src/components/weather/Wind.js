import React from 'react';
import './Wind.css';

/**
 * Wind Widget
 * Shows wind speed and direction
 */
function Wind({ speed, direction }) {
  // Wind direction in degrees (0 = North, 90 = East, 180 = South, 270 = West)
  const windDirection = direction !== null && direction !== undefined ? direction : 0;
  const windSpeed = speed || 0;
  
  // Convert degrees to cardinal/intercardinal direction
  const getWindDirectionText = (deg) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
  };
  
  // Determine arrow size based on wind speed
  const getArrowSize = (speed) => {
    if (speed < 10) return 'small';
    if (speed < 20) return 'medium';
    return 'large';
  };
  
  const directionText = getWindDirectionText(windDirection);
  const arrowSize = getArrowSize(windSpeed);
  
  return (
    <div className="weather-wind">
      <div className="weather-wind-direction">{directionText}</div>
      <div className={`weather-wind-arrow weather-wind-arrow-${arrowSize}`}>
        →
      </div>
      <div className="weather-wind-value">{Math.round(windSpeed)} mph</div>
      <div className="weather-wind-title">Wind</div>
    </div>
  );
}

export default Wind;
