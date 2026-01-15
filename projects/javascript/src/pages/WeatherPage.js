import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Barometer from '../components/weather/Barometer';
import WeatherCard from '../components/weather/WeatherCard';
import Moon from '../components/weather/Moon';
import { useSEO } from '../hooks/useSEO';
import {
  getCurrentWeather,
  calculateSunAngle,
  getMoonPhase,
  getAstrologicalSign,
  formatTime,
  getPressureInfo,
  getYesterdayPressure,
  calculatePressureChange
} from '../services/weatherService';
import '../styles/WeatherPage.css';

function WeatherPage() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sunAngle, setSunAngle] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [pressureChange, setPressureChange] = useState(null);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      if (weather) {
        const angle = calculateSunAngle(now, 40.7336, -73.9983);
        setSunAngle(angle);
      }
    }, 60000);
    
    return () => clearInterval(timer);
  }, [weather]);

  // Fetch weather data automatically when page opens
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getCurrentWeather();
        setWeather(data);
        
        // Calculate initial sun angle
        const now = new Date();
        const angle = calculateSunAngle(now, 40.7336, -73.9983);
        setSunAngle(angle);
        setCurrentTime(now);
        
        // Fetch yesterday's pressure for comparison
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
      } catch (err) {
        console.error('Weather fetch error:', err);
        setError(err.message || 'Failed to load weather data');
      } finally {
        setLoading(false);
      }
    };

    // Fetch immediately when page opens
    fetchWeather();
    
    // Auto-refresh every 10 minutes
    const refreshInterval = setInterval(fetchWeather, 10 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  // SEO configuration
  useSEO({
    title: 'Weather in Greenwich Village, NYC | citla.li/weather',
    description: 'Current weather conditions in Greenwich Village, NYC. Temperature, pressure, moon phase, astrological sign, and more.',
    keywords: 'weather, Greenwich Village, NYC weather, New York weather, barometer, moon phase',
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

  const moonPhase = getMoonPhase(currentTime);
  const astrologicalSign = getAstrologicalSign(currentTime);
  const pressureInfo = getPressureInfo(weather.main.pressure);
  const isRaining = weather.weather[0].main === 'Rain' || weather.weather[0].main === 'Drizzle';
  const isSnowing = weather.weather[0].main === 'Snow';
  
  // Ensure sunAngle is a number (default to 0 if undefined)
  const displaySunAngle = typeof sunAngle === 'number' ? sunAngle : 0;

  return (
    <div className="weather-page">
      <Header />
      <div className="weather-container">
        <h1 className="weather-title">Weather in Greenwich Village, NYC</h1>
        
        <div className="weather-grid">
          {/* Temperature */}
          <WeatherCard
            title="Temperature"
            value={`${Math.round(weather.main.temp)}°F`}
            icon="🌡️"
            subtitle={`Feels like ${Math.round(weather.main.feels_like)}°F`}
          />

          {/* Sunrise */}
          <WeatherCard
            title="Sunrise"
            value={formatTime(weather.sys.sunrise)}
            icon="🌅"
            subtitle="Today"
          />

          {/* Sunset */}
          <WeatherCard
            title="Sunset"
            value={formatTime(weather.sys.sunset)}
            icon="🌇"
            subtitle="Today"
          />

          {/* Moon Phase */}
          <div className="weather-card">
            <div className="weather-card-icon weather-card-icon-moon">
              <Moon date={currentTime} />
            </div>
            <div className="weather-card-content">
              <div className="weather-card-title">Moon Phase</div>
              <div className="weather-card-value">{moonPhase}</div>
              <div className="weather-card-subtitle">Current phase</div>
            </div>
          </div>

          {/* Astrological Sign */}
          <WeatherCard
            title="Astrological Sign"
            value={astrologicalSign}
            icon="⭐"
            subtitle="Current sign"
          />

          {/* Precipitation */}
          <WeatherCard
            title="Precipitation"
            value={isRaining ? 'Raining' : isSnowing ? 'Snowing' : 'None'}
            icon={isRaining ? '🌧️' : isSnowing ? '❄️' : '☀️'}
            subtitle={isRaining || isSnowing ? 'Currently active' : 'Clear skies'}
          />

          {/* Sun Angle */}
          <WeatherCard
            title="Sun Angle"
            value={`${displaySunAngle.toFixed(1)}°`}
            icon="☀️"
            subtitle={displaySunAngle > 0 ? 'Above horizon' : 'Below horizon'}
          />

          {/* Pressure Barometer */}
          <div className="weather-pressure-section">
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
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default WeatherPage;

