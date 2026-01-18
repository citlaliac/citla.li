import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Moon from '../components/weather/Moon';
import SunAngle from '../components/weather/SunAngle';
import SunlightHours from '../components/weather/SunlightHours';
import SunlightChange from '../components/weather/SunlightChange';
import Sunrise from '../components/weather/Sunrise';
import Sunset from '../components/weather/Sunset';
import Temperature from '../components/weather/Temperature';
import Precipitation from '../components/weather/Precipitation';
import Wind from '../components/weather/Wind';
import UVIndex from '../components/weather/UVIndex';
import AstrologicalSign from '../components/weather/AstrologicalSign';
import Barometer from '../components/weather/Barometer';
import { useSEO } from '../hooks/useSEO';
import {
  getCurrentWeather,
  calculateSunAngle,
  getMoonPhase,
  getAstrologicalSign,
  formatTime,
  calculateSunlightHours,
  getMaxYearlySunlightHours,
  getMinYearlySunlightHours,
  getUVIndex,
  getSunlightRateOfChange,
  getPressureInfo,
  getYesterdayPressure,
  calculatePressureChange,
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
  const [selectedCity, setSelectedCity] = useState('new-york');
  const [maxSunlightHours, setMaxSunlightHours] = useState(15.0); // Default fallback
  const [minSunlightHours, setMinSunlightHours] = useState(9.0); // Default fallback
  const [uvIndex, setUvIndex] = useState(null);
  const [sunlightRateOfChange, setSunlightRateOfChange] = useState(null);
  const [pressureChange, setPressureChange] = useState(null);
  
  // Draggable widget state (only for desktop)
  const [widgetPositions, setWidgetPositions] = useState({});
  const [draggedWidget, setDraggedWidget] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef(null);

  // Detect mobile/desktop
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 769);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Default widget positions for desktop (only set once) - 4 columns, same order as mobile
  useEffect(() => {
    if (!isMobile && Object.keys(widgetPositions).length === 0) {
      // Wait for container to be ready
      const calculatePositions = () => {
        if (!containerRef.current) {
          setTimeout(calculatePositions, 50);
          return;
        }
        
        // Widget dimensions
        const widgetWidth = 250;
        const widgetHeight = 180;
        const gap = 24; // 1.5rem
        
        // Get the actual grid container width
        const containerWidth = containerRef.current.offsetWidth || containerRef.current.clientWidth;
        const totalGridWidth = (widgetWidth * 4) + (gap * 3);
        // Center the grid within the container
        const startX = Math.max(0, (containerWidth - totalGridWidth) / 2);
        const startY = 50;
      
      // Calculate positions in 4-column grid
      const widgets = [
        'temperature',      // Row 1, Col 1
        'precipitation',    // Row 1, Col 2
        'wind',             // Row 1, Col 3
        'uv-index',         // Row 1, Col 4
        'sunrise',          // Row 2, Col 1
        'sunset',           // Row 2, Col 2
        'sun-hours',        // Row 2, Col 3
        'sunlight-change',  // Row 2, Col 4
        'sun-angle',        // Row 3, Col 1
        'moon',             // Row 3, Col 2
        'astrological-sign', // Row 3, Col 3
        'barometer'         // Row 3, Col 4
      ];
      
        const defaultPositions = {};
        widgets.forEach((widgetId, index) => {
          const col = index % 4;
          const row = Math.floor(index / 4);
          defaultPositions[widgetId] = {
            x: startX + col * (widgetWidth + gap),
            y: startY + row * (widgetHeight + gap)
          };
        });
        
        setWidgetPositions(defaultPositions);
      };
      
      calculatePositions();
    }
  }, [isMobile, widgetPositions]);

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


  // Add global mouse move and up listeners when dragging
  useEffect(() => {
    if (!draggedWidget || isMobile) return;

    const handleMouseMove = (e) => {
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;
      
      const newX = e.clientX - containerRect.left - dragOffset.x;
      const newY = e.clientY - containerRect.top - dragOffset.y;
      
      setWidgetPositions(prev => ({
        ...prev,
        [draggedWidget]: { x: newX, y: newY }
      }));
    };

    const handleMouseUp = () => {
      setDraggedWidget(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedWidget, dragOffset, isMobile]);

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
  const isRaining = weather.weather[0].main === 'Rain' || weather.weather[0].main === 'Drizzle';
  const isSnowing = weather.weather[0].main === 'Snow';
  const pressureInfo = getPressureInfo(weather.main.pressure);
  
  // Ensure sunAngle is a number (default to 0 if undefined)
  const displaySunAngle = typeof sunAngle === 'number' ? sunAngle : 0;

  const sunlightHours = weather ? calculateSunlightHours(
    weather.sys.sunrise,
    weather.sys.sunset,
    weather.sys.dayLength
  ) : 0;

  // Drag handlers (only for desktop)
  const handleMouseDown = (e, widgetId) => {
    if (isMobile) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;
    
    setDraggedWidget(widgetId);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseUp = () => {
    setDraggedWidget(null);
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
          ref={containerRef}
          className={`weather-widgets-grid ${!isMobile ? 'weather-widgets-draggable' : ''}`}
        >
          {/* 1. Temperature */}
          <div 
            className="weather-widget-card"
            style={!isMobile && widgetPositions['temperature'] ? {
              position: 'absolute',
              left: `${widgetPositions['temperature'].x}px`,
              top: `${widgetPositions['temperature'].y}px`,
              cursor: draggedWidget === 'temperature' ? 'grabbing' : 'grab'
            } : {}}
            onMouseDown={(e) => handleMouseDown(e, 'temperature')}
          >
            <Temperature 
              temp={weather.main.temp} 
              feelsLike={weather.main.feels_like} 
            />
          </div>

          {/* 2. Precipitation */}
          <div 
            className="weather-widget-card"
            style={!isMobile && widgetPositions['precipitation'] ? {
              position: 'absolute',
              left: `${widgetPositions['precipitation'].x}px`,
              top: `${widgetPositions['precipitation'].y}px`,
              cursor: draggedWidget === 'precipitation' ? 'grabbing' : 'grab'
            } : {}}
            onMouseDown={(e) => handleMouseDown(e, 'precipitation')}
          >
            <Precipitation isRaining={isRaining} isSnowing={isSnowing} />
          </div>

          {/* 3. Wind */}
          <div 
            className="weather-widget-card"
            style={!isMobile && widgetPositions['wind'] ? {
              position: 'absolute',
              left: `${widgetPositions['wind'].x}px`,
              top: `${widgetPositions['wind'].y}px`,
              cursor: draggedWidget === 'wind' ? 'grabbing' : 'grab'
            } : {}}
            onMouseDown={(e) => handleMouseDown(e, 'wind')}
          >
            <Wind speed={weather.wind?.speed || 0} direction={weather.wind?.deg || 0} />
          </div>

          {/* 4. UV Index */}
          <div 
            className="weather-widget-card"
            style={!isMobile && widgetPositions['uv-index'] ? {
              position: 'absolute',
              left: `${widgetPositions['uv-index'].x}px`,
              top: `${widgetPositions['uv-index'].y}px`,
              cursor: draggedWidget === 'uv-index' ? 'grabbing' : 'grab'
            } : {}}
            onMouseDown={(e) => handleMouseDown(e, 'uv-index')}
          >
            <UVIndex uvIndex={uvIndex} />
          </div>

          {/* 5. Sunrise */}
          <div 
            className="weather-widget-card"
            style={!isMobile && widgetPositions['sunrise'] ? {
              position: 'absolute',
              left: `${widgetPositions['sunrise'].x}px`,
              top: `${widgetPositions['sunrise'].y}px`,
              cursor: draggedWidget === 'sunrise' ? 'grabbing' : 'grab'
            } : {}}
            onMouseDown={(e) => handleMouseDown(e, 'sunrise')}
          >
            <Sunrise time={formatTime(weather.sys.sunrise)} />
          </div>

          {/* 6. Sunset */}
          <div 
            className="weather-widget-card"
            style={!isMobile && widgetPositions['sunset'] ? {
              position: 'absolute',
              left: `${widgetPositions['sunset'].x}px`,
              top: `${widgetPositions['sunset'].y}px`,
              cursor: draggedWidget === 'sunset' ? 'grabbing' : 'grab'
            } : {}}
            onMouseDown={(e) => handleMouseDown(e, 'sunset')}
          >
            <Sunset time={formatTime(weather.sys.sunset)} />
          </div>

          {/* 7. Sun Hours */}
          <div 
            className="weather-widget-card"
            style={!isMobile && widgetPositions['sun-hours'] ? {
              position: 'absolute',
              left: `${widgetPositions['sun-hours'].x}px`,
              top: `${widgetPositions['sun-hours'].y}px`,
              cursor: draggedWidget === 'sun-hours' ? 'grabbing' : 'grab'
            } : {}}
            onMouseDown={(e) => handleMouseDown(e, 'sun-hours')}
          >
            <SunlightHours hours={sunlightHours} maxHours={maxSunlightHours} minHours={minSunlightHours} />
          </div>

          {/* 8. Sunlight Change */}
          <div 
            className="weather-widget-card"
            style={!isMobile && widgetPositions['sunlight-change'] ? {
              position: 'absolute',
              left: `${widgetPositions['sunlight-change'].x}px`,
              top: `${widgetPositions['sunlight-change'].y}px`,
              cursor: draggedWidget === 'sunlight-change' ? 'grabbing' : 'grab'
            } : {}}
            onMouseDown={(e) => handleMouseDown(e, 'sunlight-change')}
          >
            <SunlightChange rateOfChange={sunlightRateOfChange} />
          </div>

          {/* 9. Sun Angle */}
          <div 
            className="weather-widget-card"
            style={!isMobile && widgetPositions['sun-angle'] ? {
              position: 'absolute',
              left: `${widgetPositions['sun-angle'].x}px`,
              top: `${widgetPositions['sun-angle'].y}px`,
              cursor: draggedWidget === 'sun-angle' ? 'grabbing' : 'grab'
            } : {}}
            onMouseDown={(e) => handleMouseDown(e, 'sun-angle')}
          >
            <SunAngle angle={displaySunAngle} />
          </div>

          {/* 10. Moon */}
          <div 
            className="weather-widget-card"
            style={!isMobile && widgetPositions['moon'] ? {
              position: 'absolute',
              left: `${widgetPositions['moon'].x}px`,
              top: `${widgetPositions['moon'].y}px`,
              cursor: draggedWidget === 'moon' ? 'grabbing' : 'grab'
            } : {}}
            onMouseDown={(e) => handleMouseDown(e, 'moon')}
          >
            <div className="weather-moon-widget">
              <div className="weather-moon-widget-icon">
                <Moon date={currentTime} />
              </div>
              <div className="weather-moon-widget-content">
                <div className="weather-moon-widget-value">{moonPhase}</div>
                <div className="weather-moon-widget-title">Moon Phase</div>
              </div>
            </div>
          </div>

          {/* 11. Astrological Sign */}
          <div 
            className="weather-widget-card"
            style={!isMobile && widgetPositions['astrological-sign'] ? {
              position: 'absolute',
              left: `${widgetPositions['astrological-sign'].x}px`,
              top: `${widgetPositions['astrological-sign'].y}px`,
              cursor: draggedWidget === 'astrological-sign' ? 'grabbing' : 'grab'
            } : {}}
            onMouseDown={(e) => handleMouseDown(e, 'astrological-sign')}
          >
            <AstrologicalSign sign={astrologicalSign} />
          </div>

          {/* 12. Barometer */}
          <div 
            className="weather-widget-card weather-barometer-card"
            style={!isMobile && widgetPositions['barometer'] ? {
              position: 'absolute',
              left: `${widgetPositions['barometer'].x}px`,
              top: `${widgetPositions['barometer'].y}px`,
              cursor: draggedWidget === 'barometer' ? 'grabbing' : 'grab'
            } : {}}
            onMouseDown={(e) => handleMouseDown(e, 'barometer')}
          >
            <Barometer pressure={weather.main.pressure} />
            <div className="weather-pressure-info">
              {pressureChange ? (
                <div className="weather-pressure-change">
                  <span className={`weather-pressure-change-value weather-pressure-change-${pressureChange.direction}`}>
                    {pressureChange.direction === 'up' ? '↑' : pressureChange.direction === 'down' ? '↓' : '→'} 
                    {Math.abs(pressureChange.percentChange).toFixed(1)}%
                  </span>
                  <span className="weather-pressure-change-label">from yesterday</span>
                </div>
              ) : null}
              <div className="weather-pressure-effects">
                {pressureInfo.effects}
              </div>
              <div className="weather-pressure-title">Pressure</div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default WeatherPage;

