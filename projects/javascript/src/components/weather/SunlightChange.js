import React from 'react';
import './SunlightChange.css';

/**
 * Sunlight Change Widget
 * Shows rate of change of sunlight with a meter indicating intensity
 * Meter shows where we are in the yearly cycle (high change near equinoxes, low near solstices)
 */
function SunlightChange({ rateOfChange }) {
  // Rate of change in minutes per day (positive = gaining, negative = losing)
  const rate = rateOfChange || 0;
  
  // Actual min/max values based on real-world data
  // 2:40 = 2 minutes 40 seconds = 2 + 40/60 = 2.6667 minutes
  // 2:43 = 2 minutes 43 seconds = 2 + 43/60 = 2.7167 minutes
  const maxLoss = 2 + 40/60; // 2:40 in minutes (2.6667)
  const maxGain = 2 + 43/60;  // 2:43 in minutes (2.7167)
  
  const isGaining = rate > 0;
  const isLosing = rate < 0;
  const isNeutral = rate === 0;
  
  // Calculate intensity: use the appropriate max based on direction
  // If gaining, compare to maxGain (2:43)
  // If losing, compare to maxLoss (2:40)
  const absRate = Math.abs(rate);
  const maxForDirection = isGaining ? maxGain : maxLoss;
  const intensity = Math.min(1, absRate / maxForDirection); // 0 to 1, where 1 = max change period
  
  // Visible arc is 180 degrees (half circle from 180° to 0°), radius 40
  // Length = (180/360) * 2 * π * 40 = 125.66
  const arcLength = (180 / 360) * 2 * Math.PI * 40;
  
  // We want to fill intensity% of the 180-degree arc
  // Dash length = intensity * arcLength (the portion we want to show)
  // Large gap ensures only one dash appears
  const dashLength = intensity * arcLength;
  
  // Format rate display as M:SS
  const formatRateDisplay = (minutes) => {
    if (minutes === 0) return '0:00';
    
    const sign = minutes > 0 ? '+' : '-';
    const absMinutes = Math.abs(minutes);
    const wholeMinutes = Math.floor(absMinutes);
    const seconds = Math.round((absMinutes - wholeMinutes) * 60);
    const secondsStr = seconds.toString().padStart(2, '0');
    
    return `${sign}${wholeMinutes}:${secondsStr}`;
  };
  
  const rateDisplay = formatRateDisplay(rate);
  
  return (
    <div className="weather-sunlight-change">
      <div className="weather-sunlight-change-meter-wrapper">
        <div className="weather-sunlight-change-meter">
          {/* Background circle - viewBox shows top half (180-degree arc) with extra space at top */}
          <svg className="weather-sunlight-change-meter-svg" viewBox="0 -15 100 55">
            {/* Background arc (180 degrees from left 180° to right 0°) */}
            {/* Arc center at y=45 (moved up), radius 40, so arc goes from y=5 (top) to y=45 (center) */}
            <path
              d="M 10 45 A 40 40 0 0 1 90 45"
              fill="none"
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* Filled arc - shows intensity% of the 180-degree arc, starting from left (180°) */}
            {/* strokeDasharray: [dash length, gap length]
                dash = intensity * arcLength (the portion to fill)
                gap = very large so only one dash shows
                strokeDashoffset = 0 so it starts from the beginning (left side) */}
            <path
              d="M 10 45 A 40 40 0 0 1 90 45"
              fill="none"
              stroke={isGaining ? "#FF9800" : isLosing ? "#87CEEB" : "rgba(255, 255, 255, 0.5)"}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${dashLength} ${arcLength * 10}`}
              strokeDashoffset={0}
              className="weather-sunlight-change-meter-fill"
            />
          </svg>
          {/* Center icon - positioned at top of arc */}
          <div className="weather-sunlight-change-center">
            <div className="weather-sunlight-change-sun">☀️</div>
          </div>
          {/* Arrow positioned to the left of the arc */}
          <div className={`weather-sunlight-change-arrow ${isGaining ? 'arrow-up' : isLosing ? 'arrow-down' : 'arrow-neutral'}`}>
            {isGaining ? '↑' : isLosing ? '↓' : '→'}
          </div>
        </div>
      </div>
      <div className="weather-sunlight-change-value">{rateDisplay}</div>
      <div className="weather-sunlight-change-title">Sunlight Change</div>
    </div>
  );
}

export default SunlightChange;
