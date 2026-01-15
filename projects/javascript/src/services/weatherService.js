/**
 * Weather Service
 * Fetches weather data for Greenwich Village, NYC
 * Uses PHP backend to call National Weather Service (NWS) API
 * No API key required - free public service
 */

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
        id: 800,
        main: 'Clear',
        description: 'clear sky',
        icon: '01d'
      }
    ],
    base: 'stations',
    main: {
      temp: 72,
      feels_like: 70,
      temp_min: 68,
      temp_max: 76,
      pressure: 1013, // Normal pressure in hPa
      humidity: 65
    },
    visibility: 10000,
    wind: {
      speed: 5.5,
      deg: 180
    },
    clouds: {
      all: 0
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
 */
export async function getCurrentWeather() {
  const lat = 40.7336; // Greenwich Village, NYC
  const lon = -73.9983;
  
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
    return transformNWSData(pointsData, forecastData, currentObservation, sunData);
    
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
 */
function transformNWSData(pointsData, forecastData, currentObservation, sunData = null) {
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
    const tz = 'America/New_York';
    const sunriseDate = new Date(today.toLocaleString('en-US', { timeZone: tz }));
    sunriseDate.setHours(6, 30, 0, 0);
    sunrise = Math.floor(sunriseDate.getTime() / 1000);
    
    const sunsetDate = new Date(today.toLocaleString('en-US', { timeZone: tz }));
    sunsetDate.setHours(19, 45, 0, 0);
    sunset = Math.floor(sunsetDate.getTime() / 1000);
  }
  
  return {
    coord: { lon: -73.9983, lat: 40.7336 },
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
      sunset: sunset
    },
    timezone: -18000,
    id: 5125771,
    name: 'New York',
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
 */
export function getPressureInfo(pressure) {
  // Pressure in hPa (OpenWeatherMap returns in hPa)
  // Normal range: 980-1020 hPa (29-30.1 inHg)
  // Convert to mmHg: 1 hPa = 0.750062 mmHg
  
  const pressureMmHg = pressure * 0.750062;
  const normalLow = 980 * 0.750062; // ~735 mmHg
  const normalHigh = 1020 * 0.750062; // ~765 mmHg
  
  if (pressureMmHg < normalLow) {
    return {
      level: 'Low',
      description: 'Low pressure system',
      effects: 'Some people may experience headaches, joint aches, or fatigue. Weather is typically stormy or rainy.'
    };
  } else if (pressureMmHg > normalHigh) {
    return {
      level: 'High',
      description: 'High pressure system',
      effects: 'Generally clear skies and stable weather. Most people feel comfortable, though some may experience slight sinus pressure.'
    };
  } else {
    return {
      level: 'Normal',
      description: 'Normal pressure',
      effects: 'Comfortable conditions. No significant health effects expected for most people.'
    };
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

