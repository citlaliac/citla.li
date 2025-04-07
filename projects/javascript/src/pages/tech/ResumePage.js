import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import '../../styles/tech/ResumePage.css';

function ResumePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [status, setStatus] = useState({ type: null, message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: 'loading', message: 'Sending...' });

    const API_URL = process.env.NODE_ENV === 'production' 
      ? 'https://citla.li/submit-resume.php'
      : 'http://localhost:4201/submit-resume.php';

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
        throw new Error(data.error || 'Failed to send request');
      }

      setStatus({
        type: 'success',
        message: 'Request sent successfully!',
      });
      
      // Redirect to PDF page after successful submission
      navigate('/tech/resume-pdf');
    } catch (error) {
      console.error('Resume request error:', error);
      setStatus({
        type: 'error',
        message: error.message || 'Failed to send request. Please try again.',
      });
    }
  };

  return (
    <div className="resume-page">
            <div className="background-gif" >
        <img src="/assets/gifs/resume-bkg.gif" alt="Background"/>
      </div>
      <Header />
      <div className="resume-content">
        <div className="resume-form-container">
          <h2>View Resume</h2>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="input-group">
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <button type="submit">
              View Resume
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default ResumePage; 