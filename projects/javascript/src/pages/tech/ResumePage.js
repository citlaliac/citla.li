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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const API_URL = process.env.NODE_ENV === 'production' 
      ? 'https://citla.li/submit-resume.php'
      : 'http://localhost:4201/submit-resume.php';

    try {
      console.log('Submitting form data:', formData);
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Raw response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (error) {
        console.error('Error parsing JSON:', error);
        throw new Error(`Invalid response from server: ${responseText}`);
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send request');
      }
      
      // Redirect to PDF page after successful submission
      navigate('/tech/resume-pdf');
    } catch (error) {
      console.error('Resume request error:', error);
      // Error handling - could display error message in future
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