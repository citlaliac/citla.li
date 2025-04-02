import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

/**
 * ContactPage Component
 * Handles the contact form submission and display
 * Features:
 * - Form validation
 * - API integration with backend
 * - Success/error message display
 * - Form state management
 */
function ContactPage() {
  // State for form data and submission status
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [status, setStatus] = useState({ type: '', message: '' });

  /**
   * Handles form submission
   * Sends form data to backend API
   * Updates status based on API response
   * Clears form on success
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: 'loading', message: 'Sending...' });

    try {
      // Send POST request to backend API
      const response = await fetch('http://localhost:5000/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      // Check if request was successful
      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Update status with success message
      setStatus({
        type: 'success',
        message: 'Message sent successfully!',
      });
      
      // Clear form data
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      // Update status with error message
      setStatus({
        type: 'error',
        message: 'Failed to send message. Please try again.',
      });
    }
  };

  /**
   * Handles input field changes
   * Updates formData state with new values
   */
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="app-container">
      <Header />
      <div className="contact-container">
        <h2>Get in Touch</h2>
        {/* Contact Form */}
        <form className="contact-form" onSubmit={handleSubmit}>
          {/* Name Input Field */}
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          {/* Email Input Field */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          {/* Message Textarea Field */}
          <div className="form-group">
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
            />
          </div>
          {/* Submit Button */}
          <button type="submit" className="submit-button">
            Send Message
          </button>
          {/* Status Message Display */}
          {status.message && (
            <div className={`${status.type}-message`}>
              {status.message}
            </div>
          )}
        </form>
      </div>
      <Footer />
    </div>
  );
}

export default ContactPage; 