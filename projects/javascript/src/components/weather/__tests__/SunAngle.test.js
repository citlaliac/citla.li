import React from 'react';
import { render, screen } from '@testing-library/react';
import SunAngle from '../SunAngle';

describe('SunAngle Component', () => {
  test('renders sun angle component', () => {
    render(<SunAngle angle={45} />);
    
    const component = document.querySelector('.weather-sun-angle');
    expect(component).toBeInTheDocument();
  });

  test('displays angle value correctly for positive angle', () => {
    render(<SunAngle angle={45.5} />);
    
    expect(screen.getByText('45.5°')).toBeInTheDocument();
  });

  test('displays "Below horizon" for negative angle', () => {
    render(<SunAngle angle={-10} />);
    
    expect(screen.getByText('Below horizon')).toBeInTheDocument();
  });

  test('displays title', () => {
    render(<SunAngle angle={45} />);
    
    expect(screen.getByText('Sun Angle')).toBeInTheDocument();
  });

  test('renders scene elements', () => {
    const { container } = render(<SunAngle angle={45} />);
    
    const scene = container.querySelector('.weather-sun-angle-scene');
    const horizon = container.querySelector('.weather-sun-angle-horizon');
    const line = container.querySelector('.weather-sun-angle-line');
    const icon = container.querySelector('.weather-sun-angle-icon');
    
    expect(scene).toBeInTheDocument();
    expect(horizon).toBeInTheDocument();
    expect(line).toBeInTheDocument();
    expect(icon).toBeInTheDocument();
  });

  test('renders sun icon', () => {
    const { container } = render(<SunAngle angle={45} />);
    
    const icon = container.querySelector('.weather-sun-angle-icon');
    expect(icon.textContent).toBe('☀️');
  });

  test('clamps angle to -90 to 90 range for visual but displays actual value', () => {
    const { container } = render(<SunAngle angle={120} />);
    
    const icon = container.querySelector('.weather-sun-angle-icon');
    expect(icon).toBeInTheDocument();
    // Component displays the actual angle value, not clamped
    expect(screen.getByText('120.0°')).toBeInTheDocument();
  });

  test('handles negative angles below -90', () => {
    render(<SunAngle angle={-120} />);
    
    // Component displays "Below horizon" for any negative or zero angle
    expect(screen.getByText('Below horizon')).toBeInTheDocument();
  });

  test('displays "Below horizon" for zero angle', () => {
    render(<SunAngle angle={0} />);
    
    // Component shows "Below horizon" when angle <= 0
    expect(screen.getByText('Below horizon')).toBeInTheDocument();
  });
});
