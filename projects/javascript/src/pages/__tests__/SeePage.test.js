import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SeePage from '../SeePage';

// Mock Header and Footer
jest.mock('../../components/Header', () => {
  return function MockHeader() {
    return <div data-testid="header">Header</div>;
  };
});

jest.mock('../../components/Footer', () => {
  return function MockFooter() {
    return <div data-testid="footer">Footer</div>;
  };
});

// Mock useSEO hook
jest.mock('../../hooks/useSEO', () => ({
  useSEO: jest.fn(),
}));

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('SeePage', () => {
  test('renders the page title', () => {
    renderWithRouter(<SeePage />);
    const title = screen.getByText(/^see$/i);
    expect(title).toBeInTheDocument();
  });

  test('renders all photo collection links', () => {
    renderWithRouter(<SeePage />);
    
    const collections = [
      'summer 2023',
      'spring 2023',
      'spring 2024',
      'portrait',
      'moody',
      'natural',
      'urban',
      'espionner'
    ];
    
    collections.forEach(collection => {
      const link = screen.getByText(new RegExp(collection, 'i'));
      expect(link).toBeInTheDocument();
    });
  });

  test('collection links have correct paths', () => {
    renderWithRouter(<SeePage />);
    
    const moodyLink = screen.getByText(/moody/i).closest('a');
    expect(moodyLink).toHaveAttribute('href', '/photos/moody');
    
    const portraitLink = screen.getByText(/portrait/i).closest('a');
    expect(portraitLink).toHaveAttribute('href', '/photos/portrait');
  });

  test('collection images have correct paths', () => {
    renderWithRouter(<SeePage />);
    
    const images = screen.getAllByRole('img');
    const collectionImages = images.filter(img => 
      img.src && img.src.includes('/assets/photos/')
    );
    
    expect(collectionImages.length).toBeGreaterThan(0);
    
    // Check that images use absolute paths starting with /assets
    collectionImages.forEach(img => {
      expect(img.src).toMatch(/^https?:\/\/[^/]+\/assets\/photos\//);
    });
  });

  test('renders Header and Footer', () => {
    renderWithRouter(<SeePage />);
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });
});

