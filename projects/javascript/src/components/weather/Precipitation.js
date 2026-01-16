import React from 'react';
import './Precipitation.css';

/**
 * Precipitation Widget
 * Shows rain drop, snow, or sun based on condition
 */
function Precipitation({ isRaining, isSnowing }) {
  let icon = '☀️';
  let value = 'Clear skies';
  
  if (isRaining) {
    icon = '💧';
    value = 'Raining';
  } else if (isSnowing) {
    icon = '❄️';
    value = 'Snowing';
  }
  
  return (
    <div className="weather-precipitation">
      <div className={`weather-precipitation-icon weather-precipitation-${isRaining ? 'rain' : isSnowing ? 'snow' : 'clear'}`}>
        {icon}
      </div>
      <div className="weather-precipitation-value">{value}</div>
      <div className="weather-precipitation-title">Precipitation</div>
    </div>
  );
}

export default Precipitation;
