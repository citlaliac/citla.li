import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/GuestBookPage.css';

function GuestBookPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    message: ''
  });
  const [status, setStatus] = useState({ type: null, message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: 'loading', message: 'Submitting...' });

    const API_URL = process.env.NODE_ENV === 'production' 
      ? 'https://citla.li/submit-guestbook.php'
      : 'http://localhost:4201/submit-guestbook.php';

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      let data;
      try {
        data = await response.json();
      } catch (error) {
        console.error('Error parsing JSON:', error);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit entry');
      }

      setStatus({
        type: 'success',
        message: 'Thank you for signing the guestbook!',
      });
      
      // Clear form
      setFormData({ name: '', location: '', message: '' });
      
      // Redirect to home after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Guestbook submission error:', error);
      setStatus({
        type: 'error',
        message: error.message || 'Failed to submit entry. Please try again.',
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="guestbook-page">
      <div className="background-gif">
        <img src="/assets/imgs/guestbook.jpg" alt="Background" />
      </div>
      <Header />
      <div className="guestbook-content">
        <div className="guestbook-form-container">
          {/* <h2>Sign My Guestbook</h2> */}
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="input-group">
              <input
                type="text"
                name="location"
                placeholder="Where are you from?"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>
            <div className="input-group">
              <textarea
                name="message"
                placeholder="Leave a message (optional)"
                value={formData.message}
                onChange={handleChange}
                rows="4"
              />
            </div>
            <button type="guestbook-submit">
              Sign Guestbook
            </button>
            {status.type && (
              <div className={`status-message ${status.type}`}>
                {status.message}
              </div>
            )}
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default GuestBookPage; 