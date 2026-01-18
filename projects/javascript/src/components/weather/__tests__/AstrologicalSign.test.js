import React from 'react';
import { render, screen } from '@testing-library/react';
import AstrologicalSign from '../AstrologicalSign';

describe('AstrologicalSign Component', () => {
  test('renders astrological sign component', () => {
    render(<AstrologicalSign sign="Capricorn" />);
    
    const component = document.querySelector('.weather-astro-sign');
    expect(component).toBeInTheDocument();
  });

  test('displays sign name correctly', () => {
    render(<AstrologicalSign sign="Capricorn" />);
    
    expect(screen.getByText('Capricorn')).toBeInTheDocument();
  });

  test('displays label', () => {
    render(<AstrologicalSign sign="Capricorn" />);
    
    expect(screen.getByText('Current sign')).toBeInTheDocument();
  });

  test('displays correct zodiac symbol for each sign', () => {
    const signs = [
      'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
    ];
    const symbols = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
    
    signs.forEach((sign, index) => {
      const { container } = render(<AstrologicalSign sign={sign} />);
      const star = container.querySelector('.weather-astro-sign-star');
      expect(star.textContent).toBe(symbols[index]);
    });
  });

  test('uses default symbol for unknown sign', () => {
    const { container } = render(<AstrologicalSign sign="Unknown" />);
    
    const star = container.querySelector('.weather-astro-sign-star');
    expect(star.textContent).toBe('⭐');
  });

  test('renders star element', () => {
    const { container } = render(<AstrologicalSign sign="Capricorn" />);
    
    const star = container.querySelector('.weather-astro-sign-star');
    expect(star).toBeInTheDocument();
  });
});
