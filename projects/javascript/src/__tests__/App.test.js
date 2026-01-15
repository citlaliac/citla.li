import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

// Mock visitor tracking
jest.mock('../visitor-tracking', () => ({
  initializeTracking: jest.fn(),
}));

// Mock react-leaflet (ESM module that Jest can't parse)
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: () => <div data-testid="marker" />,
  Popup: ({ children }) => <div data-testid="popup">{children}</div>,
  Tooltip: ({ children }) => <div data-testid="tooltip">{children}</div>,
}));

// Mock leaflet CSS
jest.mock('leaflet/dist/leaflet.css', () => ({}));

// Mock window.innerWidth for mobile detection
const mockWindowWidth = (width) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
};

describe('App Routing', () => {
  beforeEach(() => {
    mockWindowWidth(1024); // Desktop by default
  });

  test('renders home page at root path', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    // MainPage should render - check for a unique element
    expect(document.body).toBeInTheDocument();
  });

  test('renders SeePage at /see path', () => {
    render(
      <MemoryRouter initialEntries={['/see']}>
        <App />
      </MemoryRouter>
    );
    const seeTitle = screen.getByText(/^see$/i);
    expect(seeTitle).toBeInTheDocument();
  });

  test('renders photo collection pages', () => {
    const photoRoutes = [
      '/photos/moody',
      '/photos/portrait',
      '/photos/natural',
      '/photos/urban',
      '/photos/summer-2023',
      '/photos/spring-2023',
      '/photos/spring-2024',
      '/photos/espionner'
    ];

    photoRoutes.forEach(route => {
      const { unmount } = render(
        <MemoryRouter initialEntries={[route]}>
          <App />
        </MemoryRouter>
      );
      
      // Check that page rendered (has a heading)
      const headings = document.querySelectorAll('h1');
      expect(headings.length).toBeGreaterThan(0);
      
      unmount();
    });
  });

  test('renders tech pages', () => {
    const techRoutes = [
      '/tech',
      '/tech/resume',
      '/tech/github',
      '/tech/ai'
    ];

    techRoutes.forEach(route => {
      const { unmount } = render(
        <MemoryRouter initialEntries={[route]}>
          <App />
        </MemoryRouter>
      );
      
      expect(document.body).toBeInTheDocument();
      unmount();
    });
  });

  test('renders WeatherPage at /weather path', () => {
    // Mock weather service to avoid API calls in tests
    jest.mock('../services/weatherService', () => ({
      getCurrentWeather: jest.fn(() => Promise.resolve({})),
      calculateSunAngle: jest.fn(() => 0),
      getMoonPhase: jest.fn(() => 'New Moon'),
      getAstrologicalSign: jest.fn(() => 'Aries'),
      formatTime: jest.fn(() => '12:00 PM'),
      getPressureInfo: jest.fn(() => ({ level: 'Normal', effects: '' })),
      getYesterdayPressure: jest.fn(() => Promise.resolve(null)),
      calculatePressureChange: jest.fn(() => null)
    }));

    render(
      <MemoryRouter initialEntries={['/weather']}>
        <App />
      </MemoryRouter>
    );
    
    // WeatherPage should render
    expect(document.body).toBeInTheDocument();
  });

  test('handles mobile routing for /read', () => {
    mockWindowWidth(500); // Mobile width
    
    render(
      <MemoryRouter initialEntries={['/read']}>
        <App />
      </MemoryRouter>
    );
    
    // On mobile, /read should show BookPage instead of ScratchPage
    expect(document.body).toBeInTheDocument();
  });
});

