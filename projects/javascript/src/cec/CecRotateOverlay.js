import React from 'react';

function CecRotateOverlay({ onTryLandscape, onContinuePortrait }) {
  return (
    <div className="cec-rotate-overlay" role="dialog" aria-modal="true" aria-labelledby="cec-rotate-title">
      <div className="cec-rotate-card">
        <p className="cec-rotate-icon" aria-hidden="true">
          ↻
        </p>
        <h2 id="cec-rotate-title" className="cec-rotate-title">
          Rotate for the map
        </h2>
        <p className="cec-rotate-copy">
          Catholic e Cloud fits best sideways. Turn your phone to landscape.
        </p>
        <button type="button" className="cec-rotate-primary" onClick={onTryLandscape}>
          Use landscape
        </button>
        <button type="button" className="cec-rotate-secondary" onClick={onContinuePortrait}>
          Continue in portrait
        </button>
      </div>
    </div>
  );
}

export default CecRotateOverlay;
