import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import '../styles/ShopRedirectPage.css';

function ShopRedirectPage() {
  const [popups, setPopups] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = 'https://www.fawnandfrog.co';
    }, 4201);

    // Create random popups with increased frequency
    const popupInterval = setInterval(() => {
      setPopups(prev => [...prev, {
        id: Date.now(),
        x: Math.random() * (window.innerWidth - 300),
        y: Math.random() * (window.innerHeight - 200),
        title: ['Important Message!', 'System Alert!', 'Warning!', 'Information', 'Notice'][Math.floor(Math.random() * 5)],
        content: ['Your computer has viruses!', 'System32 is missing!', 'Your computer is running slow!', 'Click here to speed up!', 'Your computer needs cleaning!'][Math.floor(Math.random() * 5)],
        size: Math.random() * 0.5 + 0.75 // Random size between 75% and 125% of base size
      }]);
    }, 400); // Reduced interval to create more popups

    return () => {
      clearTimeout(timer);
      clearInterval(popupInterval);
    };
  }, []);

  return (
    <div className="app-container">
    <div className="background-gif">
        <img src="/assets/gifs/shopredirect_bkg.gif" alt="Background" />
      </div>
      <Header />
      <div className="redirect-container">
        <h1 className="redirect-title">taking you to etsy</h1>
        <div className="redirect-animation">
          <div className="spinning-circle"></div>
          <div className="bouncing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        {popups.map(popup => (
          <div 
            key={popup.id} 
            className="win95-popup"
            style={{ 
              left: popup.x, 
              top: popup.y,
              transform: `scale(${popup.size})`
            }}
          >
            <div className="win95-titlebar">
              <span>{popup.title}</span>
              <div className="win95-buttons">
                <span className="minimize">-</span>
                <span className="maximize">□</span>
                <span className="close">×</span>
              </div>
            </div>
            <div className="win95-content">
              {popup.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ShopRedirectPage; 