import React from 'react';
import { render, screen } from '@testing-library/react';
import Moon from '../Moon';

// Mock the weatherService
jest.mock('../../../services/weatherService', () => ({
  getMoonPhaseValue: jest.fn((date) => {
    // Return a specific phase for testing (0.5 = Full Moon)
    return 0.5;
  })
}));

describe('Moon Component', () => {
  test('renders moon component', () => {
    const testDate = new Date('2026-01-15T12:00:00Z');
    render(<Moon date={testDate} />);
    
    const moon = document.querySelector('.weather-moon');
    expect(moon).toBeInTheDocument();
  });

  test('renders moon circle', () => {
    const testDate = new Date('2026-01-15T12:00:00Z');
    render(<Moon date={testDate} />);
    
    const moonCircle = document.querySelector('.weather-moon-circle');
    expect(moonCircle).toBeInTheDocument();
  });

  test('renders moon surface and shadow', () => {
    const testDate = new Date('2026-01-15T12:00:00Z');
    render(<Moon date={testDate} />);
    
    const moonSurface = document.querySelector('.weather-moon-surface');
    const moonShadow = document.querySelector('.weather-moon-shadow');
    
    expect(moonSurface).toBeInTheDocument();
    expect(moonShadow).toBeInTheDocument();
  });

  test('renders craters', () => {
    const testDate = new Date('2026-01-15T12:00:00Z');
    render(<Moon date={testDate} />);
    
    const craters = document.querySelectorAll('.weather-moon-crater');
    expect(craters.length).toBeGreaterThan(0);
  });
});

