import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/SignGuestBook.css';

function GuestBookPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    message: ''
  });
  const [status, setStatus] = useState({ type: null, message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('https://citla.li/submit-guestbook.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          location: formData.location,
          message: formData.message
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit guestbook entry');
      }

      // Redirect to guestbook display page
      window.location.href = '/guestbook';
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
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
    <div className="sign-guestbook-page">
      <div className="background-gif">
        <img src="/assets/imgs/guestbook.jpg" alt="Background" />
      </div>
      <Header />
      <div className="sign-guestbook-content">
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
        <div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default GuestBookPage; 