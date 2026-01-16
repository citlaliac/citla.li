import React from 'react';
import { render, screen } from '@testing-library/react';
import SunlightHours from '../SunlightHours';

describe('SunlightHours Component', () => {
  test('renders sunlight hours component', () => {
    render(<SunlightHours hours={10.5} maxHours={15.0} minHours={9.0} />);
    
    const component = document.querySelector('.weather-sunlight-hours');
    expect(component).toBeInTheDocument();
  });

  test('displays hours value correctly', () => {
    render(<SunlightHours hours={10.5} maxHours={15.0} minHours={9.0} />);
    
    expect(screen.getByText('10.5 hrs')).toBeInTheDocument();
  });

  test('displays title', () => {
    render(<SunlightHours hours={10.5} maxHours={15.0} minHours={9.0} />);
    
    expect(screen.getByText('Sunlight Hours')).toBeInTheDocument();
  });

  test('calculates percentage correctly for minimum hours', () => {
    const { container } = render(<SunlightHours hours={9.0} maxHours={15.0} minHours={9.0} />);
    
    const barFill = container.querySelector('.weather-sunlight-hours-bar-fill');
    expect(barFill).toHaveStyle({ width: '0%' });
    
    const sunIcon = container.querySelector('.weather-sunlight-hours-icon');
    expect(sunIcon).toHaveStyle({ left: '0%' });
  });

  test('calculates percentage correctly for maximum hours', () => {
    const { container } = render(<SunlightHours hours={15.0} maxHours={15.0} minHours={9.0} />);
    
    const barFill = container.querySelector('.weather-sunlight-hours-bar-fill');
    expect(barFill).toHaveStyle({ width: '100%' });
    
    const sunIcon = container.querySelector('.weather-sunlight-hours-icon');
    expect(sunIcon).toHaveStyle({ left: '100%' });
  });

  test('calculates percentage correctly for middle value', () => {
    // 12 hours is halfway between 9 and 15, so should be 50%
    const { container } = render(<SunlightHours hours={12.0} maxHours={15.0} minHours={9.0} />);
    
    const barFill = container.querySelector('.weather-sunlight-hours-bar-fill');
    expect(barFill).toHaveStyle({ width: '50%' });
    
    const sunIcon = container.querySelector('.weather-sunlight-hours-icon');
    expect(sunIcon).toHaveStyle({ left: '50%' });
  });

  test('handles hours below minimum (clamps to 0%)', () => {
    const { container } = render(<SunlightHours hours={8.0} maxHours={15.0} minHours={9.0} />);
    
    const barFill = container.querySelector('.weather-sunlight-hours-bar-fill');
    expect(barFill).toHaveStyle({ width: '0%' });
  });

  test('handles hours above maximum (clamps to 100%)', () => {
    const { container } = render(<SunlightHours hours={16.0} maxHours={15.0} minHours={9.0} />);
    
    const barFill = container.querySelector('.weather-sunlight-hours-bar-fill');
    expect(barFill).toHaveStyle({ width: '100%' });
  });

  test('uses default minHours when not provided', () => {
    // Without minHours, should default to 9.0
    // 10.5 hours with max 15.0 and min 9.0 = (10.5 - 9.0) / (15.0 - 9.0) = 25%
    const { container } = render(<SunlightHours hours={10.5} maxHours={15.0} />);
    
    const barFill = container.querySelector('.weather-sunlight-hours-bar-fill');
    expect(barFill).toHaveStyle({ width: '25%' });
  });

  test('renders sun icon', () => {
    const { container } = render(<SunlightHours hours={12.0} maxHours={15.0} minHours={9.0} />);
    
    const sunIcon = container.querySelector('.weather-sunlight-hours-icon');
    expect(sunIcon).toBeInTheDocument();
    expect(sunIcon.textContent).toBe('☀️');
  });

  test('renders progress bar', () => {
    const { container } = render(<SunlightHours hours={12.0} maxHours={15.0} minHours={9.0} />);
    
    const bar = container.querySelector('.weather-sunlight-hours-bar');
    expect(bar).toBeInTheDocument();
    
    const barFill = container.querySelector('.weather-sunlight-hours-bar-fill');
    expect(barFill).toBeInTheDocument();
  });
});
