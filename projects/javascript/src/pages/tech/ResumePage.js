import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';

function ResumePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: 'loading', message: 'Submitting...' });

    try {
      console.log('Submitting form data:', formData);
      const response = await fetch('http://localhost:5000/api/submit-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log('Server response:', data);

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to submit form');
      }

      setStatus({
        type: 'success',
        message: 'Success! Redirecting to resume...',
      });

      // Redirect to resume PDF after a short delay
      setTimeout(() => {
        navigate('/resume-pdf');
      }, 1500);
    } catch (error) {
      console.error('Submission error:', error);
      setStatus({
        type: 'error',
        message: error.message || 'Failed to submit form. Please try again.',
      });
    }
  };

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
        <h2>request resume</h2>
        <p className="resume-intro">
          Please fill out the form below to request my resume.
        </p>
        <form className="resume-form" onSubmit={handleSubmit}>
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
          <button type="submit" className="submit-button">
            Submit
          </button>
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