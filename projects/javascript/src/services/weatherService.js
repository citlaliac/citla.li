/**
 * Weather Service
 * Fetches weather data for multiple cities
 * Uses National Weather Service (NWS) API for US cities
 * Uses sunrise-sunset.org API for all cities
 * No API key required - free public services
 */

/**
 * City definitions with coordinates
 */
export const CITIES = {
  'new-york': {
    name: 'New York',
    lat: 40.7336,
    lon: -73.9983,
    timezone: 'America/New_York'
  },
  'paris': {
    name: 'Paris',
    lat: 48.8566,
    lon: 2.3522,
    timezone: 'Europe/Paris'
  },
  'ljubljana': {
    name: 'Ljubljana',
    lat: 46.0569,
    lon: 14.5058,
    timezone: 'Europe/Ljubljana'
  },
  'tokyo': {
    name: 'Tokyo',
    lat: 35.6762,
    lon: 139.6503,
    timezone: 'Asia/Tokyo'
  },
  'tucson': {
    name: 'Tucson',
    lat: 32.2226,
    lon: -110.9747,
    timezone: 'America/Phoenix'
  },
  'san-francisco': {
    name: 'San Francisco',
    lat: 37.7749,
    lon: -122.4194,
    timezone: 'America/Los_Angeles'
  },
  'sydney': {
    name: 'Sydney',
    lat: -33.8688,
    lon: 151.2093,
    timezone: 'Australia/Sydney'
  }
};

/**
 * Get city by key
 */
export function getCity(cityKey) {
  return CITIES[cityKey] || CITIES['new-york'];
}

/**
 * Mock weather data for testing without API key
 */
function getMockWeatherData() {
  const now = Math.floor(Date.now() / 1000);
  const today = new Date();
  const sunrise = new Date(today);
  sunrise.setHours(6, 30, 0, 0);
  const sunset = new Date(today);
  sunset.setHours(19, 45, 0, 0);
  
  return {
    coord: { lon: -73.9983, lat: 40.7336 },
    weather: [
      {
        id: 500,
        main: 'Rain',
        description: 'light rain',
        icon: '10d'
      }
    ],
    base: 'stations',
    main: {
      temp: 65,
      feels_like: 63,
      temp_min: 62,
      temp_max: 68,
      pressure: 970, // Low pressure in hPa (< 980)
      humidity: 85
    },
    visibility: 8000,
    wind: {
      speed: 12.5,
      deg: 220
    },
    clouds: {
      all: 90
    },
    dt: now,
    sys: {
      type: 1,
      id: 4610,
      country: 'US',
      sunrise: Math.floor(sunrise.getTime() / 1000),
      sunset: Math.floor(sunset.getTime() / 1000)
    },
    timezone: -14400,
    id: 5125771,
    name: 'New York',
    cod: 200
  };
}

/**
 * Get current weather data directly from NWS API
 * No proxy needed - NWS API is free and public
 * @param {number} lat - Latitude (defaults to NYC)
 * @param {number} lon - Longitude (defaults to NYC)
 * @param {string} cityKey - City key for name/timezone (defaults to 'new-york')
 */
export async function getCurrentWeather(lat = 40.7336, lon = -73.9983, cityKey = 'new-york') {
  // In development, check for mock data flag (URL parameter or localStorage)
  if (process.env.NODE_ENV === 'development') {
    const urlParams = new URLSearchParams(window.location.search);
    const useMock = urlParams.get('mock') === 'true' || localStorage.getItem('weather-use-mock') === 'true';
    
    if (useMock) {
      console.log('🧪 Using mock weather data (low pressure, rainy)');
      return getMockWeatherData();
    }
  }
  
  try {
    // Step 1: Get grid point information
    const pointsUrl = `https://api.weather.gov/points/${lat},${lon}`;
    const pointsResponse = await fetch(pointsUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'citla.li Weather Page (https://citla.li/weather, contact via citla.li/contact)'
      },
    });
    
    if (!pointsResponse.ok) {
      throw new Error(`NWS API error: HTTP ${pointsResponse.status}`);
    }
    
    const pointsData = await pointsResponse.json();
    
    if (!pointsData || !pointsData.properties) {
      throw new Error('Invalid response from NWS points endpoint');
    }
    
    // Step 2: Get forecast (for sunrise/sunset and current conditions)
    const forecastUrl = pointsData.properties.forecast;
    if (!forecastUrl) {
      throw new Error('No forecast URL in NWS response');
    }
    
    const forecastResponse = await fetch(forecastUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'citla.li Weather Page (https://citla.li/weather, contact via citla.li/contact)'
      },
    });
    
    if (!forecastResponse.ok) {
      throw new Error(`NWS forecast API error: HTTP ${forecastResponse.status}`);
    }
    
    const forecastData = await forecastResponse.json();
    
    // Step 3: Get current observations (optional - for real-time data)
    let currentObservation = null;
    const observationStationsUrl = pointsData.properties.observationStations;
    
    if (observationStationsUrl) {
      try {
        const stationsResponse = await fetch(observationStationsUrl, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'citla.li Weather Page (https://citla.li/weather, contact via citla.li/contact)'
          },
        });
        
        if (stationsResponse.ok) {
          const stationsData = await stationsResponse.json();
          if (stationsData?.features?.[0]?.properties?.stationIdentifier) {
            const stationId = stationsData.features[0].properties.stationIdentifier;
            const obsUrl = `https://api.weather.gov/stations/${stationId}/observations/latest`;
            
            const obsResponse = await fetch(obsUrl, {
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'citla.li Weather Page (https://citla.li/weather, contact via citla.li/contact)'
              },
            });
            
            if (obsResponse.ok) {
              currentObservation = await obsResponse.json();
            }
          }
        }
      } catch (obsError) {
        // Observation is optional, continue without it
        console.warn('Could not fetch observations:', obsError);
      }
    }
    
    // Step 4: Get accurate sunrise/sunset times from sunrise-sunset.org API (free, no key needed)
    let sunData = null;
    try {
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
      const sunApiUrl = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&date=${dateStr}&formatted=0`;
      
      const sunResponse = await fetch(sunApiUrl);
      if (sunResponse.ok) {
        const sunApiData = await sunResponse.json();
        if (sunApiData.status === 'OK' && sunApiData.results) {
          sunData = {
            sunrise: new Date(sunApiData.results.sunrise).getTime() / 1000,
            sunset: new Date(sunApiData.results.sunset).getTime() / 1000,
            solarNoon: new Date(sunApiData.results.solar_noon).getTime() / 1000,
            dayLength: sunApiData.results.day_length
          };
        }
      }
    } catch (sunError) {
      console.warn('Could not fetch sunrise/sunset data:', sunError);
    }
    
    // Transform NWS data to expected format
    return transformNWSData(pointsData, forecastData, currentObservation, sunData, cityKey);
    
  } catch (error) {
    console.error('Weather API error:', error);
    
    // Only use mock data in development for network errors
    if (process.env.NODE_ENV === 'development' && 
        (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
      console.warn('⚠️ Network error - using mock data for development.');
      return getMockWeatherData();
    }
    
    throw error;
  }
}

/**
 * Transform NWS API data to OpenWeatherMap-like format
 * @param {string} cityKey - City key for name/timezone
 */
function transformNWSData(pointsData, forecastData, currentObservation, sunData = null, cityKey = 'new-york') {
  const city = getCity(cityKey);
  const forecast = forecastData?.properties;
  const currentPeriod = forecast?.periods?.[0];
  const obs = currentObservation?.properties;
  
  // Get temperature
  let temp = null;
  if (obs?.temperature?.value !== null && obs?.temperature?.value !== undefined) {
    // Convert from Celsius to Fahrenheit
    temp = Math.round((obs.temperature.value * 9/5) + 32);
  } else if (currentPeriod?.temperature !== null && currentPeriod?.temperature !== undefined) {
    temp = currentPeriod.temperature;
  }
  
  // Get pressure (convert from Pascal to hPa)
  let pressure = null;
  if (obs?.barometricPressure?.value !== null && obs?.barometricPressure?.value !== undefined) {
    pressure = Math.round(obs.barometricPressure.value / 100);
  }
  
  // Get humidity
  const humidity = obs?.relativeHumidity?.value ?? null;
  
  // Get wind
  let windSpeed = null;
  let windDeg = null;
  if (obs?.windSpeed?.value !== null && obs?.windSpeed?.value !== undefined) {
    // Convert m/s to mph
    windSpeed = Math.round(obs.windSpeed.value * 2.237);
  }
  windDeg = obs?.windDirection?.value ?? null;
  
  // Get weather condition
  let weatherMain = 'Clear';
  let weatherDesc = 'clear sky';
  const text = (obs?.textDescription || currentPeriod?.shortForecast || '').toLowerCase();
  if (text.includes('rain') || text.includes('drizzle')) {
    weatherMain = 'Rain';
    weatherDesc = 'rain';
  } else if (text.includes('snow')) {
    weatherMain = 'Snow';
    weatherDesc = 'snow';
  } else if (text.includes('cloud')) {
    weatherMain = 'Clouds';
    weatherDesc = 'cloudy';
  }
  
  // Get sunrise/sunset - use accurate API data if available, otherwise from forecast
  let sunrise = null;
  let sunset = null;
  
  // Priority 1: Use accurate sunrise-sunset.org API data (passed from getCurrentWeather)
  if (sunData) {
    sunrise = Math.floor(sunData.sunrise);
    sunset = Math.floor(sunData.sunset);
  } 
  // Priority 2: Try to get from forecast periods
  else if (forecast?.periods) {
    for (const period of forecast.periods) {
      if (period.isDaytime === false && sunset === null) {
        sunset = Math.floor(new Date(period.startTime).getTime() / 1000);
      }
      if (period.isDaytime === true && sunrise === null) {
        sunrise = Math.floor(new Date(period.startTime).getTime() / 1000);
      }
    }
  }
  
  // Priority 3: Fallback to calculated times
  if (!sunrise || !sunset) {
    const today = new Date();
    const tz = city.timezone;
    const sunriseDate = new Date(today.toLocaleString('en-US', { timeZone: tz }));
    sunriseDate.setHours(6, 30, 0, 0);
    sunrise = Math.floor(sunriseDate.getTime() / 1000);
    
    const sunsetDate = new Date(today.toLocaleString('en-US', { timeZone: tz }));
    sunsetDate.setHours(19, 45, 0, 0);
    sunset = Math.floor(sunsetDate.getTime() / 1000);
  }
  
  // Calculate timezone offset (in seconds)
  const now = new Date();
  const cityDate = new Date(now.toLocaleString('en-US', { timeZone: city.timezone }));
  const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  const timezoneOffset = (cityDate.getTime() - utcDate.getTime()) / 1000;

  return {
    coord: { lon: city.lon, lat: city.lat },
    weather: [{
      id: 800,
      main: weatherMain,
      description: weatherDesc,
      icon: '01d'
    }],
    base: 'stations',
    main: {
      temp: temp ?? 72,
      feels_like: temp ?? 72,
      temp_min: (temp ?? 72) - 4,
      temp_max: (temp ?? 72) + 4,
      pressure: pressure ?? 1013,
      humidity: humidity ?? 65
    },
    visibility: 10000,
    wind: {
      speed: windSpeed ?? 5.5,
      deg: windDeg ?? 180
    },
    clouds: { all: 0 },
    dt: Math.floor(Date.now() / 1000),
    sys: {
      type: 1,
      id: 0,
      country: 'US',
      sunrise: sunrise,
      sunset: sunset,
      dayLength: sunData?.dayLength || null // Include dayLength from API
    },
    timezone: timezoneOffset,
    id: 5125771,
    name: city.name,
    cod: 200
  };
}

/**
 * Calculate sun angle (elevation) in degrees using NOAA solar calculation methods
 * Based on: https://gml.noaa.gov/grad/solcalc/
 * @param {Date} date - Current date/time (will be converted to Eastern Time for NYC)
 * @param {number} lat - Latitude in decimal degrees
 * @param {number} lon - Longitude in decimal degrees (negative for west)
 * @returns {number} Sun elevation angle in degrees (0-90, negative if below horizon)
 */
export function calculateSunAngle(date, lat, lon) {
  // Convert date to Eastern Time (America/New_York) for NYC
  const easternDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  
  // Get Eastern Time components
  const year = easternDate.getFullYear();
  const month = easternDate.getMonth() + 1;
  const day = easternDate.getDate();
  const hour = easternDate.getHours();
  const minute = easternDate.getMinutes();
  const second = easternDate.getSeconds();
  
  // Calculate day of year (using Eastern Time)
  const dayOfYear = Math.floor((easternDate - new Date(year, 0, 0)) / 86400000);
  
  // Calculate fractional year (in radians)
  const fractionalYear = (2 * Math.PI / 365) * (dayOfYear - 1 + (hour - 12) / 24);
  
  // Equation of time (in minutes) - accounts for Earth's elliptical orbit and axial tilt
  const eqTime = 229.18 * (
    0.000075 +
    0.001868 * Math.cos(fractionalYear) -
    0.032077 * Math.sin(fractionalYear) -
    0.014615 * Math.cos(2 * fractionalYear) -
    0.040849 * Math.sin(2 * fractionalYear)
  );
  
  // Solar declination (in degrees) - more accurate calculation
  const declination = (
    0.006918 -
    0.399912 * Math.cos(fractionalYear) +
    0.070257 * Math.sin(fractionalYear) -
    0.006758 * Math.cos(2 * fractionalYear) +
    0.000907 * Math.sin(2 * fractionalYear) -
    0.002697 * Math.cos(3 * fractionalYear) +
    0.00148 * Math.sin(3 * fractionalYear)
  ) * (180 / Math.PI);
  
  // Determine if DST is in effect for Eastern Time
  // DST: Second Sunday in March to First Sunday in November
  const isDST = isEasternDaylightSavingTime(easternDate);
  const timezoneOffset = isDST ? -4 : -5; // UTC offset in hours for EST/EDT
  
  // Time offset (in minutes) - accounts for longitude and equation of time
  const timeOffset = eqTime + 4 * lon - 60 * timezoneOffset;
  
  // True solar time (in minutes)
  const trueSolarTime = hour * 60 + minute + second / 60 + timeOffset;
  
  // Hour angle (in degrees) - 15 degrees per hour
  const hourAngle = (trueSolarTime / 4) - 180;
  
  // Convert to radians
  const latRad = lat * Math.PI / 180;
  const declRad = declination * Math.PI / 180;
  const hourRad = hourAngle * Math.PI / 180;
  
  // Solar elevation angle (in radians, then convert to degrees)
  const elevationRad = Math.asin(
    Math.sin(latRad) * Math.sin(declRad) +
    Math.cos(latRad) * Math.cos(declRad) * Math.cos(hourRad)
  );
  
  const elevation = elevationRad * 180 / Math.PI;
  
  // Atmospheric refraction correction (adds ~0.6° when sun is near horizon)
  // Only apply if sun is above -0.5° (below that, refraction is complex)
  let correctedElevation = elevation;
  if (elevation > -0.5) {
    const refraction = 1.02 / Math.tan((elevation + 10.3 / (elevation + 5.11)) * Math.PI / 180) / 60;
    correctedElevation = elevation + refraction;
  }
  
  // Return elevation (can be negative if below horizon)
  return correctedElevation;
}

/**
 * Check if a date is in Daylight Saving Time for Eastern Time (America/New_York)
 * DST: Second Sunday in March to First Sunday in November
 */
function isEasternDaylightSavingTime(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();
  
  // DST starts: Second Sunday in March
  const marchFirst = new Date(year, 2, 1); // Month is 0-indexed, so 2 = March
  const marchFirstDay = marchFirst.getDay(); // 0 = Sunday
  const daysToFirstSunday = (7 - marchFirstDay) % 7 || 7;
  const dstStart = new Date(year, 2, 1 + daysToFirstSunday + 7); // Second Sunday
  
  // DST ends: First Sunday in November
  const novemberFirst = new Date(year, 10, 1); // Month is 0-indexed, so 10 = November
  const novemberFirstDay = novemberFirst.getDay();
  const daysToFirstSundayNov = (7 - novemberFirstDay) % 7 || 7;
  const dstEnd = new Date(year, 10, 1 + daysToFirstSundayNov);
  
  const currentDate = new Date(year, month - 1, day);
  return currentDate >= dstStart && currentDate < dstEnd;
}

/**
 * Get moon phase value (0-1) for visual representation
 * @param {Date} date - Current date
 * @returns {number} Phase value from 0 (New Moon) to 1 (back to New Moon)
 */
export function getMoonPhaseValue(date) {
  // Julian Day calculation
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours() + date.getMinutes() / 60;
  
  // Calculate Julian Day
  let jd;
  if (month <= 2) {
    jd = Math.floor(365.25 * (year - 1)) + Math.floor(30.6001 * (month + 12 + 1)) + day + hour / 24 + 1720981.5;
  } else {
    jd = Math.floor(365.25 * year) + Math.floor(30.6001 * (month + 1)) + day + hour / 24 + 1720981.5;
  }
  
  // Days since last known new moon (Jan 6, 2000 18:14 UTC)
  const knownNewMoon = 2451545.26; // Jan 6, 2000
  const daysSinceNewMoon = (jd - knownNewMoon) % 29.53058867;
  
  // Moon phase (0 = New Moon, 0.5 = Full Moon, 1.0 = New Moon again)
  return daysSinceNewMoon / 29.53058867;
}

/**
 * Get moon phase (accurate calculation)
 * @param {Date} date - Current date
 * Based on astronomical calculations - more accurate than simple approximation
 */
export function getMoonPhase(date) {
  const phase = getMoonPhaseValue(date);
  
  // Determine phase name
  if (phase < 0.03 || phase > 0.97) return 'New Moon';
  if (phase < 0.22) return 'Waxing Crescent';
  if (phase < 0.28) return 'First Quarter';
  if (phase < 0.47) return 'Waxing Gibbous';
  if (phase < 0.53) return 'Full Moon';
  if (phase < 0.72) return 'Waning Gibbous';
  if (phase < 0.78) return 'Last Quarter';
  return 'Waning Crescent';
}

/**
 * Get astrological sign
 * @param {Date} date - Current date
 */
export function getAstrologicalSign(date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricorn';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius';
  return 'Pisces';
}

/**
 * Format time from Unix timestamp
 */
export function formatTime(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}

/**
 * Get pressure description and health effects
 * Matches the Barometer component boundaries: Low < 980, Normal 980-1020, High > 1020
 */
export function getPressureInfo(pressure) {
  // Pressure in hPa
  // Normal range: 980-1020 hPa (matches Barometer component)
  const normalLow = 980;  // hPa
  const normalHigh = 1020; // hPa
  
  if (pressure < normalLow) {
    return {
      level: 'Low',
      description: 'Low pressure system',
      effects: 'May cause headaches or fatigue. Typically stormy weather.'
    };
  } else if (pressure > normalHigh) {
    return {
      level: 'High',
      description: 'High pressure system',
      effects: 'Clear skies and stable weather. Generally comfortable.'
    };
  } else {
    return {
      level: 'Normal',
      description: 'Normal pressure',
      effects: 'Comfortable conditions.'
    };
  }
}

/**
 * Get current UV index from Open-Meteo API
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<number|null>} UV index (0-12+) or null if unavailable
 */
export async function getUVIndex(lat, lon) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=uv_index&timezone=auto`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Open-Meteo API error: HTTP ${response.status}`);
    }
    
    const data = await response.json();
    if (data?.current?.uv_index !== null && data?.current?.uv_index !== undefined) {
      return Math.round(data.current.uv_index * 10) / 10; // Round to 1 decimal
    }
    
    return null;
  } catch (error) {
    console.warn('Could not fetch UV index:', error);
    return null;
  }
}

/**
 * Get yesterday's pressure from Open-Meteo historical weather API
 * Free API, no key required
 */
export async function getYesterdayPressure() {
  const lat = 40.7336; // Greenwich Village, NYC
  const lon = -73.9983;
  
  try {
    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Open-Meteo historical weather API (free, no API key)
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${dateStr}&end_date=${dateStr}&hourly=surface_pressure&timezone=America%2FNew_York`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Open-Meteo API error: HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || !data.hourly || !data.hourly.surface_pressure || data.hourly.surface_pressure.length === 0) {
      throw new Error('No pressure data available for yesterday');
    }
    
    // Get average pressure for yesterday (use all hourly readings)
    const pressures = data.hourly.surface_pressure.filter(p => p !== null);
    if (pressures.length === 0) {
      throw new Error('No valid pressure readings for yesterday');
    }
    
    // Calculate average pressure
    const avgPressure = pressures.reduce((sum, p) => sum + p, 0) / pressures.length;
    
    return avgPressure; // Returns pressure in hPa
    
  } catch (error) {
    console.error('Error fetching yesterday\'s pressure:', error);
    // Return null if we can't get the data
    return null;
  }
}

/**
 * Calculate percentage change from yesterday's pressure
 * @param {number} currentPressure - Current pressure in hPa
 * @param {number} yesterdayPressure - Yesterday's pressure in hPa
 * @returns {object} - Object with percentage change and direction
 */
export function calculatePressureChange(currentPressure, yesterdayPressure) {
  if (!yesterdayPressure || yesterdayPressure === 0) {
    return null;
  }
  
  const change = currentPressure - yesterdayPressure;
  const percentChange = (change / yesterdayPressure) * 100;
  
  return {
    change: change,
    percentChange: percentChange,
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same'
  };
}

/**
 * Calculate sunlight hours for the day
 * @param {number} sunrise - Sunrise timestamp in seconds
 * @param {number} sunset - Sunset timestamp in seconds
 * @param {number|null} dayLength - Day length in seconds from API (if available)
 * @returns {number} - Sunlight hours (rounded to 1 decimal place)
 */
export function calculateSunlightHours(sunrise, sunset, dayLength = null) {
  // Use API dayLength if available (most accurate)
  if (dayLength !== null && dayLength > 0) {
    return Math.round((dayLength / 3600) * 10) / 10;
  }
  
  // Calculate from sunrise/sunset
  if (sunrise && sunset && sunset > sunrise) {
    const hours = (sunset - sunrise) / 3600;
    return Math.round(hours * 10) / 10;
  }
  
  // Fallback: return 0 if data is invalid
  return 0;
}

/**
 * Calculate maximum sunlight hours for a location (summer solstice)
 * @param {number} lat - Latitude
 * @returns {number} - Maximum sunlight hours (rounded to 1 decimal)
 */
export async function getMaxYearlySunlightHours(lat) {
  // Approximate max hours based on latitude
  // At equator: ~12 hours, at poles: 24 hours (polar day), at mid-latitudes: varies
  // For most locations, max is around 14-16 hours
  // More accurate: calculate for June 21 (summer solstice)
  try {
    const year = new Date().getFullYear();
    const solsticeDate = `${year}-06-21`; // Summer solstice (approximate)
    const sunApiUrl = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=0&date=${solsticeDate}&formatted=0`;
    
    const response = await fetch(sunApiUrl);
    if (response.ok) {
      const data = await response.json();
      if (data.status === 'OK' && data.results?.day_length) {
        return Math.round((data.results.day_length / 3600) * 10) / 10;
      }
    }
  } catch (error) {
    console.warn('Could not fetch max sunlight hours:', error);
  }
  
  // Fallback: estimate based on latitude
  // At 40°N (NYC): ~15 hours max
  // At 0° (equator): ~12.5 hours
  // At 60°N: ~18 hours
  const absLat = Math.abs(lat);
  if (absLat < 10) return 12.5;
  if (absLat < 30) return 13.5;
  if (absLat < 45) return 15.0;
  if (absLat < 60) return 18.0;
  return 20.0; // High latitude
}

/**
 * Get sunlight hours for a specific date
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {Promise<number|null>} - Sunlight hours or null if unavailable
 */
export async function getSunlightHoursForDate(lat, lon, dateStr) {
  try {
    const sunApiUrl = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&date=${dateStr}&formatted=0`;
    const response = await fetch(sunApiUrl);
    if (response.ok) {
      const data = await response.json();
      if (data.status === 'OK' && data.results?.day_length) {
        // Return hours with full precision (no rounding) for accurate calculations
        // day_length is in seconds, convert to hours
        return data.results.day_length / 3600;
      }
    }
  } catch (error) {
    console.warn('Could not fetch sunlight hours for date:', error);
  }
  return null;
}

/**
 * Get sunlight hours for multiple dates
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} daysBack - Number of days in the past
 * @param {number} daysForward - Number of days in the future
 * @returns {Promise<Array<{date: string, hours: number}>>} - Array of date and hours pairs
 */
export async function getSunlightHoursForRange(lat, lon, daysBack = 7, daysForward = 7) {
  const results = [];
  const today = new Date();
  
  // Get past days
  for (let i = daysBack; i > 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const hours = await getSunlightHoursForDate(lat, lon, dateStr);
    if (hours !== null) {
      results.push({ date: dateStr, hours });
    }
  }
  
  // Get today
  const todayStr = today.toISOString().split('T')[0];
  const todayHours = await getSunlightHoursForDate(lat, lon, todayStr);
  if (todayHours !== null) {
    results.push({ date: todayStr, hours: todayHours });
  }
  
  // Get future days
  for (let i = 1; i <= daysForward; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const hours = await getSunlightHoursForDate(lat, lon, dateStr);
    if (hours !== null) {
      results.push({ date: dateStr, hours });
    }
  }
  
  return results;
}

/**
 * Calculate rate of change of sunlight (minutes per day)
 * Calculates the change from yesterday to today
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<number|null>} - Rate of change in minutes per day (positive = gaining, negative = losing)
 */
export async function getSunlightRateOfChange(lat, lon) {
  try {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    console.log('Fetching sunlight hours:', { today: todayStr, yesterday: yesterdayStr, lat, lon });
    
    const todayHours = await getSunlightHoursForDate(lat, lon, todayStr);
    const yesterdayHours = await getSunlightHoursForDate(lat, lon, yesterdayStr);
    
    console.log('Sunlight hours fetched:', { todayHours, yesterdayHours });
    
    if (todayHours !== null && yesterdayHours !== null) {
      const changeInHours = todayHours - yesterdayHours;
      const changeInMinutes = changeInHours * 60;
      console.log('Change calculated:', { changeInHours, changeInMinutes });
      // Round to 2 decimal places for more precision (to show seconds)
      const result = Math.round(changeInMinutes * 100) / 100;
      console.log('Final result:', result);
      return result;
    } else {
      console.warn('Could not get both today and yesterday hours:', { todayHours, yesterdayHours });
    }
  } catch (error) {
    console.warn('Could not calculate sunlight rate of change:', error);
  }
  return null;
}

/**
 * Get maximum rate of change of sunlight (fastest gain/loss, typically at equinoxes)
 * @param {number} lat - Latitude
 * @returns {Promise<number>} - Maximum rate of change in minutes per day
 */
export async function getMaxSunlightRateOfChange(lat) {
  // Maximum rate occurs around spring/fall equinoxes (March 20, September 22)
  // For mid-latitudes (40°N), max rate is typically 2-3 minutes per day
  try {
    const year = new Date().getFullYear();
    const springEquinox = `${year}-03-20`;
    const fallEquinox = `${year}-09-22`;
    
    // Calculate rate around spring equinox (gaining) - use 0 longitude for consistency
    const springDay1 = await getSunlightHoursForDate(lat, 0, springEquinox);
    const springDay2 = await getSunlightHoursForDate(lat, 0, `${year}-03-21`);
    
    // Calculate rate around fall equinox (losing) - use 0 longitude for consistency
    const fallDay1 = await getSunlightHoursForDate(lat, 0, fallEquinox);
    const fallDay2 = await getSunlightHoursForDate(lat, 0, `${year}-09-23`);
    
    let maxRate = 0;
    
    if (springDay1 !== null && springDay2 !== null) {
      const springRate = Math.abs((springDay2 - springDay1) * 60);
      maxRate = Math.max(maxRate, springRate);
    }
    
    if (fallDay1 !== null && fallDay2 !== null) {
      const fallRate = Math.abs((fallDay2 - fallDay1) * 60);
      maxRate = Math.max(maxRate, fallRate);
    }
    
    if (maxRate > 0) {
      return Math.round(maxRate * 10) / 10;
    }
  } catch (error) {
    console.warn('Could not fetch max sunlight rate of change:', error);
  }
  
  // Fallback: estimate based on latitude
  // At 40°N: ~2.5 min/day max
  // At 0°: ~0.5 min/day max (equator has less variation)
  // At 60°N: ~4 min/day max
  const absLat = Math.abs(lat);
  if (absLat < 10) return 0.5;
  if (absLat < 30) return 1.5;
  if (absLat < 45) return 2.5;
  if (absLat < 60) return 3.5;
  return 4.5; // High latitude
}

/**
 * Calculate minimum sunlight hours for a location (winter solstice)
 * @param {number} lat - Latitude
 * @returns {number} - Minimum sunlight hours (rounded to 1 decimal)
 */
export async function getMinYearlySunlightHours(lat) {
  // Calculate for December 21 (winter solstice)
  try {
    const year = new Date().getFullYear();
    const solsticeDate = `${year}-12-21`; // Winter solstice (approximate)
    const sunApiUrl = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=0&date=${solsticeDate}&formatted=0`;
    
    const response = await fetch(sunApiUrl);
    if (response.ok) {
      const data = await response.json();
      if (data.status === 'OK' && data.results?.day_length) {
        return Math.round((data.results.day_length / 3600) * 10) / 10;
      }
    }
  } catch (error) {
    console.warn('Could not fetch min sunlight hours:', error);
  }
  
  // Fallback: estimate based on latitude
  // At 40°N (NYC): ~9 hours min
  // At 0° (equator): ~11.5 hours
  // At 60°N: ~6 hours
  const absLat = Math.abs(lat);
  if (absLat < 10) return 11.5;
  if (absLat < 30) return 10.5;
  if (absLat < 45) return 9.0;
  if (absLat < 60) return 6.0;
  return 4.0; // High latitude
}
