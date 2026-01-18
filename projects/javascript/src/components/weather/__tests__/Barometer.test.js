import React from 'react';
import { render, screen } from '@testing-library/react';
import Barometer from '../Barometer';

describe('Barometer Component', () => {
  test('renders barometer component', () => {
    render(<Barometer pressure={1013} />);
    
    const component = document.querySelector('.weather-barometer');
    expect(component).toBeInTheDocument();
  });

  test('displays pressure value correctly', () => {
    render(<Barometer pressure={1013.5} />);
    
    expect(screen.getByText('1013.5')).toBeInTheDocument();
    expect(screen.getByText('hPa')).toBeInTheDocument();
  });

  test('renders barometer glass and container', () => {
    const { container } = render(<Barometer pressure={1013} />);
    
    const barometerContainer = container.querySelector('.weather-barometer-container');
    const glass = container.querySelector('.weather-barometer-glass');
    
    expect(barometerContainer).toBeInTheDocument();
    expect(glass).toBeInTheDocument();
  });

  test('renders all three pressure zones', () => {
    const { container } = render(<Barometer pressure={1013} />);
    
    const lowZone = container.querySelector('.weather-barometer-zone-low');
    const normalZone = container.querySelector('.weather-barometer-zone-normal');
    const highZone = container.querySelector('.weather-barometer-zone-high');
    
    expect(lowZone).toBeInTheDocument();
    expect(normalZone).toBeInTheDocument();
    expect(highZone).toBeInTheDocument();
  });

  test('renders liquid with correct height for normal pressure', () => {
    // 1013 is in normal range (980-1020)
    // Percentage = ((1013 - 930) / (1030 - 930)) * 100 = 83%
    const { container } = render(<Barometer pressure={1013} />);
    
    const liquid = container.querySelector('.weather-barometer-liquid');
    expect(liquid).toBeInTheDocument();
    const height = liquid.style.height;
    expect(height).toContain('%');
    expect(parseFloat(height)).toBeCloseTo(83, 0);
  });

  test('renders zone markings', () => {
    const { container } = render(<Barometer pressure={1013} />);
    
    const marks = container.querySelectorAll('.weather-barometer-tube-mark');
    expect(marks.length).toBe(3); // LOW, MEDIUM, HIGH
    
    expect(screen.getByText('LOW')).toBeInTheDocument();
    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
  });

  test('calculates pressure percentage correctly for minimum', () => {
    const { container } = render(<Barometer pressure={930} />);
    
    const liquid = container.querySelector('.weather-barometer-liquid');
    expect(liquid).toHaveStyle({ height: '0%' });
  });

  test('calculates pressure percentage correctly for maximum', () => {
    const { container } = render(<Barometer pressure={1030} />);
    
    const liquid = container.querySelector('.weather-barometer-liquid');
    expect(liquid).toHaveStyle({ height: '100%' });
  });

  test('determines zone correctly for low pressure', () => {
    const { container } = render(<Barometer pressure={970} />);
    
    const liquid = container.querySelector('.weather-barometer-liquid');
    // Low pressure should use darker blue gradient
    expect(liquid).toHaveStyle({ 
      background: expect.stringContaining('#2E5C8A')
    });
  });

  test('determines zone correctly for normal pressure', () => {
    const { container } = render(<Barometer pressure={1000} />);
    
    const liquid = container.querySelector('.weather-barometer-liquid');
    // Normal pressure should use medium blue gradient
    expect(liquid).toHaveStyle({ 
      background: expect.stringContaining('#3D7BA8')
    });
  });

  test('determines zone correctly for high pressure', () => {
    const { container } = render(<Barometer pressure={1025} />);
    
    const liquid = container.querySelector('.weather-barometer-liquid');
    // High pressure should use lighter blue gradient
    expect(liquid).toHaveStyle({ 
      background: expect.stringContaining('#5BA3D3')
    });
  });

  test('renders shimmer effect', () => {
    const { container } = render(<Barometer pressure={1013} />);
    
    const shimmer = container.querySelector('.weather-barometer-shimmer');
    expect(shimmer).toBeInTheDocument();
  });
});
