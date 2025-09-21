import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useSEO } from '../hooks/useSEO';

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
  // SEO configuration for contact page
  useSEO({
    title: 'Contact Citlali - NYC Tour Guide, Comedian & Photographer | citla.li/contact',
    description: 'Contact Citlali Aguilar Canamar for NYC tours, comedy bookings, photography services, or general inquiries. Professional tour guide, comedian, and photographer based in NYC.',
    keywords: 'contact Citlali, book NYC tour, hire comedian, photography services, NYC tour guide contact, comedy booking, professional photographer contact',
    canonicalUrl: 'https://citla.li/contact',
    ogTitle: 'Contact Citlali - NYC Tour Guide, Comedian & Photographer',
    ogDescription: 'Contact Citlali for NYC tours, comedy bookings, photography services, or general inquiries.',
    ogImage: 'https://citla.li/assets/imgs/contact-bkg.png',
    twitterTitle: 'Contact Citlali - NYC Tour Guide, Comedian & Photographer',
    twitterDescription: 'Contact Citlali for NYC tours, comedy bookings, photography services, or general inquiries.',
    twitterImage: 'https://citla.li/assets/imgs/contact-bkg.png',
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": "Citlali Aguilar Canamar",
      "description": "Professional NYC tour guide, stand-up comedian, and photographer available for bookings and inquiries",
      "url": "https://citla.li/contact",
      "image": "https://citla.li/assets/imgs/contact-bkg.png",
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "General Inquiry",
        "url": "https://citla.li/contact"
      }
    }
  });

  // State for form data and submission status
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [showPopup, setShowPopup] = useState(false);

  /**
   * Handles form submission
   * Sends form data to backend API
   * Updates status based on API response
   * Clears form on success
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: 'loading', message: 'Sending...' });

    const API_URL = process.env.NODE_ENV === 'production' 
      ? 'https://citla.li/submit-contact.php'
      : 'http://localhost:4201/submit-contact.php';

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
        throw new Error(data.error || 'Failed to send message');
      }

      setStatus({
        type: 'success',
        message: 'Message sent successfully!',
      });
      
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      console.error('Contact form error:', error);
      setStatus({
        type: 'error',
        message: error.message || 'Failed to send message. Please try again.',
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

  const handleCloseClick = () => {
    setShowPopup(true);
    setTimeout(() => {
      setShowPopup(false);
    }, 3000); // Hide popup after 3 seconds
  };

  return (
    <div className="app-container">
      <div className="background-gif">
        <img src="/assets/imgs/contact-bkg.png" alt="Background" />
      </div>
      <Header />
      <main className="aim-container">
        <div className="aim-window">
          <div className="aim-titlebar">
            <div className="aim-title">AIM - Contact Form</div>
            <div className="aim-buttons">
              <span className="aim-minimize">_</span>
              <span className="aim-maximize">□</span>
              <span className="aim-close" onClick={handleCloseClick}>×</span>
            </div>
          </div>
          <div className="aim-content">
            <div className="aim-chat">
              <div className="aim-message aim-you">
                <span className="aim-you-name">You:</span> Hey queen! Let's chat 😍
              </div>
              <div className="aim-message aim-you">
                <span className="aim-buddy-name">Citlali:</span> Hmm... maybe, tell me about yourself first.
              </div>
              <div className="aim-message aim-you">
                <span className="aim-you-name">You:</span>  <em style={{ }}>typing...</em>
              </div>
            </div>
            <form className="aim-form" onSubmit={handleSubmit}>
              <div className="aim-form-group">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your Screen Name"
                  required
                />
              </div>
              <div className="aim-form-group">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Your Email"
                  required
                />
              </div>
              <div className="aim-form-group">
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Type your message here..."
                  required
                />
              </div>
              <button type="submit" className="aim-send-button">
                Send Message
              </button>
              {status.message && (
                <div className={`aim-status ${status.type}`}>
                  {status.message}
                </div>
              )}
            </form>
          </div>
        </div>
        {showPopup && (
          <div className="aim-popup">
            <img src="/assets/gifs/x-click.gif" alt="AIM Away Message" />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default ContactPage; 