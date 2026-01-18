import React from 'react';
import { render, screen } from '@testing-library/react';
import SunlightChange from '../SunlightChange';

describe('SunlightChange Component', () => {
  test('renders sunlight change component', () => {
    render(<SunlightChange rateOfChange={1.65} />);
    
    const component = document.querySelector('.weather-sunlight-change');
    expect(component).toBeInTheDocument();
  });

  test('displays title', () => {
    render(<SunlightChange rateOfChange={1.65} />);
    
    expect(screen.getByText('Sunlight Change')).toBeInTheDocument();
  });

  test('formats positive rate correctly as +M:SS', () => {
    // 1.65 minutes = 1 min 39 sec
    render(<SunlightChange rateOfChange={1.65} />);
    
    expect(screen.getByText('+1:39')).toBeInTheDocument();
  });

  test('formats negative rate correctly as -M:SS', () => {
    // -1.65 minutes = -1 min 39 sec
    render(<SunlightChange rateOfChange={-1.65} />);
    
    expect(screen.getByText('-1:39')).toBeInTheDocument();
  });

  test('formats zero rate correctly', () => {
    render(<SunlightChange rateOfChange={0} />);
    
    expect(screen.getByText('0:00')).toBeInTheDocument();
  });

  test('shows up arrow when gaining', () => {
    const { container } = render(<SunlightChange rateOfChange={1.65} />);
    
    const arrow = container.querySelector('.weather-sunlight-change-arrow');
    expect(arrow).toBeInTheDocument();
    expect(arrow.textContent).toBe('↑');
    expect(arrow).toHaveClass('arrow-up');
  });

  test('shows down arrow when losing', () => {
    const { container } = render(<SunlightChange rateOfChange={-1.65} />);
    
    const arrow = container.querySelector('.weather-sunlight-change-arrow');
    expect(arrow).toBeInTheDocument();
    expect(arrow.textContent).toBe('↓');
    expect(arrow).toHaveClass('arrow-down');
  });

  test('shows neutral arrow when no change', () => {
    const { container } = render(<SunlightChange rateOfChange={0} />);
    
    const arrow = container.querySelector('.weather-sunlight-change-arrow');
    expect(arrow).toBeInTheDocument();
    expect(arrow.textContent).toBe('→');
    expect(arrow).toHaveClass('arrow-neutral');
  });

  test('renders sun icon', () => {
    const { container } = render(<SunlightChange rateOfChange={1.65} />);
    
    const sun = container.querySelector('.weather-sunlight-change-sun');
    expect(sun).toBeInTheDocument();
    expect(sun.textContent).toBe('☀️');
  });

  test('renders meter SVG', () => {
    const { container } = render(<SunlightChange rateOfChange={1.65} />);
    
    const svg = container.querySelector('.weather-sunlight-change-meter-svg');
    expect(svg).toBeInTheDocument();
  });

  test('handles null/undefined rateOfChange (defaults to 0)', () => {
    render(<SunlightChange rateOfChange={null} />);
    
    expect(screen.getByText('0:00')).toBeInTheDocument();
  });

  test('calculates intensity correctly for maximum gain', () => {
    // Max gain is 2:43 = 2.7167 minutes
    const maxGain = 2 + 43/60;
    const { container } = render(<SunlightChange rateOfChange={maxGain} />);
    
    const fill = container.querySelector('.weather-sunlight-change-meter-fill');
    expect(fill).toBeInTheDocument();
    // Should use orange color for gaining
    expect(fill).toHaveAttribute('stroke', '#FF9800');
  });

  test('calculates intensity correctly for maximum loss', () => {
    // Max loss is 2:40 = 2.6667 minutes
    const maxLoss = 2 + 40/60;
    const { container } = render(<SunlightChange rateOfChange={-maxLoss} />);
    
    const fill = container.querySelector('.weather-sunlight-change-meter-fill');
    expect(fill).toBeInTheDocument();
    // Should use pastel blue color for losing
    expect(fill).toHaveAttribute('stroke', '#87CEEB');
  });
});
