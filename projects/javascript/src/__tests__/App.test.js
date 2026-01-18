import React from 'react';
import { render, screen } from '@testing-library/react';
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

  test('renders app without crashing', () => {
    render(<App />);
    // App should render - check for app container
    expect(document.querySelector('.app-container')).toBeInTheDocument();
  });

  // Note: Individual route testing is done in each page's test file
  // App.test.js focuses on ensuring App renders correctly
});

