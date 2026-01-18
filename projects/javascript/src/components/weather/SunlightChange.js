import React from 'react';
import './SunlightChange.css';

/**
 * Sunlight Change Widget
 * Shows rate of change of sunlight (gaining/losing) with a meter gauge
 * Range: 0.5 min/day (left) to 4.5 min/day (right)
 */
function SunlightChange({ rateOfChange }) {
  // Rate of change in minutes per day (positive = gaining, negative = losing)
  const rate = rateOfChange || 0;
  const absRate = Math.abs(rate);
  
  // Rate range: 0.5 min/day (left) to 4.5 min/day (right)
  const minRate = 0.5;
  const maxRate = 4.5;
  const normalizedRate = Math.max(minRate, Math.min(maxRate, absRate));
  
  const isGaining = rate > 0;
  const isLosing = rate < 0;
  
  // Format rate display
  const rateDisplay = rate > 0 ? `+${rate.toFixed(1)}` : rate.toFixed(1);
  
  // Draw meter gauge (horizontal half circle at bottom)
  const drawMeter = () => {
    const width = 180;
    const height = 60;
    const centerX = width / 2;
    const centerY = height; // Bottom of SVG
    const radius = height - 5; // Arc radius
    const tubeThickness = 12; // Thickness of the filled tube
    
    // Gauge arc: 180 degrees (semi-circle from left to right at bottom)
    // 0.5 min/day = 180° (left), 4.5 min/day = 0° (right)
    const startAngle = 180; // Left side
    const endAngle = 0; // Right side
    const totalAngle = Math.abs(endAngle - startAngle); // 180 degrees
    
    // Calculate needle angle based on rate
    // Fast rate (4.5 min/day) = 0° (pointing right), slow rate (0.5 min/day) = 180° (pointing left)
    const ratePercent = (normalizedRate - minRate) / (maxRate - minRate);
    const needleAngle = startAngle - (ratePercent * totalAngle); // Subtract to go from left to right
    const needleAngleRad = (needleAngle * Math.PI) / 180;
    
    // Outer arc (top of tube)
    const outerRadius = radius;
    const outerStartX = centerX + outerRadius * Math.cos((startAngle * Math.PI) / 180);
    const outerStartY = centerY + outerRadius * Math.sin((startAngle * Math.PI) / 180);
    const outerEndX = centerX + outerRadius * Math.cos((endAngle * Math.PI) / 180);
    const outerEndY = centerY + outerRadius * Math.sin((endAngle * Math.PI) / 180);
    
    // Inner arc (bottom of tube)
    const innerRadius = radius - tubeThickness;
    const innerStartX = centerX + innerRadius * Math.cos((startAngle * Math.PI) / 180);
    const innerStartY = centerY + innerRadius * Math.sin((startAngle * Math.PI) / 180);
    
    const largeArcFlag = 1; // Always large arc for 180 degrees
    
    // Full background arc path (unfilled)
    const backgroundArcPath = `M ${outerStartX} ${outerStartY} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${outerEndX} ${outerEndY}`;
    
    // Filled portion - up to current rate
    const filledOuterX = centerX + outerRadius * Math.cos(needleAngleRad);
    const filledOuterY = centerY + outerRadius * Math.sin(needleAngleRad);
    const filledInnerX = centerX + innerRadius * Math.cos(needleAngleRad);
    const filledInnerY = centerY + innerRadius * Math.sin(needleAngleRad);
    
    // Filled tube path: outer arc + line to inner + inner arc back + line to start
    const filledTubePath = `M ${outerStartX} ${outerStartY} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${filledOuterX} ${filledOuterY} L ${filledInnerX} ${filledInnerY} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${innerStartX} ${innerStartY} Z`;
    
    // Needle/arrow endpoint
    const needleLength = radius * 0.9;
    const needleEndX = centerX + needleLength * Math.cos(needleAngleRad);
    const needleEndY = centerY + needleLength * Math.sin(needleAngleRad);
    
    return (
      <svg width={width} height={height} className="weather-sunlight-change-meter" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="meterGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={isGaining ? "rgba(76, 175, 80, 0.6)" : isLosing ? "rgba(255, 152, 0, 0.6)" : "rgba(255, 255, 255, 0.3)"} />
            <stop offset="100%" stopColor={isGaining ? "rgba(139, 195, 74, 0.9)" : isLosing ? "rgba(255, 87, 34, 0.9)" : "rgba(255, 255, 255, 0.5)"} />
          </linearGradient>
        </defs>
        {/* Background arc (unfilled portion) */}
        <path
          d={backgroundArcPath}
          fill="none"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth={tubeThickness}
          strokeLinecap="round"
        />
        {/* Filled tube */}
        <path
          d={filledTubePath}
          fill={isGaining ? "rgba(76, 175, 80, 0.7)" : isLosing ? "rgba(255, 152, 0, 0.7)" : "rgba(255, 255, 255, 0.4)"}
          stroke={isGaining ? "rgba(76, 175, 80, 0.9)" : isLosing ? "rgba(255, 152, 0, 0.9)" : "rgba(255, 255, 255, 0.6)"}
          strokeWidth="1"
        />
        {/* Needle/Arrow */}
        <line
          x1={centerX}
          y1={centerY}
          x2={needleEndX}
          y2={needleEndY}
          stroke={isGaining ? "rgba(76, 175, 80, 1)" : isLosing ? "rgba(255, 152, 0, 1)" : "rgba(255, 255, 255, 0.9)"}
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Center dot */}
        <circle
          cx={centerX}
          cy={centerY}
          r="5"
          fill={isGaining ? "rgba(76, 175, 80, 1)" : isLosing ? "rgba(255, 152, 0, 1)" : "rgba(255, 255, 255, 0.9)"}
        />
      </svg>
    );
  };
  
  return (
    <div className="weather-sunlight-change">
      <div className="weather-sunlight-change-meter-container">
        {drawMeter()}
      </div>
      <div className="weather-sunlight-change-value">{rateDisplay} min</div>
      <div className="weather-sunlight-change-title">Sunlight Change</div>
    </div>
  );
}

export default SunlightChange;
