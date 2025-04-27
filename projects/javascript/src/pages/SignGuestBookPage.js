import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/SignGuestBook.css';

function SignGuestBookPage() {
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
    if (submitting) return; // Prevent double submission
    
    setSubmitting(true);
    setError(null);
    setStatus({ type: 'loading', message: 'Submitting your entry...' });

    try {
      // Check for network connectivity
      if (!navigator.onLine) {
        throw new Error('No internet connection. Please check your connection and try again.');
      }

      const response = await fetch('https://citla.li/submit-guestbook.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          location: formData.location.trim(),
          message: formData.message.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Server error occurred' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setStatus({ type: 'success', message: 'Entry submitted successfully!' });
        setFormData({ name: '', location: '', message: '' });
        setTimeout(() => {
          navigate('/guestbook');
        }, 2000);
      } else {
        throw new Error(data.error || 'Failed to submit guestbook entry');
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.message);
      setStatus({ type: 'error', message: err.message });
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
      <Header />
      <div className="sign-guestbook-content">
        <div className="guestbook-form-container">
        <div className="sign-guestbook-background">
        <img src="/assets/imgs/guestbook.jpg" alt="Background" />
      </div>
          <h2>sign my guestbook</h2>
          <form onSubmit={handleSubmit} noValidate>
            <div className="input-group">
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={submitting}
                minLength={2}
                maxLength={50}
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
                disabled={submitting}
                minLength={2}
                maxLength={50}
              />
            </div>
            <div className="input-group">
              <textarea
                name="message"
                placeholder="Leave a message (optional)"
                value={formData.message}
                onChange={handleChange}
                rows="4"
                disabled={submitting}
                maxLength={500}
              />
            </div>
            <button 
              type="submit" 
              disabled={submitting}
              aria-label={submitting ? 'Submitting form' : 'Submit form'}
            >
              {submitting ? 'Submitting...' : 'Sign Guestbook'}
            </button>
            {status.type && (
              <div className={`status-message ${status.type}`} role="alert">
                {status.message}
              </div>
            )}
            <p className="view-guestbook-link">
              Just take me to see the <Link to="/guestbook">Guestbook</Link>
            </p>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default SignGuestBookPage; 