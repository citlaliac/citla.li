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
        <div className="mesh-content">
          <p className="mesh-message">
            Join this channel where frequent messages are welcome, and being dumb (but still a good person) is lauded.
          </p>
          <div className="mesh-qr-wrapper">
            <img 
              src={`${process.env.PUBLIC_URL || ''}/assets/imgs/mesh-qr.jpeg`}
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
                Place your QR code at: /public/assets/imgs/mesh-qr.jpeg
              </p>
            </div>
          </div>
          <p className="mesh-message">
            It's a great place to be if, like me, you don't reeeeally know what you're doing with meshtastic and want to send messages to... not everyone everywhere.
          </p>
        </div>
      </div>
    </div>
  );
}

export default MeshPage;
