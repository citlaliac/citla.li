import React from 'react';
import { getMoonPhaseValue } from '../../services/weatherService';
import './Moon.css';

/**
 * Moon Component
 * Displays a realistic visual representation of the current moon phase
 */
function Moon({ date }) {
  const phase = getMoonPhaseValue(date);
  
  // Determine which side is illuminated
  // Phase 0 = New Moon (dark), 0.5 = Full Moon (bright), 1.0 = New Moon again
  const isWaxing = phase < 0.5; // Moon is getting brighter (right side lit)
  const illumination = isWaxing ? phase * 2 : (1 - phase) * 2; // 0 to 1
  
  // For visual representation, we'll use a circle with a shadow overlay
  // The shadow moves from right to left as the moon waxes, then left to right as it wanes
  
  return (
    <div className="weather-moon">
      <div className="weather-moon-circle">
        {/* Moon surface */}
        <div className="weather-moon-surface"></div>
        
        {/* Shadow overlay that creates the phase effect */}
        <div 
          className={`weather-moon-shadow weather-moon-shadow-${isWaxing ? 'waxing' : 'waning'}`}
          style={{
            clipPath: isWaxing 
              ? `inset(0 ${(1 - illumination) * 100}% 0 0)` 
              : `inset(0 0 0 ${(1 - illumination) * 100}%)`
          }}
        ></div>
        
        {/* Optional: Add some craters for realism */}
        <div className="weather-moon-crater weather-moon-crater-1"></div>
        <div className="weather-moon-crater weather-moon-crater-2"></div>
        <div className="weather-moon-crater weather-moon-crater-3"></div>
        <div className="weather-moon-crater weather-moon-crater-4"></div>
      </div>
    </div>
  );
}

export default Moon;

