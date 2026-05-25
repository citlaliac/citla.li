import React, { useState } from 'react';
import { WHEEL_SAINTS_BY_ID } from './cecConfig';
import { saintImageUrl } from './cecAssets';

function CecSaintResultPopup({ saintId, saintLabel, points, onAmen }) {
  const saint = WHEEL_SAINTS_BY_ID[saintId] || { label: saintLabel, blurb: '', emoji: '✨' };
  const src = saintImageUrl(saint);
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div
      className="cec-saint-result-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cec-saint-result-title"
    >
      <div className="cec-saint-result-wrap">
        <div className="cec-saint-result-card">
          <div className="cec-saint-result-portrait">
            {src && !imgFailed ? (
              <img
                src={src}
                alt=""
                className="cec-saint-result-img"
                draggable={false}
                onError={() => setImgFailed(true)}
              />
            ) : (
              <span className="cec-saint-result-emoji" aria-hidden>
                ✨
              </span>
            )}
          </div>
          <div className="cec-saint-result-copy">
            <p className="cec-saint-result-kicker">The wheel has spoken</p>
            <h2 id="cec-saint-result-title" className="cec-saint-result-title">
              {saintLabel || saint.label}
            </h2>
            <p className="cec-saint-result-blurb">{saint.blurb}</p>
            <p className="cec-saint-result-pp">
              You receive <strong>{points}</strong> Pontifex Points
            </p>
          </div>
        </div>
        <button type="button" className="cec-toast-dismiss cec-saint-result-amen" onClick={onAmen}>
          Amen
        </button>
      </div>
    </div>
  );
}

export default CecSaintResultPopup;
