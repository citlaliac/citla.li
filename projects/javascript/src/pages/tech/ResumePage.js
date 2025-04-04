import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import '../../styles/ResumePage.css';

function ResumePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:5000/api/submit-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        navigate('/tech/resume-pdf');
      }
    } catch (error) {
      console.error('Error:', error);
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