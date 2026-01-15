import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import WeatherPage from '../WeatherPage';
import * as weatherService from '../../services/weatherService';

// Mock Header and Footer
jest.mock('../../components/Header', () => {
  return function MockHeader() {
    return <div data-testid="header">Header</div>;
  };
});

jest.mock('../../components/Footer', () => {
  return function MockFooter() {
    return <div data-testid="footer">Footer</div>;
  };
});

// Mock weather service
jest.mock('../../services/weatherService', () => ({
  getCurrentWeather: jest.fn(),
  calculateSunAngle: jest.fn(() => 45.5),
  getMoonPhase: jest.fn(() => 'Waxing Gibbous'),
  getAstrologicalSign: jest.fn(() => 'Capricorn'),
  formatTime: jest.fn((timestamp) => '6:30 AM'),
  getPressureInfo: jest.fn(() => ({
    level: 'Normal',
    effects: 'Comfortable conditions'
  })),
  getYesterdayPressure: jest.fn(() => Promise.resolve(1010)),
  calculatePressureChange: jest.fn(() => ({
    direction: 'up',
    percentChange: 0.3,
    change: 3
  }))
}));

// Mock SEO hook
jest.mock('../../hooks/useSEO', () => ({
  useSEO: jest.fn()
}));

const mockWeatherData = {
  coord: { lon: -73.9983, lat: 40.7336 },
  weather: [{ main: 'Clear', description: 'clear sky' }],
  main: {
    temp: 72,
    feels_like: 70,
    pressure: 1013,
    humidity: 65
  },
  sys: {
    sunrise: 1736962200,
    sunset: 1737000000
  }
};

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('WeatherPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    weatherService.getCurrentWeather.mockResolvedValue(mockWeatherData);
  });

  test('renders loading state initially', () => {
    renderWithRouter(<WeatherPage />);
    
    expect(screen.getByText(/loading weather data/i)).toBeInTheDocument();
  });

  test('renders weather data after loading', async () => {
    renderWithRouter(<WeatherPage />);
    
    await waitFor(() => {
      expect(screen.queryByText(/loading weather data/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });
    
    await waitFor(() => {
      expect(screen.getByText(/weather in greenwich village/i)).toBeInTheDocument();
    }, { timeout: 3000 });
    
    expect(screen.getByText(/72°F/i)).toBeInTheDocument();
    expect(screen.getByText(/normal pressure/i)).toBeInTheDocument();
  });

  test('renders all weather cards', async () => {
    renderWithRouter(<WeatherPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/temperature/i)).toBeInTheDocument();
    }, { timeout: 3000 });
    
    expect(screen.getByText(/sunrise/i)).toBeInTheDocument();
    expect(screen.getByText(/sunset/i)).toBeInTheDocument();
    expect(screen.getByText(/moon phase/i)).toBeInTheDocument();
    expect(screen.getByText(/astrological sign/i)).toBeInTheDocument();
    expect(screen.getByText(/precipitation/i)).toBeInTheDocument();
    expect(screen.getByText(/sun angle/i)).toBeInTheDocument();
  });

  test('displays pressure change when available', async () => {
    renderWithRouter(<WeatherPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/from yesterday/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('handles error state', async () => {
    weatherService.getCurrentWeather.mockRejectedValue(new Error('API Error'));
    
    renderWithRouter(<WeatherPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/unable to load weather data/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('renders Header and Footer', async () => {
    renderWithRouter(<WeatherPage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });
});

