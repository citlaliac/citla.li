import React from 'react';
import Header from '../components/Header';

function ResumePDFPage() {
  return (
    <div className="app-container">
      <Header />
      <div className="resume-pdf-container">
        <h2>Resume</h2>
        <div className="pdf-embed">
          <iframe
            src="/assets/pdfs/CitlaliAguilarCanamar_Task.pdf"
            title="Resume PDF"
            width="100%"
            height="800px"
          />
        </div>
      </div>
    </div>
  );
}

export default ResumePDFPage; 