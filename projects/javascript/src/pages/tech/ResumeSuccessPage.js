import React from 'react';
import Header from '../../components/Header';

function ResumeSuccessPage() {
  return (
    <div className="app-container">
      <Header />
      <div className="resume-success-container">
        <h2>thank you for your interest</h2>
        <div className="pdf-container">
          <iframe
            src="/assets/pdfs/resume.pdf"
            title="Resume PDF"
            width="100%"
            height="800px"
            style={{ border: 'none' }}
          />
        </div>
      </div>
    </div>
  );
}

export default ResumeSuccessPage; 