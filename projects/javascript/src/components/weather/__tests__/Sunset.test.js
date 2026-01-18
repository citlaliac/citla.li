import React from 'react';
import { render, screen } from '@testing-library/react';
import Sunset from '../Sunset';

describe('Sunset Component', () => {
  test('renders sunset component', () => {
    render(<Sunset time="7:45 PM" />);
    
    const component = document.querySelector('.weather-sunset');
    expect(component).toBeInTheDocument();
  });

  test('displays time correctly', () => {
    render(<Sunset time="7:45 PM" />);
    
    expect(screen.getByText('7:45 PM')).toBeInTheDocument();
  });

  test('displays title', () => {
    render(<Sunset time="7:45 PM" />);
    
    expect(screen.getByText('Sunset')).toBeInTheDocument();
  });

  test('renders scene elements', () => {
    const { container } = render(<Sunset time="7:45 PM" />);
    
    const scene = container.querySelector('.weather-sunset-scene');
    const horizon = container.querySelector('.weather-sunset-horizon');
    const sun = container.querySelector('.weather-sunset-sun');
    
    expect(scene).toBeInTheDocument();
    expect(horizon).toBeInTheDocument();
    expect(sun).toBeInTheDocument();
  });

  test('renders sun icon', () => {
    const { container } = render(<Sunset time="7:45 PM" />);
    
    const sun = container.querySelector('.weather-sunset-sun');
    expect(sun.textContent).toBe('☀️');
  });
});
