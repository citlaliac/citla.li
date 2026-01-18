import React from 'react';
import './Barometer.css';

/**
 * Barometer Component
 * Visualizes atmospheric pressure as a glass barometer with zone indicators
 */
function Barometer({ pressure }) {
  // Pressure in hPa
  // Normal range: 980-1020 hPa
  // Calculate percentage for visual (0-100% based on 930-1030 hPa range)
  const minPressure = 930;  // hPa
  const maxPressure = 1030; // hPa
  const pressurePercent = Math.max(0, Math.min(100, 
    ((pressure - minPressure) / (maxPressure - minPressure)) * 100
  ));
  
  // Zone boundaries (in hPa)
  const lowZoneEnd = 980;    // Below this is LOW
  const highZoneStart = 1020; // Above this is HIGH
  const lowZonePercent = ((lowZoneEnd - minPressure) / (maxPressure - minPressure)) * 100;
  const highZonePercent = ((highZoneStart - minPressure) / (maxPressure - minPressure)) * 100;
  
  // Color based on pressure level with gradient
  const getColor = () => {
    if (pressure < lowZoneEnd) return 'linear-gradient(180deg, #2E5C8A 0%, #4A90E2 100%)'; // Low - darker blue
    if (pressure > highZoneStart) return 'linear-gradient(180deg, #5BA3D3 0%, #87CEEB 100%)'; // High - lighter blue
    return 'linear-gradient(180deg, #3D7BA8 0%, #5BA3D3 100%)'; // Normal - medium blue
  };
  
  return (
    <div className="weather-barometer">
      <div className="weather-barometer-container">
        <div className="weather-barometer-glass">
          {/* Zone indicators */}
          <div className="weather-barometer-zones">
            <div 
              className="weather-barometer-zone weather-barometer-zone-low"
              style={{ height: `${lowZonePercent}%` }}
            ></div>
            <div 
              className="weather-barometer-zone weather-barometer-zone-normal"
              style={{ 
                bottom: `${lowZonePercent}%`,
                height: `${highZonePercent - lowZonePercent}%` 
              }}
            ></div>
            <div 
              className="weather-barometer-zone weather-barometer-zone-high"
              style={{ 
                height: `${100 - highZonePercent}%`,
                top: 0
              }}
            ></div>
          </div>
          
          {/* Liquid */}
          <div 
            className="weather-barometer-liquid"
            style={{
              height: `${pressurePercent}%`,
              background: getColor()
            }}
          >
            {/* Shimmer effect */}
            <div className="weather-barometer-shimmer"></div>
          </div>
          
          {/* Zone markings directly on the barometer tube */}
          <div className="weather-barometer-tube-marks">
            {/* LOW zone mark */}
            <div 
              className="weather-barometer-tube-mark weather-barometer-tube-mark-low"
              style={{ bottom: `${lowZonePercent}%` }}
            >
              <div className="weather-barometer-tube-mark-line"></div>
              <span className="weather-barometer-tube-mark-label">LOW</span>
            </div>
            {/* MEDIUM zone mark */}
            <div 
              className="weather-barometer-tube-mark weather-barometer-tube-mark-medium"
              style={{ bottom: `${(lowZonePercent + highZonePercent) / 2}%` }}
            >
              <div className="weather-barometer-tube-mark-line"></div>
              <span className="weather-barometer-tube-mark-label">MEDIUM</span>
            </div>
            {/* HIGH zone mark */}
            <div 
              className="weather-barometer-tube-mark weather-barometer-tube-mark-high"
              style={{ bottom: `${highZonePercent}%` }}
            >
              <div className="weather-barometer-tube-mark-line"></div>
              <span className="weather-barometer-tube-mark-label">HIGH</span>
            </div>
          </div>
        </div>
      </div>
      <div className="weather-barometer-reading">
        <div className="weather-barometer-value">
          {pressure.toFixed(1)} <span className="weather-barometer-unit">hPa</span>
        </div>
      </div>
    </div>
  );
}

export default Barometer;

