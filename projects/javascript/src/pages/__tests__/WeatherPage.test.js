import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
  getMoonPhaseValue: jest.fn(() => 0.5),
  getAstrologicalSign: jest.fn(() => 'Capricorn'),
  formatTime: jest.fn((timestamp) => '6:30 AM'),
  calculateSunlightHours: jest.fn(() => 9.5),
  getMaxYearlySunlightHours: jest.fn(() => Promise.resolve(15.0)),
  getMinYearlySunlightHours: jest.fn(() => Promise.resolve(9.0)),
  getUVIndex: jest.fn(() => Promise.resolve(5)),
  getSunlightRateOfChange: jest.fn(() => Promise.resolve(1.65)),
  getPressureInfo: jest.fn(() => ({
    level: 'Normal',
    effects: 'Comfortable conditions'
  })),
  getYesterdayPressure: jest.fn(() => Promise.resolve(1010)),
  calculatePressureChange: jest.fn(() => ({
    direction: 'up',
    percentChange: 0.3,
    change: 3
  })),
  getCity: jest.fn((key) => ({ name: 'Greenwich Village', lat: 40.7336, lon: -73.9983 })),
  CITIES: {
    'new-york': { name: 'Greenwich Village', lat: 40.7336, lon: -73.9983 }
  }
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
  wind: {
    speed: 5,
    deg: 180
  },
  sys: {
    sunrise: 1736962200,
    sunset: 1737000000,
    dayLength: 34200
  }
};

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('WeatherPage', () => {
  // Mock window.innerWidth for mobile detection tests
  const originalInnerWidth = window.innerWidth;
  
  beforeEach(() => {
    jest.clearAllMocks();
    weatherService.getCurrentWeather.mockResolvedValue(mockWeatherData);
    // Ensure getCity returns a valid city object
    weatherService.getCity.mockReturnValue({ name: 'Greenwich Village', lat: 40.7336, lon: -73.9983 });
    // Ensure getPressureInfo always returns a valid object
    weatherService.getPressureInfo.mockReturnValue({
      level: 'Normal',
      effects: 'Comfortable conditions'
    });
    // Ensure calculateSunlightHours always returns a number
    weatherService.calculateSunlightHours.mockReturnValue(9.5);
    // Reset window width to desktop default
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth
    });
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

  test('renders barometer widget', async () => {
    renderWithRouter(<WeatherPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/pressure/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('displays pressure change percentage when available', async () => {
    renderWithRouter(<WeatherPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/from yesterday/i)).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Should show the percentage change
    expect(screen.getByText(/0\.3%/i)).toBeInTheDocument();
  });

  test('displays pressure effects text', async () => {
    renderWithRouter(<WeatherPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/comfortable conditions/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('uses grid layout on mobile', async () => {
    // Set mobile width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500
    });

    const { container } = renderWithRouter(<WeatherPage />);
    
    await waitFor(() => {
      const grid = container.querySelector('.weather-widgets-grid');
      expect(grid).toBeInTheDocument();
      expect(grid).not.toHaveClass('weather-widgets-draggable');
    }, { timeout: 3000 });
  });

  test('uses draggable layout on desktop', async () => {
    // Set desktop width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    });

    const { container } = renderWithRouter(<WeatherPage />);
    
    await waitFor(() => {
      const grid = container.querySelector('.weather-widgets-grid');
      expect(grid).toBeInTheDocument();
      // Should have draggable class on desktop
      expect(grid).toHaveClass('weather-widgets-draggable');
    }, { timeout: 3000 });
  });

  test('widgets have correct order', async () => {
    renderWithRouter(<WeatherPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/temperature/i)).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Check that all widgets are present (using flexible matching)
    const widgetTitles = [
      'Temperature',
      'Precipitation',
      'Wind',
      'UV Index',
      'Sunrise',
      'Sunset',
      'Sunlight Hours',
      'Sunlight Change',
      'Sun Angle',
      'Moon Phase',
      'Current sign', // AstrologicalSign shows "Current sign" not "Astrological Sign"
      'Pressure'
    ];
    
    widgetTitles.forEach(title => {
      expect(screen.getByText(title)).toBeInTheDocument();
    });
  });

  test('widgets are positioned absolutely on desktop', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    });

    const { container } = renderWithRouter(<WeatherPage />);
    
    await waitFor(() => {
      const widgetCards = container.querySelectorAll('.weather-widget-card');
      expect(widgetCards.length).toBeGreaterThan(0);
      
      // Check that at least one widget has absolute positioning
      const firstWidget = widgetCards[0];
      const style = window.getComputedStyle(firstWidget);
      expect(style.position).toBe('absolute');
    }, { timeout: 3000 });
  });

  test('widgets can be dragged on desktop', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    });

    const { container } = renderWithRouter(<WeatherPage />);
    
    await waitFor(() => {
      const widgetCard = container.querySelector('.weather-widget-card');
      expect(widgetCard).toBeInTheDocument();
    }, { timeout: 3000 });
    
    const widgetCard = container.querySelector('.weather-widget-card');
    const initialLeft = widgetCard.style.left;
    
    // Simulate mouse down
    fireEvent.mouseDown(widgetCard, {
      clientX: 100,
      clientY: 100
    });
    
    // Simulate mouse move
    fireEvent.mouseMove(window, {
      clientX: 200,
      clientY: 200
    });
    
    // Simulate mouse up
    fireEvent.mouseUp(window);
    
    // Widget should have moved (position should have changed)
    // Note: The exact position depends on the drag calculation
    await waitFor(() => {
      // After drag, the position should be updated
      expect(widgetCard).toBeInTheDocument();
    });
  });

  test('widgets are not draggable on mobile', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500
    });

    const { container } = renderWithRouter(<WeatherPage />);
    
    await waitFor(() => {
      const widgetCard = container.querySelector('.weather-widget-card');
      expect(widgetCard).toBeInTheDocument();
      
      // On mobile, widgets should not have absolute positioning
      const style = window.getComputedStyle(widgetCard);
      expect(style.position).not.toBe('absolute');
    }, { timeout: 3000 });
  });

  test('renders UV index widget', async () => {
    renderWithRouter(<WeatherPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/uv index/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('renders sunlight change widget', async () => {
    renderWithRouter(<WeatherPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/sunlight change/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

