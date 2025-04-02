import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="footer">
      <div className="social-icons">
        <a href="https://www.instagram.com/citlaliac/" target="_blank" rel="noopener noreferrer" className="social-icon">
          <div className="icon-wrapper">
            <img src="/assets/imgs/instagram.png" alt="Instagram" />
          </div>
        </a>
        <a href="https://www.linkedin.com/in/citlaliac" target="_blank" rel="noopener noreferrer" className="social-icon">
          <div className="icon-wrapper">
            <img src="/assets/imgs/linkedin.png" alt="LinkedIn" />
          </div>
        </a>
        <a href="https://www.tiktok.com/@citlalisstuff" target="_blank" rel="noopener noreferrer" className="social-icon">
          <div className="icon-wrapper">
            <img src="/assets/imgs/tiktok.png" alt="TikTok" />
          </div>
        </a>
      </div>
      <div className="last-updated">Last updated: {new Date().toLocaleDateString()}</div>
    </footer>
  );
}

export default Footer; 