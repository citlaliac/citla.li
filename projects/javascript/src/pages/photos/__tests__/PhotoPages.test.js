import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MoodyPage from '../MoodyPage';
import PortraitPage from '../PortraitPage';
import NaturalPage from '../NaturalPage';
import UrbanPage from '../UrbanPage';
import EspionnerPage from '../EspionnerPage';
import Summer2023Page from '../Summer2023Page';
import Spring2023Page from '../Spring2023Page';
import Spring2024Page from '../Spring2024Page';

// Mock Header and Footer
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

// Mock useSEO for PortraitPage
jest.mock('../../../hooks/useSEO', () => ({
  useSEO: jest.fn(),
}));

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Photo Pages - Image Path Tests', () => {
  const photoPages = [
    { name: 'MoodyPage', component: MoodyPage, album: 'moody' },
    { name: 'PortraitPage', component: PortraitPage, album: 'portrait' },
    { name: 'NaturalPage', component: NaturalPage, album: 'natural' },
    { name: 'UrbanPage', component: UrbanPage, album: 'urban' },
    { name: 'EspionnerPage', component: EspionnerPage, album: 'espionner' },
    { name: 'Summer2023Page', component: Summer2023Page, album: 'summer-2023' },
    { name: 'Spring2023Page', component: Spring2023Page, album: 'spring-2023' },
    { name: 'Spring2024Page', component: Spring2024Page, album: 'spring-2024' },
  ];

  photoPages.forEach(({ name, component: PageComponent, album }) => {
    describe(name, () => {
      test('renders without crashing', () => {
        renderWithRouter(<PageComponent />);
        expect(document.body).toBeInTheDocument();
      });

      test(`images use correct path format for ${album}`, () => {
        renderWithRouter(<PageComponent />);
        
        const images = screen.getAllByRole('img');
        const photoImages = images.filter(img => 
          img.src && img.src.includes(`/assets/photos/${album}/`)
        );
        
        if (photoImages.length > 0) {
          photoImages.forEach(img => {
            // Check path format: /assets/photos/{album}/{filename}.jpg
            expect(img.src).toMatch(new RegExp(`/assets/photos/${album}/[^/]+\\.jpg`, 'i'));
          });
        }
      });

      test('images do not use process.env.PUBLIC_URL incorrectly', () => {
        renderWithRouter(<PageComponent />);
        
        const images = screen.getAllByRole('img');
        const photoImages = images.filter(img => 
          img.src && img.src.includes('/assets/photos/')
        );
        
        photoImages.forEach(img => {
          // Should not have undefined or empty PUBLIC_URL in path
          expect(img.src).not.toContain('undefined');
          expect(img.src).not.toMatch(/\/\/\/assets/); // No triple slashes
        });
      });

      test('photo grid container exists', () => {
        renderWithRouter(<PageComponent />);
        const grid = document.querySelector('.photo-grid');
        expect(grid).toBeInTheDocument();
      });
    });
  });
});

