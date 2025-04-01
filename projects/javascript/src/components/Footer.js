import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="footer">
      <div className="social-icons">
        <a href="https://www.instagram.com/citlali/" target="_blank" rel="noopener noreferrer" className="social-icon">
          <div className="icon-wrapper">
            <img src="/assets/icons/instagram.svg" alt="Instagram" />
          </div>
        </a>
        <a href="https://www.youtube.com/@citlali" target="_blank" rel="noopener noreferrer" className="social-icon">
          <div className="icon-wrapper">
            <img src="/assets/icons/youtube.svg" alt="YouTube" />
          </div>
        </a>
        <a href="https://www.tiktok.com/@citlali" target="_blank" rel="noopener noreferrer" className="social-icon">
          <div className="icon-wrapper">
            <img src="/assets/icons/tiktok.svg" alt="TikTok" />
          </div>
        </a>
      </div>
      <div className="last-updated">Last updated: {new Date().toLocaleDateString()}</div>
    </footer>
  );
}

export default Footer; 