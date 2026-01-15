import React from 'react';
import './Barometer.css';

/**
 * Barometer Component
 * Visualizes atmospheric pressure as a glass barometer with zone indicators
 */
function Barometer({ pressure }) {
  // Pressure in hPa, convert to mmHg for display
  // Normal range: 980-1020 hPa = ~735-765 mmHg
  const pressureMmHg = pressure * 0.750062;
  
  // Calculate percentage for visual (0-100% based on 700-800 mmHg range)
  const minPressure = 700;
  const maxPressure = 800;
  const pressurePercent = Math.max(0, Math.min(100, 
    ((pressureMmHg - minPressure) / (maxPressure - minPressure)) * 100
  ));
  
  // Zone boundaries (in mmHg)
  const lowZoneEnd = 735;    // Below this is LOW
  const highZoneStart = 765; // Above this is HIGH
  const lowZonePercent = ((lowZoneEnd - minPressure) / (maxPressure - minPressure)) * 100;
  const highZonePercent = ((highZoneStart - minPressure) / (maxPressure - minPressure)) * 100;
  
  // Determine current zone
  const getZone = () => {
    if (pressureMmHg < lowZoneEnd) return 'low';
    if (pressureMmHg > highZoneStart) return 'high';
    return 'normal';
  };
  
  const currentZone = getZone();
  
  // Color based on pressure level with gradient
  const getColor = () => {
    if (pressureMmHg < lowZoneEnd) return 'linear-gradient(180deg, #2E5C8A 0%, #4A90E2 100%)'; // Low - darker blue
    if (pressureMmHg > highZoneStart) return 'linear-gradient(180deg, #5BA3D3 0%, #87CEEB 100%)'; // High - lighter blue
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
            >
              <span className="weather-barometer-zone-label">LOW</span>
            </div>
            <div 
              className="weather-barometer-zone weather-barometer-zone-normal"
              style={{ 
                bottom: `${lowZonePercent}%`,
                height: `${highZonePercent - lowZonePercent}%` 
              }}
            >
              <span className="weather-barometer-zone-label">NORMAL</span>
            </div>
            <div 
              className="weather-barometer-zone weather-barometer-zone-high"
              style={{ 
                height: `${100 - highZonePercent}%`,
                top: 0
              }}
            >
              <span className="weather-barometer-zone-label">HIGH</span>
            </div>
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
          
          {/* Current pressure indicator */}
          <div 
            className="weather-barometer-indicator"
            style={{ bottom: `${pressurePercent}%` }}
          >
            <div className="weather-barometer-indicator-line"></div>
            <div className="weather-barometer-indicator-dot"></div>
          </div>
          
          {/* Scale marks - graduated cylinder style */}
          <div className="weather-barometer-scale">
            {/* Major marks every 25 mmHg */}
            <div className="weather-barometer-mark weather-barometer-mark-major" style={{ bottom: '0%' }}>
              <div className="weather-barometer-mark-line"></div>
              <span className="weather-barometer-mark-value">700</span>
            </div>
            <div className="weather-barometer-mark weather-barometer-mark-major" style={{ bottom: '25%' }}>
              <div className="weather-barometer-mark-line"></div>
              <span className="weather-barometer-mark-value">725</span>
            </div>
            <div className="weather-barometer-mark weather-barometer-mark-major" style={{ bottom: '50%' }}>
              <div className="weather-barometer-mark-line"></div>
              <span className="weather-barometer-mark-value">750</span>
            </div>
            <div className="weather-barometer-mark weather-barometer-mark-major" style={{ bottom: '75%' }}>
              <div className="weather-barometer-mark-line"></div>
              <span className="weather-barometer-mark-value">775</span>
            </div>
            <div className="weather-barometer-mark weather-barometer-mark-major" style={{ bottom: '100%' }}>
              <div className="weather-barometer-mark-line"></div>
              <span className="weather-barometer-mark-value">800</span>
            </div>
            
            {/* Zone boundary marks with labels */}
            <div className="weather-barometer-mark weather-barometer-mark-zone-boundary" style={{ bottom: `${lowZonePercent}%` }}>
              <div className="weather-barometer-mark-line weather-barometer-mark-line-zone"></div>
              <span className="weather-barometer-mark-zone-label">LOW</span>
              <span className="weather-barometer-mark-value">735</span>
            </div>
            <div className="weather-barometer-mark weather-barometer-mark-zone-boundary" style={{ bottom: `${highZonePercent}%` }}>
              <div className="weather-barometer-mark-line weather-barometer-mark-line-zone"></div>
              <span className="weather-barometer-mark-zone-label">HIGH</span>
              <span className="weather-barometer-mark-value">765</span>
            </div>
            
            {/* Minor marks every 12.5 mmHg (between major marks) */}
            <div className="weather-barometer-mark weather-barometer-mark-minor" style={{ bottom: '12.5%' }}>
              <div className="weather-barometer-mark-line weather-barometer-mark-line-minor"></div>
            </div>
            <div className="weather-barometer-mark weather-barometer-mark-minor" style={{ bottom: '37.5%' }}>
              <div className="weather-barometer-mark-line weather-barometer-mark-line-minor"></div>
            </div>
            <div className="weather-barometer-mark weather-barometer-mark-minor" style={{ bottom: '62.5%' }}>
              <div className="weather-barometer-mark-line weather-barometer-mark-line-minor"></div>
            </div>
            <div className="weather-barometer-mark weather-barometer-mark-minor" style={{ bottom: '87.5%' }}>
              <div className="weather-barometer-mark-line weather-barometer-mark-line-minor"></div>
            </div>
          </div>
        </div>
      </div>
      <div className="weather-barometer-reading">
        <div className="weather-barometer-value">
          {pressureMmHg.toFixed(1)} <span className="weather-barometer-unit">mmHg</span>
        </div>
        <div className="weather-barometer-hpa">
          {pressure.toFixed(1)} hPa
        </div>
      </div>
    </div>
  );
}

export default Barometer;

