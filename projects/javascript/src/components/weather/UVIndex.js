import React from 'react';
import './UVIndex.css';

/**
 * UV Index Widget
 * Shows UV index with a scale indicator
 */
function UVIndex({ uvIndex }) {
  // UV index typically ranges from 0-12+
  const maxUV = 12;
  const currentUV = uvIndex !== null && uvIndex !== undefined ? uvIndex : 0;
  const percentage = Math.min(100, (currentUV / maxUV) * 100);
  
  // Determine UV level category and color
  let uvColor = '#4CAF50'; // Green (Low)
  if (currentUV >= 11) {
    uvColor = '#9C27B0'; // Purple (Extreme)
  } else if (currentUV >= 8) {
    uvColor = '#F44336'; // Red (Very High)
  } else if (currentUV >= 6) {
    uvColor = '#FF9800'; // Orange (High)
  } else if (currentUV >= 3) {
    uvColor = '#FFC107'; // Yellow (Moderate)
  }
  
  return (
    <div className="weather-uv-index">
      <div className="weather-uv-scale">
        <div className="weather-uv-scale-track">
          <div 
            className="weather-uv-scale-fill"
            style={{ 
              width: `${percentage}%`,
              backgroundColor: uvColor
            }}
          ></div>
          <div 
            className="weather-uv-scale-indicator"
            style={{ 
              left: `${percentage}%`,
              backgroundColor: uvColor
            }}
          >
            <div className="weather-uv-scale-dot"></div>
          </div>
        </div>
        <div className="weather-uv-scale-labels">
          <span>0</span>
          <span>{maxUV}</span>
        </div>
      </div>
      <div className="weather-uv-value">{currentUV.toFixed(1)}</div>
      <div className="weather-uv-title">UV Index</div>
    </div>
  );
}

export default UVIndex;
