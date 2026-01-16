import React from 'react';
import '../styles/MeshPage.css';

/**
 * MeshPage - Standalone page for QR code
 * No header or footer - minimal page to direct people to the site
 */
function MeshPage() {
  return (
    <div className="mesh-page">
      <div className="mesh-container">
        <div className="mesh-qr-wrapper">
          <img 
            src="/assets/imgs/mesh-qr.png"
            alt="QR Code"
            className="mesh-qr-code"
            onError={(e) => {
              // Fallback if image doesn't exist yet
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <div className="mesh-qr-placeholder" style={{ display: 'none' }}>
            <p>QR Code Image</p>
            <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
              Place your QR code at: /public/assets/imgs/mesh-qr.png
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MeshPage;
