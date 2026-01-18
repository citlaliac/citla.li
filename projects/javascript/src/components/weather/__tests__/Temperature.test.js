import React from 'react';
import { render, screen } from '@testing-library/react';
import Temperature from '../Temperature';

describe('Temperature Component', () => {
  test('renders temperature component', () => {
    render(<Temperature temp={72} feelsLike={70} />);
    
    const component = document.querySelector('.weather-temperature');
    expect(component).toBeInTheDocument();
  });

  test('displays temperature value correctly', () => {
    render(<Temperature temp={72} feelsLike={70} />);
    
    expect(screen.getByText('72°F')).toBeInTheDocument();
  });

  test('displays title', () => {
    render(<Temperature temp={72} feelsLike={70} />);
    
    expect(screen.getByText('Temperature')).toBeInTheDocument();
  });

  test('renders thermometer elements', () => {
    const { container } = render(<Temperature temp={72} feelsLike={70} />);
    
    const thermometer = container.querySelector('.weather-temperature-thermometer');
    const bulb = container.querySelector('.weather-temperature-bulb');
    const stem = container.querySelector('.weather-temperature-stem');
    const mercury = container.querySelector('.weather-temperature-mercury');
    
    expect(thermometer).toBeInTheDocument();
    expect(bulb).toBeInTheDocument();
    expect(stem).toBeInTheDocument();
    expect(mercury).toBeInTheDocument();
  });

  test('calculates mercury height correctly for minimum temperature', () => {
    const { container } = render(<Temperature temp={-20} feelsLike={-20} />);
    
    const mercury = container.querySelector('.weather-temperature-mercury');
    expect(mercury).toHaveStyle({ height: '0%' });
  });

  test('calculates mercury height correctly for maximum temperature', () => {
    const { container } = render(<Temperature temp={120} feelsLike={120} />);
    
    const mercury = container.querySelector('.weather-temperature-mercury');
    expect(mercury).toHaveStyle({ height: '100%' });
  });

  test('calculates mercury height correctly for middle temperature', () => {
    // 50°F is halfway between -20 and 120, so should be 50%
    const { container } = render(<Temperature temp={50} feelsLike={50} />);
    
    const mercury = container.querySelector('.weather-temperature-mercury');
    const expectedHeight = ((50 - (-20)) / (120 - (-20))) * 100;
    expect(mercury).toHaveStyle({ height: `${expectedHeight}%` });
  });

  test('rounds temperature value', () => {
    render(<Temperature temp={72.7} feelsLike={70} />);
    
    expect(screen.getByText('73°F')).toBeInTheDocument();
  });

  test('handles temperatures below minimum (clamps to 0%)', () => {
    const { container } = render(<Temperature temp={-30} feelsLike={-30} />);
    
    const mercury = container.querySelector('.weather-temperature-mercury');
    expect(mercury).toHaveStyle({ height: '0%' });
  });

  test('handles temperatures above maximum (clamps to 100%)', () => {
    const { container } = render(<Temperature temp={130} feelsLike={130} />);
    
    const mercury = container.querySelector('.weather-temperature-mercury');
    expect(mercury).toHaveStyle({ height: '100%' });
  });
});
