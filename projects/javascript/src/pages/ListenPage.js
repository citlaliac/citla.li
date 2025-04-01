import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

function ListenPage() {
  return (
    <div className="app-container">
      <Header />
      <div className="page-container">
        <div className="content-section">
          <h2>Listen to My Music</h2>
          <div className="music-player">
            <div className="music-grid">
              <div className="music-item">
                <div className="music-cover">
                  <img src="/assets/music/album1.jpg" alt="Album Cover" />
                  <div className="play-overlay">
                    <span className="play-icon">▶</span>
                  </div>
                </div>
                <div className="music-info">
                  <h3>Song Title</h3>
                  <p>Album Name</p>
                </div>
              </div>
              <div className="music-item">
                <div className="music-cover">
                  <img src="/assets/music/album2.jpg" alt="Album Cover" />
                  <div className="play-overlay">
                    <span className="play-icon">▶</span>
                  </div>
                </div>
                <div className="music-info">
                  <h3>Song Title</h3>
                  <p>Album Name</p>
                </div>
              </div>
              <div className="music-item">
                <div className="music-cover">
                  <img src="/assets/music/album3.jpg" alt="Album Cover" />
                  <div className="play-overlay">
                    <span className="play-icon">▶</span>
                  </div>
                </div>
                <div className="music-info">
                  <h3>Song Title</h3>
                  <p>Album Name</p>
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

export default ListenPage; 