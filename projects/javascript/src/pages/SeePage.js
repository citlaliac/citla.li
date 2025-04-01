import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

function SeePage() {
  return (
    <div className="app-container">
      <Header />
      <div className="page-container">
        <div className="content-section">
          <h2>Visual Art</h2>
          <div className="art-gallery">
            <div className="art-item">
              <img src="/assets/art/art1.jpg" alt="Artwork 1" />
            </div>
            <div className="art-item">
              <img src="/assets/art/art2.jpg" alt="Artwork 2" />
            </div>
            <div className="art-item">
              <img src="/assets/art/art3.jpg" alt="Artwork 3" />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default SeePage; 