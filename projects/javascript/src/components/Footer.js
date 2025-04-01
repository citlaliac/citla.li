import React from 'react';

function Footer() {
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <footer className="footer">
      <div className="social-icons">
        <a href="#" className="social-icon">
          <div className="icon-wrapper small">
            <img src="/assets/imgs/linkedin.png" alt="LinkedIn" />
          </div>
        </a>
        <a href="#" className="social-icon">
          <div className="icon-wrapper small">
            <img src="/assets/imgs/instagram.png" alt="Instagram" />
          </div>
        </a>
        <a href="#" className="social-icon">
          <div className="icon-wrapper small">
            <img src="/assets/imgs/tiktok.png" alt="TikTok" />
          </div>
        </a>
      </div>
      <div className="last-updated">
        Last updated: {formattedDate}
      </div>
    </footer>
  );
}

export default Footer; 