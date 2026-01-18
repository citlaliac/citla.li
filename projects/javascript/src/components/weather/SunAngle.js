import React from 'react';
import './SunAngle.css';

/**
 * Sun Angle Widget
 * Shows the sun angle with a visual sun icon
 */
function SunAngle({ angle }) {
  // Normalize angle for display (0-90 degrees)
  const normalizedAngle = Math.max(-90, Math.min(90, angle));
  const rotation = normalizedAngle; // Rotate sun based on angle
  const angleLineLength = 40; // Length of the angle indicator line
  const angleRadians = (normalizedAngle * Math.PI) / 180;
  // Calculate sun position at end of line (from center of horizon, going up)
  // For positive angles (above horizon), line goes up and right
  // For negative angles (below horizon), line goes down and right
  const sunX = Math.sin(angleRadians) * angleLineLength; // X is horizontal (right = positive)
  const sunY = -Math.cos(angleRadians) * angleLineLength; // Y is vertical (up = negative in CSS)
  
  return (
    <div className="weather-sun-angle">
      <div className="weather-sun-angle-scene">
        <div className="weather-sun-angle-horizon"></div>
        <div 
          className="weather-sun-angle-line"
          style={{ 
            transform: `translateX(-50%) rotate(${-normalizedAngle}deg)`,
            transformOrigin: 'center bottom'
          }}
        ></div>
        <div 
          className="weather-sun-angle-icon" 
          style={{ 
            transform: `translate(${sunX}px, ${sunY}px) rotate(${rotation}deg)`
          }}
        >
          ☀️
        </div>
      </div>
      <div className="weather-sun-angle-value">
        {angle > 0 ? `${angle.toFixed(1)}°` : 'Below horizon'}
      </div>
      <div className="weather-sun-angle-title">Sun Angle</div>
    </div>
  );
}

export default SunAngle;
