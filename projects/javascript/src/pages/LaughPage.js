import React, { useRef } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useSEO } from '../hooks/useSEO';
import '../styles/LaughPage.css';

/**
 * LaughPage Component
 * Displays comedy content in retro TV and iPhone containers
 * Features a background gif and embedded YouTube content
 */
function LaughPage() {
  const videoRef = useRef(null);

  // SEO configuration for comedy page
  useSEO({
    title: 'Citlali Comedy Videos - Stand-up Comedy & Improv | citla.li/laugh',
    description: 'Watch Citlali Aguilar Canamar\'s stand-up comedy videos and improv performances. Professional comedian based in NYC with hilarious content and live performances.',
    keywords: 'Citlali comedy, Citlali stand up, Citlali improv, Citlali comedian, stand up comedy, improv comedy, NYC comedian, comedy videos, funny videos',
    canonicalUrl: 'https://citla.li/laugh',
    ogTitle: 'Citlali Comedy Videos - Stand-up Comedy & Improv',
    ogDescription: 'Watch Citlali Aguilar Canamar\'s stand-up comedy videos and improv performances. Professional comedian based in NYC.',
    ogImage: 'https://citla.li/assets/gifs/laugh.gif',
    twitterTitle: 'Citlali Comedy Videos - Stand-up Comedy & Improv',
    twitterDescription: 'Watch Citlali\'s stand-up comedy videos and improv performances. Professional NYC comedian.',
    twitterImage: 'https://citla.li/assets/gifs/laugh.gif',
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": "Citlali Aguilar Canamar",
      "jobTitle": "Stand-up Comedian",
      "description": "Professional stand-up comedian and improv performer based in New York City",
      "url": "https://citla.li/laugh",
      "image": "https://citla.li/assets/gifs/laugh.gif",
      "knowsAbout": ["Stand-up Comedy", "Improv", "Comedy Writing", "Live Performance"],
      "hasOccupation": {
        "@type": "Occupation",
        "name": "Stand-up Comedian",
        "occupationLocation": {
          "@type": "City",
          "name": "New York City"
        }
      }
    }
  });

  const handlePhoneClick = () => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  return (
    <div className="app-container laugh-page">
      {/* Background gif */}
      <div className="background-gif">
        <img src="/assets/gifs/laugh_bkg.gif" alt="Background" />
      </div>

      <Header />
      <div className="page-container">
        <div className="content-section">
          <h2>laugh</h2>
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
            <div className="iphone-container">
              <div className="iphone">
                <div className="iphone-screen">
                  <iframe
                    src="https://www.youtube.com/embed/-_r7kPaaa08"
                    title="YouTube Video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
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