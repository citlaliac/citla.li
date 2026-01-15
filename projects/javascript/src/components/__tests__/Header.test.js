import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from '../Header';

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Header', () => {
  test('renders navigation links', () => {
    renderWithRouter(<Header />);
    
    // Check for home link
    const homeLink = screen.getByAltText(/home/i).closest('a');
    expect(homeLink).toHaveAttribute('href', '/');
    
    // Check for contact link
    const contactLink = screen.getByAltText(/contact/i).closest('a');
    expect(contactLink).toHaveAttribute('href', '/contact');
  });

  test('renders back button on non-main pages', () => {
    // Use MemoryRouter with initialEntries to simulate non-main page
    const { MemoryRouter } = require('react-router-dom');
    const { render: renderTest } = require('@testing-library/react');
    
    const { container } = renderTest(
      <MemoryRouter initialEntries={['/see']}>
        <Header />
      </MemoryRouter>
    );
    
    const backButton = container.querySelector('img[alt*="back" i]');
    // Back button should be present on non-main pages
    expect(backButton).toBeInTheDocument();
  });
});

