import React from 'react';
import './AstrologicalSign.css';

/**
 * Astrological Sign Widget
 * Shows sign with zodiac symbol
 */
const ZODIAC_SYMBOLS = {
  'Aries': '♈',
  'Taurus': '♉',
  'Gemini': '♊',
  'Cancer': '♋',
  'Leo': '♌',
  'Virgo': '♍',
  'Libra': '♎',
  'Scorpio': '♏',
  'Sagittarius': '♐',
  'Capricorn': '♑',
  'Aquarius': '♒',
  'Pisces': '♓'
};

function AstrologicalSign({ sign }) {
  const symbol = ZODIAC_SYMBOLS[sign] || '⭐';
  
  return (
    <div className="weather-astro-sign">
      <div className="weather-astro-sign-star">{symbol}</div>
      <div className="weather-astro-sign-value">{sign}</div>
      <div className="weather-astro-sign-label">Current sign</div>
    </div>
  );
}

export default AstrologicalSign;
