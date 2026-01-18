import React from 'react';
import { render, screen } from '@testing-library/react';
import Precipitation from '../Precipitation';

describe('Precipitation Component', () => {
  test('renders precipitation component', () => {
    render(<Precipitation isRaining={false} isSnowing={false} />);
    
    const component = document.querySelector('.weather-precipitation');
    expect(component).toBeInTheDocument();
  });

  test('displays clear skies when not raining or snowing', () => {
    render(<Precipitation isRaining={false} isSnowing={false} />);
    
    expect(screen.getByText('Clear skies')).toBeInTheDocument();
    expect(screen.getByText('☀️')).toBeInTheDocument();
  });

  test('displays raining when isRaining is true', () => {
    render(<Precipitation isRaining={true} isSnowing={false} />);
    
    expect(screen.getByText('Raining')).toBeInTheDocument();
    expect(screen.getByText('💧')).toBeInTheDocument();
  });

  test('displays snowing when isSnowing is true', () => {
    render(<Precipitation isRaining={false} isSnowing={true} />);
    
    expect(screen.getByText('Snowing')).toBeInTheDocument();
    expect(screen.getByText('❄️')).toBeInTheDocument();
  });

  test('prioritizes raining over snowing when both are true', () => {
    render(<Precipitation isRaining={true} isSnowing={true} />);
    
    expect(screen.getByText('Raining')).toBeInTheDocument();
    expect(screen.getByText('💧')).toBeInTheDocument();
    expect(screen.queryByText('Snowing')).not.toBeInTheDocument();
  });

  test('displays title', () => {
    render(<Precipitation isRaining={false} isSnowing={false} />);
    
    expect(screen.getByText('Precipitation')).toBeInTheDocument();
  });

  test('applies correct CSS class for clear', () => {
    const { container } = render(<Precipitation isRaining={false} isSnowing={false} />);
    
    const icon = container.querySelector('.weather-precipitation-icon');
    expect(icon).toHaveClass('weather-precipitation-clear');
  });

  test('applies correct CSS class for rain', () => {
    const { container } = render(<Precipitation isRaining={true} isSnowing={false} />);
    
    const icon = container.querySelector('.weather-precipitation-icon');
    expect(icon).toHaveClass('weather-precipitation-rain');
  });

  test('applies correct CSS class for snow', () => {
    const { container } = render(<Precipitation isRaining={false} isSnowing={true} />);
    
    const icon = container.querySelector('.weather-precipitation-icon');
    expect(icon).toHaveClass('weather-precipitation-snow');
  });
});
