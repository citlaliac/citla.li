import React, { useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

/**
 * ResumePage Component
 * Displays a contact form and handles resume download
 * Form submissions are saved to Google Sheets
 */
function ResumePage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // TODO: Replace with your Google Apps Script URL
      const response = await fetch('YOUR_GOOGLE_APPS_SCRIPT_URL', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      setSubmitStatus('success');
      
      // Trigger resume download
      const resumeUrl = '/assets/resume.pdf'; // TODO: Replace with actual resume path
      window.open(resumeUrl, '_blank');
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        company: '',
        message: ''
      });
    } catch (error) {
      setSubmitStatus('error');
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-container">
      <Header />
      <div className="page-container">
        <div className="content-section">
          <h2>Get My Resume</h2>
          <p className="resume-intro">
            Please fill out the form below to receive my resume. Your information will be saved securely.
          </p>

          <form onSubmit={handleSubmit} className="resume-form">
            <div className="form-group">
              <label htmlFor="name">Name *</label>
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
              <label htmlFor="email">Email *</label>
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
              <label htmlFor="company">Company</label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Message (Optional)</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows="4"
              />
            </div>

            <button 
              type="submit" 
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Get Resume'}
            </button>

            {submitStatus === 'success' && (
              <p className="success-message">
                Thank you! Your resume download should begin automatically.
              </p>
            )}

            {submitStatus === 'error' && (
              <p className="error-message">
                There was an error submitting the form. Please try again.
              </p>
            )}
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default ResumePage; 