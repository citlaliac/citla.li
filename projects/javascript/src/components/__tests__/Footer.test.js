import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Footer from '../Footer';

// Mock buildInfo
jest.mock('../../buildInfo', () => ({
  BUILD_DATE: '2026-01-15T12:00:00.000Z'
}));

describe('Footer', () => {
  test('renders social media links', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );
    
    const instagramLink = screen.getByRole('link', { name: /instagram/i });
    const linkedinLink = screen.getByRole('link', { name: /linkedin/i });
    const tiktokLink = screen.getByRole('link', { name: /tiktok/i });
    
    expect(instagramLink).toBeInTheDocument();
    expect(linkedinLink).toBeInTheDocument();
    expect(tiktokLink).toBeInTheDocument();
    
    expect(instagramLink).toHaveAttribute('href', 'https://www.instagram.com/citlaliac/');
    expect(linkedinLink).toHaveAttribute('href', 'https://www.linkedin.com/in/citlaliac');
    expect(tiktokLink).toHaveAttribute('href', 'https://www.tiktok.com/@citlalisstuff');
  });

  test('displays build date instead of current date', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );
    
    const lastUpdated = screen.getByText(/last updated:/i);
    expect(lastUpdated).toBeInTheDocument();
    
    // Should show the build date (January 15, 2026) not current date
    expect(lastUpdated).toHaveTextContent('January 15, 2026');
  });

  test('shows guestbook link on home page', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Footer />
      </MemoryRouter>
    );
    
    const guestbookLink = screen.getByRole('link', { name: /sign my guestbook/i });
    expect(guestbookLink).toBeInTheDocument();
    expect(guestbookLink).toHaveAttribute('href', '/signGuestbook');
  });

  test('does not show guestbook link on other pages', () => {
    render(
      <MemoryRouter initialEntries={['/see']}>
        <Footer />
      </MemoryRouter>
    );
    
    const guestbookLink = screen.queryByRole('link', { name: /sign my guestbook/i });
    expect(guestbookLink).not.toBeInTheDocument();
  });
});

