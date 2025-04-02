import React, { useRef } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

/**
 * LaughPage Component
 * Displays comedy content in retro TV and iPhone containers
 * Features a background gif and embedded YouTube content
 */
function LaughPage() {
  const videoRef = useRef(null);

  const handlePhoneClick = () => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  return (
    <div className="app-container laugh-page">
      {/* Background gif */}
      <div className="background-gif">
        <img src="/assets/gifs/laugh_bkg_gif.gif" alt="Background" />
      </div>

      <Header />
      <div className="page-container">
        {/* <div className="content-section"> */}
        <div>
          <h2 className="page-title">laugh</h2>
          <div className="video-container">
            {/* Retro TV Container */}
            <div className="retro-tv">
              <div className="tv-body">
                <div className="tv-screen">
                  <iframe
                    src="https://www.youtube.com/embed/iGM18sfsqrk?"
                    title="YouTube Video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="tv-controls">
                  <div className="tv-button"></div>
                  <div className="tv-button"></div>
                </div>
                <div className="tv-antennas">
                  <div className="tv-antenna"></div>
                  <div className="tv-antenna"></div>
                </div>
              </div>
            </div>

            {/* iPhone Container */}
            <div className="iphone-container" onClick={handlePhoneClick}>
              <div className="iphone">
                <div className="iphone-screen" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
                  <iframe
                    src="https://www.youtube.com/embed/-_r7kPaaa08?si=YYa0sU6puUrtgja2"
                    title="YouTube Video"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      border: 'none'
                    }}
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="iphone-home-button"></div>
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