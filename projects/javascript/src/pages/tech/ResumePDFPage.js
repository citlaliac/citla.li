import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import '../../styles/ResumePdfPage.css';

function ResumePdfPage() {
  return (
    <div className="resume-pdf-page">
            <div className="background-gif">
        <img src="/assets/gifs/save-a-tree.gif" alt="Background" />
      </div>
      <Header />
      <div className="resume-pdf-container">
        <h1 className="resume-pdf-title">resume</h1>
        <h2>save a tree, don't print me.</h2>
        <div className="pdf-viewer-container">
          <iframe
            src="/assets/pdfs/CAC_resume.pdf"
            title="Resume PDF"
            className="pdf-viewer"
            allowFullScreen
          />
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default ResumePdfPage; 