import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

function TechPage() {
  return (
    <div className="app-container">
      <Header />
      <div className="page-container">
        <div className="content-section">
          <h2>Technical Projects</h2>
          <div className="tech-projects">
            <div className="tech-item">
              <h3>Project 1</h3>
              <p>Description of the technical project</p>
            </div>
            <div className="tech-item">
              <h3>Project 2</h3>
              <p>Description of the technical project</p>
            </div>
            <div className="tech-item">
              <h3>Project 3</h3>
              <p>Description of the technical project</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default TechPage; 