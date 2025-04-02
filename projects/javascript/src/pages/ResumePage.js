import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

/**
 * ResumePage Component
 * Handles resume request form submission and display
 * Features:
 * - Form validation
 * - API integration with backend
 * - Success/error message display
 * - Form state management
 * - Navigation to success page after submission
 */
function ResumePage() {
  // Initialize navigation hook for redirecting after submission
  const navigate = useNavigate();
  
  // State for form data and submission status
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
  });
  const [status, setStatus] = useState({ type: '', message: '' });

  /**
   * Handles form submission
   * Sends form data to backend API
   * Updates status based on API response
   * Redirects to success page on success
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: 'loading', message: 'Processing...' });

    try {
      // Send POST request to backend API
      const response = await fetch('http://localhost:5000/api/resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      // Check if request was successful
      if (!response.ok) {
        throw new Error('Failed to process request');
      }

      // Redirect to success page after successful submission
      navigate('/resume-success');
    } catch (error) {
      // Update status with error message
      setStatus({
        type: 'error',
        message: 'Failed to process request. Please try again.',
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
      <div className="resume-container">
        <h2>resume</h2>
        <p className="resume-intro">
          Please fill out the form below to view my resume.
        </p>
        {/* Resume Request Form */}
        <form className="resume-form" onSubmit={handleSubmit}>
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
          {/* Company Input Field */}
          <div className="form-group">
            <label htmlFor="company">Company</label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              required
            />
          </div>
          {/* Optional Message Textarea Field */}
          <div className="form-group">
            <label htmlFor="message">Message (Optional)</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
            />
          </div>
          {/* Submit Button */}
          <button type="submit" className="submit-button">
            View Resume
          </button>
          {/* Status Message Display */}
          {status.message && (
            <div className={`${status.type}-message`}>
              {status.message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default ResumePage; 