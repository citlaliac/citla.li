import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

function LaughPage() {
  return (
    <div className="app-container">
      <Header />
      <div className="page-container">
        <div className="content-section">
          <h2>Funny Moments</h2>
          <div className="comedy-content">
            <div className="comedy-item">
              <div className="comedy-media">
                <img src="/assets/comedy/sketch1.jpg" alt="Comedy Sketch" />
                <div className="media-overlay">
                  <span className="play-icon">▶</span>
                </div>
              </div>
              <div className="comedy-info">
                <h3>Sketch Title</h3>
                <p>Description of the funny moment</p>
                <div className="comedy-meta">
                  <span className="date">2024</span>
                  <span className="duration">2:30</span>
                </div>
              </div>
            </div>
            <div className="comedy-item">
              <div className="comedy-media">
                <img src="/assets/comedy/sketch2.jpg" alt="Comedy Sketch" />
                <div className="media-overlay">
                  <span className="play-icon">▶</span>
                </div>
              </div>
              <div className="comedy-info">
                <h3>Sketch Title</h3>
                <p>Description of the funny moment</p>
                <div className="comedy-meta">
                  <span className="date">2024</span>
                  <span className="duration">3:15</span>
                </div>
              </div>
            </div>
            <div className="comedy-item">
              <div className="comedy-media">
                <img src="/assets/comedy/sketch3.jpg" alt="Comedy Sketch" />
                <div className="media-overlay">
                  <span className="play-icon">▶</span>
                </div>
              </div>
              <div className="comedy-info">
                <h3>Sketch Title</h3>
                <p>Description of the funny moment</p>
                <div className="comedy-meta">
                  <span className="date">2024</span>
                  <span className="duration">1:45</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default LaughPage; 