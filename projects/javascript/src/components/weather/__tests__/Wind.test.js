import React from 'react';
import { render, screen } from '@testing-library/react';
import Wind from '../Wind';

describe('Wind Component', () => {
  test('renders wind component', () => {
    render(<Wind speed={10} direction={180} />);
    
    const component = document.querySelector('.weather-wind');
    expect(component).toBeInTheDocument();
  });

  test('displays wind speed correctly', () => {
    render(<Wind speed={15} direction={180} />);
    
    expect(screen.getByText('15 mph')).toBeInTheDocument();
  });

  test('displays title', () => {
    render(<Wind speed={10} direction={180} />);
    
    expect(screen.getByText('Wind')).toBeInTheDocument();
  });

  test('converts wind direction to cardinal directions', () => {
    const { rerender } = render(<Wind speed={10} direction={0} />);
    expect(screen.getByText('N')).toBeInTheDocument();
    
    rerender(<Wind speed={10} direction={45} />);
    expect(screen.getByText('NE')).toBeInTheDocument();
    
    rerender(<Wind speed={10} direction={90} />);
    expect(screen.getByText('E')).toBeInTheDocument();
    
    rerender(<Wind speed={10} direction={135} />);
    expect(screen.getByText('SE')).toBeInTheDocument();
    
    rerender(<Wind speed={10} direction={180} />);
    expect(screen.getByText('S')).toBeInTheDocument();
    
    rerender(<Wind speed={10} direction={225} />);
    expect(screen.getByText('SW')).toBeInTheDocument();
    
    rerender(<Wind speed={10} direction={270} />);
    expect(screen.getByText('W')).toBeInTheDocument();
    
    rerender(<Wind speed={10} direction={315} />);
    expect(screen.getByText('NW')).toBeInTheDocument();
  });

  test('determines arrow size correctly', () => {
    const { container, rerender } = render(<Wind speed={5} direction={180} />);
    let arrow = container.querySelector('.weather-wind-arrow');
    expect(arrow).toHaveClass('weather-wind-arrow-small');
    
    rerender(<Wind speed={15} direction={180} />);
    arrow = container.querySelector('.weather-wind-arrow');
    expect(arrow).toHaveClass('weather-wind-arrow-medium');
    
    rerender(<Wind speed={25} direction={180} />);
    arrow = container.querySelector('.weather-wind-arrow');
    expect(arrow).toHaveClass('weather-wind-arrow-large');
  });

  test('rounds wind speed', () => {
    render(<Wind speed={15.7} direction={180} />);
    
    expect(screen.getByText('16 mph')).toBeInTheDocument();
  });

  test('handles null/undefined speed (defaults to 0)', () => {
    render(<Wind speed={null} direction={180} />);
    
    expect(screen.getByText('0 mph')).toBeInTheDocument();
  });

  test('handles null/undefined direction (defaults to 0/N)', () => {
    render(<Wind speed={10} direction={null} />);
    
    expect(screen.getByText('N')).toBeInTheDocument();
  });

  test('renders wind arrow', () => {
    const { container } = render(<Wind speed={10} direction={180} />);
    
    const arrow = container.querySelector('.weather-wind-arrow');
    expect(arrow).toBeInTheDocument();
    expect(arrow.textContent).toBe('→');
  });
});
