import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MoodyPage from '../MoodyPage';

// Mock Header and Footer to simplify tests
jest.mock('../../../components/Header', () => {
  return function MockHeader() {
    return <div data-testid="header">Header</div>;
  };
});

jest.mock('../../../components/Footer', () => {
  return function MockFooter() {
    return <div data-testid="footer">Footer</div>;
  };
});

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('MoodyPage', () => {
  test('renders the page title', () => {
    renderWithRouter(<MoodyPage />);
    const title = screen.getByText(/moody/i);
    expect(title).toBeInTheDocument();
  });

  test('renders all photos with correct image paths', () => {
    renderWithRouter(<MoodyPage />);
    
    // Check that images are rendered with correct paths
    const images = screen.getAllByRole('img');
    const photoImages = images.filter(img => 
      img.src && img.src.includes('/assets/photos/moody/')
    );
    
    // Should have at least some photos rendered
    expect(photoImages.length).toBeGreaterThan(0);
    
    // Check first photo has correct path format
    const firstPhoto = photoImages[0];
    expect(firstPhoto.src).toContain('/assets/photos/moody/');
    expect(firstPhoto.src).toMatch(/\.jpg$/i);
  });

  test('all photos have alt text', () => {
    renderWithRouter(<MoodyPage />);
    
    const images = screen.getAllByRole('img');
    const photoImages = images.filter(img => 
      img.src && img.src.includes('/assets/photos/moody/')
    );
    
    photoImages.forEach(img => {
      expect(img).toHaveAttribute('alt');
      expect(img.getAttribute('alt')).toContain('Moody Collection');
    });
  });

  test('photo grid container exists', () => {
    renderWithRouter(<MoodyPage />);
    const grid = document.querySelector('.photo-grid');
    expect(grid).toBeInTheDocument();
  });

  test('renders Header and Footer', () => {
    renderWithRouter(<MoodyPage />);
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });
});

