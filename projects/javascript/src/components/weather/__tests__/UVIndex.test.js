import React from 'react';
import { render, screen } from '@testing-library/react';
import UVIndex from '../UVIndex';

describe('UVIndex Component', () => {
  test('renders UV index component', () => {
    render(<UVIndex uvIndex={5} />);
    
    const component = document.querySelector('.weather-uv-index');
    expect(component).toBeInTheDocument();
  });

  test('displays UV index value correctly', () => {
    render(<UVIndex uvIndex={5.5} />);
    
    expect(screen.getByText('5.5')).toBeInTheDocument();
  });

  test('displays title', () => {
    render(<UVIndex uvIndex={5} />);
    
    expect(screen.getByText('UV Index')).toBeInTheDocument();
  });

  test('displays scale labels', () => {
    render(<UVIndex uvIndex={5} />);
    
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  test('calculates percentage correctly', () => {
    const { container } = render(<UVIndex uvIndex={6} />);
    
    const fill = container.querySelector('.weather-uv-scale-fill');
    const indicator = container.querySelector('.weather-uv-scale-indicator');
    
    // 6 / 12 = 50%
    expect(fill).toHaveStyle({ width: '50%' });
    expect(indicator).toHaveStyle({ left: '50%' });
  });

  test('determines UV level and color correctly for Low', () => {
    const { container } = render(<UVIndex uvIndex={2} />);
    
    const fill = container.querySelector('.weather-uv-scale-fill');
    expect(fill).toHaveStyle({ backgroundColor: '#4CAF50' }); // Green
  });

  test('determines UV level and color correctly for Moderate', () => {
    const { container } = render(<UVIndex uvIndex={4} />);
    
    const fill = container.querySelector('.weather-uv-scale-fill');
    expect(fill).toHaveStyle({ backgroundColor: '#FFC107' }); // Yellow
  });

  test('determines UV level and color correctly for High', () => {
    const { container } = render(<UVIndex uvIndex={7} />);
    
    const fill = container.querySelector('.weather-uv-scale-fill');
    expect(fill).toHaveStyle({ backgroundColor: '#FF9800' }); // Orange
  });

  test('determines UV level and color correctly for Very High', () => {
    const { container } = render(<UVIndex uvIndex={9} />);
    
    const fill = container.querySelector('.weather-uv-scale-fill');
    expect(fill).toHaveStyle({ backgroundColor: '#F44336' }); // Red
  });

  test('determines UV level and color correctly for Extreme', () => {
    const { container } = render(<UVIndex uvIndex={11} />);
    
    const fill = container.querySelector('.weather-uv-scale-fill');
    expect(fill).toHaveStyle({ backgroundColor: '#9C27B0' }); // Purple
  });

  test('handles null/undefined UV index (defaults to 0)', () => {
    render(<UVIndex uvIndex={null} />);
    
    expect(screen.getByText('0.0')).toBeInTheDocument();
  });

  test('clamps percentage to 100% for values above 12', () => {
    const { container } = render(<UVIndex uvIndex={15} />);
    
    const fill = container.querySelector('.weather-uv-scale-fill');
    expect(fill).toHaveStyle({ width: '100%' });
  });

  test('renders scale elements', () => {
    const { container } = render(<UVIndex uvIndex={5} />);
    
    const scale = container.querySelector('.weather-uv-scale');
    const track = container.querySelector('.weather-uv-scale-track');
    const fill = container.querySelector('.weather-uv-scale-fill');
    const indicator = container.querySelector('.weather-uv-scale-indicator');
    const dot = container.querySelector('.weather-uv-scale-dot');
    
    expect(scale).toBeInTheDocument();
    expect(track).toBeInTheDocument();
    expect(fill).toBeInTheDocument();
    expect(indicator).toBeInTheDocument();
    expect(dot).toBeInTheDocument();
  });
});
