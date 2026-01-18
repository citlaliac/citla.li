import React from 'react';
import { render, screen } from '@testing-library/react';
import Sunrise from '../Sunrise';

describe('Sunrise Component', () => {
  test('renders sunrise component', () => {
    render(<Sunrise time="6:30 AM" />);
    
    const component = document.querySelector('.weather-sunrise');
    expect(component).toBeInTheDocument();
  });

  test('displays time correctly', () => {
    render(<Sunrise time="6:30 AM" />);
    
    expect(screen.getByText('6:30 AM')).toBeInTheDocument();
  });

  test('displays title', () => {
    render(<Sunrise time="6:30 AM" />);
    
    expect(screen.getByText('Sunrise')).toBeInTheDocument();
  });

  test('renders scene elements', () => {
    const { container } = render(<Sunrise time="6:30 AM" />);
    
    const scene = container.querySelector('.weather-sunrise-scene');
    const horizon = container.querySelector('.weather-sunrise-horizon');
    const sun = container.querySelector('.weather-sunrise-sun');
    
    expect(scene).toBeInTheDocument();
    expect(horizon).toBeInTheDocument();
    expect(sun).toBeInTheDocument();
  });

  test('renders sun icon', () => {
    const { container } = render(<Sunrise time="6:30 AM" />);
    
    const sun = container.querySelector('.weather-sunrise-sun');
    expect(sun.textContent).toBe('☀️');
  });
});
