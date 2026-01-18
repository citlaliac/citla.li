import React, { useState, useEffect } from 'react';
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
  
  // Ensure sunAngle is a number (default to 0 if undefined)
  const displaySunAngle = typeof sunAngle === 'number' ? sunAngle : 0;

  const sunlightHours = weather ? calculateSunlightHours(
    weather.sys.sunrise,
    weather.sys.sunset,
    weather.sys.dayLength
  ) : 0;

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
        
        <div className="weather-widgets-grid">
          {/* 1. Temperature */}
          <div className="weather-widget-card">
            <Temperature 
              temp={weather.main.temp} 
              feelsLike={weather.main.feels_like} 
            />
          </div>

          {/* 2. Precipitation */}
          <div className="weather-widget-card">
            <Precipitation isRaining={isRaining} isSnowing={isSnowing} />
          </div>

          {/* 3. Wind */}
          <div className="weather-widget-card">
            <Wind speed={weather.wind?.speed || 0} direction={weather.wind?.deg || 0} />
          </div>

          {/* 4. UV Index */}
          <div className="weather-widget-card">
            <UVIndex uvIndex={uvIndex} />
          </div>

          {/* 5. Sunrise */}
          <div className="weather-widget-card">
            <Sunrise time={formatTime(weather.sys.sunrise)} />
          </div>

          {/* 6. Sunset */}
          <div className="weather-widget-card">
            <Sunset time={formatTime(weather.sys.sunset)} />
          </div>

          {/* 7. Sun Hours */}
          <div className="weather-widget-card">
            <SunlightHours hours={sunlightHours} maxHours={maxSunlightHours} minHours={minSunlightHours} />
          </div>

          {/* 8. Sunlight Change */}
          <div className="weather-widget-card">
            <SunlightChange rateOfChange={sunlightRateOfChange} />
          </div>

          {/* 9. Sun Angle */}
          <div className="weather-widget-card">
            <SunAngle angle={displaySunAngle} />
          </div>

          {/* 10. Moon */}
          <div className="weather-widget-card">
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
          <div className="weather-widget-card">
            <AstrologicalSign sign={astrologicalSign} />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default WeatherPage;

