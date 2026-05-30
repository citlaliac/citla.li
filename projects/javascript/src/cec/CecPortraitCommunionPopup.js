import React, { useState } from 'react';
import { PORTRAIT_COMMUNION } from './cecConfig';
import { communionImageUrl, communionPopupBackgroundUrl } from './cecAssets';

function CecPortraitCommunionPopup({ kind, onDismiss }) {
  const isStuffed = kind === 'stuffed';
  const step = PORTRAIT_COMMUNION[kind];
  const src = !isStuffed ? communionImageUrl(step.imageFile) : null;
  const [imgFailed, setImgFailed] = useState(false);
  const popupBg = communionPopupBackgroundUrl();

  return (
    <div
      className="cec-portrait-communion-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cec-portrait-communion-title"
      onClick={onDismiss}
    >
      <div
        className="cec-portrait-communion-card"
        style={
          popupBg ? { '--cec-communion-interior': `url('${popupBg}')` } : undefined
        }
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cec-portrait-communion-art">
          {src && !imgFailed ? (
            <img
              src={src}
              alt=""
              className="cec-portrait-communion-img"
              draggable={false}
              onError={() => setImgFailed(true)}
            />
          ) : (
            <span className="cec-portrait-communion-emoji" aria-hidden>
              {step.emoji}
            </span>
          )}
        </div>
        <div className="cec-portrait-communion-copy">
          {isStuffed ? (
            <p id="cec-portrait-communion-title" className="cec-portrait-communion-message">
              {step.message}
            </p>
          ) : (
            <>
              <h2 id="cec-portrait-communion-title" className="cec-portrait-communion-title">
                {step.title}
              </h2>
              <p className="cec-portrait-communion-prompt">{step.prompt}</p>
            </>
          )}
        </div>
        <button type="button" className="cec-toast-dismiss cec-portrait-communion-amen" onClick={onDismiss}>
          Amen
        </button>
      </div>
    </div>
  );
}

export default CecPortraitCommunionPopup;
