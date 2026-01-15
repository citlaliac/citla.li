import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ContactPage from '../ContactPage';

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

// Mock useSEO
jest.mock('../../hooks/useSEO', () => ({
  useSEO: jest.fn(),
}));

// Mock fetch for form submission
global.fetch = jest.fn(() => Promise.resolve({
  ok: true,
  json: async () => ({ success: true }),
}));

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ContactPage', () => {

  test('renders contact form', () => {
    renderWithRouter(<ContactPage />);
    
    // Contact form uses placeholders, not labels
    expect(screen.getByPlaceholderText(/screen name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/message/i)).toBeInTheDocument();
  });

  test('form fields are accessible', () => {
    renderWithRouter(<ContactPage />);
    
    // Check that form fields exist
    const nameInput = screen.getByPlaceholderText(/screen name/i);
    const emailInput = screen.getByPlaceholderText(/email/i);
    const messageInput = screen.getByPlaceholderText(/message/i);
    
    expect(nameInput).toBeInTheDocument();
    expect(emailInput).toBeInTheDocument();
    expect(messageInput).toBeInTheDocument();
  });

  test('form has submit button', () => {
    renderWithRouter(<ContactPage />);
    
    const submitButton = screen.getByRole('button', { name: /send/i });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveAttribute('type', 'submit');
  });
});

