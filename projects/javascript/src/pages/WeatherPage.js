import React, { useState, useEffect, useMemo } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Barometer from '../components/weather/Barometer';
import WeatherCard from '../components/weather/WeatherCard';
import Moon from '../components/weather/Moon';
import SunAngle from '../components/weather/SunAngle';
import SunlightHours from '../components/weather/SunlightHours';
import Sunrise from '../components/weather/Sunrise';
import Sunset from '../components/weather/Sunset';
import Temperature from '../components/weather/Temperature';
import Precipitation from '../components/weather/Precipitation';
import AstrologicalSign from '../components/weather/AstrologicalSign';
import UVIndex from '../components/weather/UVIndex';
import Wind from '../components/weather/Wind';
import SunlightChange from '../components/weather/SunlightChange';
import { useSEO } from '../hooks/useSEO';
import {
  getCurrentWeather,
  calculateSunAngle,
  getMoonPhase,
  getAstrologicalSign,
  formatTime,
  getPressureInfo,
  getYesterdayPressure,
  calculatePressureChange,
  calculateSunlightHours,
  getMaxYearlySunlightHours,
  getMinYearlySunlightHours,
  getUVIndex,
  getSunlightRateOfChange,
  CITIES,
  getCity
} from '../services/weatherService';
import '../styles/WeatherPage.css';

function WeatherPage() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sunAngle, setSunAngle] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [pressureChange, setPressureChange] = useState(null);
  const [selectedCity, setSelectedCity] = useState('new-york');
  const [maxSunlightHours, setMaxSunlightHours] = useState(15.0); // Default fallback
  const [minSunlightHours, setMinSunlightHours] = useState(9.0); // Default fallback
  const [uvIndex, setUvIndex] = useState(null);
  const [sunlightRateOfChange, setSunlightRateOfChange] = useState(null);
  const [widgetPositions, setWidgetPositions] = useState(() => {
    // Load saved positions from localStorage, or use default
    const saved = localStorage.getItem('weather-widget-positions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [draggedWidget, setDraggedWidget] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Default widget positions (grid layout initially)
  const defaultPositions = useMemo(() => ({
    'temperature': { x: 0, y: 0 },
    'sunrise': { x: 300, y: 0 },
    'sunset': { x: 600, y: 0 },
    'moon-phase': { x: 900, y: 0 },
    'astrological-sign': { x: 0, y: 200 },
    'precipitation': { x: 300, y: 200 },
    'sun-angle': { x: 600, y: 200 },
    'sunlight-hours': { x: 900, y: 200 },
    'uv-index': { x: 0, y: 400 },
    'wind': { x: 600, y: 400 },
    'sunlight-change': { x: 900, y: 400 },
    'pressure': { x: 300, y: 400 }
  }), []);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      if (weather) {
        const city = getCity(selectedCity);
        const angle = calculateSunAngle(now, city.lat, city.lon);
        setSunAngle(angle);
      }
    }, 60000);
    
    return () => clearInterval(timer);
  }, [weather, selectedCity]);

  // Fetch weather data automatically when page opens or city changes
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(null);
        const city = getCity(selectedCity);
        const data = await getCurrentWeather(city.lat, city.lon, selectedCity);
        setWeather(data);
        
        // Calculate initial sun angle
        const now = new Date();
        const angle = calculateSunAngle(now, city.lat, city.lon);
        setSunAngle(angle);
        setCurrentTime(now);
        
        // Fetch max and min yearly sunlight hours for the location
        try {
          const maxHours = await getMaxYearlySunlightHours(city.lat);
          if (maxHours) {
            setMaxSunlightHours(maxHours);
          }
        } catch (maxHoursError) {
          console.warn('Could not fetch max sunlight hours:', maxHoursError);
        }
        
        try {
          const minHours = await getMinYearlySunlightHours(city.lat);
          if (minHours) {
            setMinSunlightHours(minHours);
          }
        } catch (minHoursError) {
          console.warn('Could not fetch min sunlight hours:', minHoursError);
        }
        
        // Fetch UV index
        try {
          const uv = await getUVIndex(city.lat, city.lon);
          if (uv !== null) {
            setUvIndex(uv);
          }
        } catch (uvError) {
          console.warn('Could not fetch UV index:', uvError);
        }
        
        // Fetch sunlight rate of change
        try {
          const rate = await getSunlightRateOfChange(city.lat, city.lon);
          if (rate !== null) {
            setSunlightRateOfChange(rate);
          }
        } catch (rateError) {
          console.warn('Could not fetch sunlight rate of change:', rateError);
        }
        
        // Fetch yesterday's pressure for comparison (only for US cities with NWS)
        if (selectedCity === 'new-york' || selectedCity === 'tucson' || selectedCity === 'san-francisco') {
          try {
            const yesterdayPressure = await getYesterdayPressure();
            if (yesterdayPressure) {
              const change = calculatePressureChange(data.main.pressure, yesterdayPressure);
              setPressureChange(change);
            }
          } catch (pressureError) {
            console.warn('Could not fetch yesterday\'s pressure:', pressureError);
            // Don't fail the whole page if this fails
          }
        } else {
          setPressureChange(null); // Clear pressure change for non-US cities
        }
      } catch (err) {
        console.error('Weather fetch error:', err);
        setError(err.message || 'Failed to load weather data');
      } finally {
        setLoading(false);
      }
    };

    // Fetch immediately when page opens or city changes
    fetchWeather();
    
    // Auto-refresh every 10 minutes
    const refreshInterval = setInterval(fetchWeather, 10 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, [selectedCity]);

  // Initialize positions if not set
  useEffect(() => {
    if (!widgetPositions) {
      setWidgetPositions(defaultPositions);
    }
  }, [defaultPositions]);

  // Save positions to localStorage when they change
  useEffect(() => {
    if (widgetPositions) {
      localStorage.setItem('weather-widget-positions', JSON.stringify(widgetPositions));
    }
  }, [widgetPositions]);

  // SEO configuration
  const city = getCity(selectedCity);
  useSEO({
    title: `Weather in ${city.name} | citla.li/weather`,
    description: `Current weather conditions in ${city.name}. Temperature, pressure, moon phase, astrological sign, and more.`,
    keywords: `weather, ${city.name} weather, barometer, moon phase`,
    canonicalUrl: 'https://citla.li/weather',
  });

  if (loading) {
    return (
      <div className="weather-page">
        <Header />
        <div className="weather-loading">
          <div className="weather-spinner"></div>
          <p>Loading weather data...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="weather-page">
        <Header />
        <div className="weather-error">
          <p>Unable to load weather data: {error}</p>
          <p className="weather-error-note">
            The NWS API requires no API key - it should work automatically.
            Please check your internet connection and try again.
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!weather) {
    return null;
  }

  const moonPhaseFull = getMoonPhase(currentTime);
  // Abbreviate moon phase names for better display
  const moonPhaseAbbreviations = {
    'New Moon': 'New',
    'Waxing Crescent': 'Wax. Cres.',
    'First Quarter': '1st Qtr',
    'Waxing Gibbous': 'Wax. Gib.',
    'Full Moon': 'Full',
    'Waning Gibbous': 'Wan. Gib.',
    'Last Quarter': 'Last Qtr',
    'Waning Crescent': 'Wan. Cres.'
  };
  const moonPhase = moonPhaseAbbreviations[moonPhaseFull] || moonPhaseFull;
  const astrologicalSign = getAstrologicalSign(currentTime);
  const pressureInfo = getPressureInfo(weather.main.pressure);
  const isRaining = weather.weather[0].main === 'Rain' || weather.weather[0].main === 'Drizzle';
  const isSnowing = weather.weather[0].main === 'Snow';
  
  // Ensure sunAngle is a number (default to 0 if undefined)
  const displaySunAngle = typeof sunAngle === 'number' ? sunAngle : 0;

  const sunlightHours = weather ? calculateSunlightHours(
    weather.sys.sunrise,
    weather.sys.sunset,
    weather.sys.dayLength
  ) : 0;

  // Use saved positions or default
  const currentPositions = widgetPositions || defaultPositions;

  // All widget IDs
  const allWidgetIds = Object.keys(defaultPositions);

  // Drag handlers for absolute positioning
  const handleMouseDown = (e, widgetId) => {
    e.preventDefault();
    const widget = e.currentTarget;
    const rect = widget.getBoundingClientRect();
    const container = widget.parentElement.getBoundingClientRect();
    
    setDraggedWidget(widgetId);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e) => {
    if (!draggedWidget) return;
    
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    
    const newX = e.clientX - rect.left - dragOffset.x;
    const newY = e.clientY - rect.top - dragOffset.y;
    
    setWidgetPositions(prev => ({
      ...prev || defaultPositions,
      [draggedWidget]: { x: Math.max(0, newX), y: Math.max(0, newY) }
    }));
  };

  const handleMouseUp = () => {
    setDraggedWidget(null);
    setDragOffset({ x: 0, y: 0 });
  };

  // Widget renderer function
  const renderWidget = (widgetId) => {
    const position = currentPositions[widgetId] || { x: 0, y: 0 };
    const isDragging = draggedWidget === widgetId;
    
    const commonProps = {
      key: widgetId,
      style: {
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: isDragging ? 1000 : 1,
        cursor: 'grab'
      },
      onMouseDown: (e) => handleMouseDown(e, widgetId),
      className: `weather-widget ${isDragging ? 'weather-widget-dragging' : ''}`
    };

    switch (widgetId) {
      case 'temperature':
        return (
          <div {...commonProps}>
            <div className="weather-card">
              <Temperature 
                temp={weather.main.temp} 
                feelsLike={weather.main.feels_like} 
              />
            </div>
          </div>
        );
      case 'sunrise':
        return (
          <div {...commonProps}>
            <div className="weather-card">
              <Sunrise time={formatTime(weather.sys.sunrise)} />
            </div>
          </div>
        );
      case 'sunset':
        return (
          <div {...commonProps}>
            <div className="weather-card">
              <Sunset time={formatTime(weather.sys.sunset)} />
            </div>
          </div>
        );
      case 'moon-phase':
        return (
          <div {...commonProps}>
            <div className="weather-card weather-card-moon">
              <div className="weather-card-icon weather-card-icon-moon">
                <Moon date={currentTime} />
              </div>
              <div className="weather-card-content">
                <div className="weather-card-value">{moonPhase}</div>
                <div className="weather-card-title">Moon Phase</div>
              </div>
            </div>
          </div>
        );
      case 'astrological-sign':
        return (
          <div {...commonProps}>
            <div className="weather-card">
              <AstrologicalSign sign={astrologicalSign} />
            </div>
          </div>
        );
      case 'precipitation':
        return (
          <div {...commonProps}>
            <div className="weather-card">
              <Precipitation isRaining={isRaining} isSnowing={isSnowing} />
            </div>
          </div>
        );
      case 'sun-angle':
        return (
          <div {...commonProps}>
            <div className="weather-card">
              <SunAngle angle={displaySunAngle} />
            </div>
          </div>
        );
      case 'sunlight-hours':
        return (
          <div {...commonProps}>
            <div className="weather-card">
              <SunlightHours hours={sunlightHours} maxHours={maxSunlightHours} minHours={minSunlightHours} />
            </div>
          </div>
        );
      case 'uv-index':
        return (
          <div {...commonProps}>
            <div className="weather-card">
              <UVIndex uvIndex={uvIndex} />
            </div>
          </div>
        );
      case 'wind':
        return (
          <div {...commonProps}>
            <div className="weather-card">
              <Wind speed={weather.wind.speed} direction={weather.wind.deg} />
            </div>
          </div>
        );
      case 'sunlight-change':
        return (
          <div {...commonProps}>
            <div className="weather-card">
              <SunlightChange rateOfChange={sunlightRateOfChange} />
            </div>
          </div>
        );
      case 'pressure':
        return (
          <div 
            {...commonProps}
            className={`weather-pressure-section weather-widget ${draggedWidget === widgetId ? 'weather-widget-dragging' : ''}`}
          >
            <Barometer pressure={weather.main.pressure} />
            <div className="weather-pressure-info">
              <div className="weather-pressure-level">
                <strong>{pressureInfo.level}</strong> Pressure
              </div>
              {pressureChange && (
                <div className="weather-pressure-change">
                  <span className={`weather-pressure-change-value weather-pressure-change-${pressureChange.direction}`}>
                    {pressureChange.direction === 'up' ? '↑' : pressureChange.direction === 'down' ? '↓' : '→'} 
                    {Math.abs(pressureChange.percentChange).toFixed(1)}%
                  </span>
                  <span className="weather-pressure-change-label">from yesterday</span>
                </div>
              )}
              <div className="weather-pressure-effects">
                {pressureInfo.effects}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="weather-page">
      <Header />
      <div className="weather-container">
        <div className="weather-header">
          <h1 className="weather-title">Weather in {city.name}</h1>
          <select
            className="weather-city-selector"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
          >
            {Object.entries(CITIES).map(([key, cityData]) => (
              <option key={key} value={key}>
                {cityData.name}
              </option>
            ))}
          </select>
        </div>
        
        <div 
          className="weather-grid"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {allWidgetIds.map(widgetId => renderWidget(widgetId))}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default WeatherPage;

