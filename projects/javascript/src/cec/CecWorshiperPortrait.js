import React, { useState } from 'react';
import { avatarById } from './cecConfig';
import { worshiperAvatarUrl } from './cecAssets';

function CecWorshiperPortrait({ avatarId, size = 'md', className = '' }) {
  const [imgFailed, setImgFailed] = useState(false);
  const avatar = avatarById(avatarId);
  const src = worshiperAvatarUrl(avatar);
  const sizeClass = `cec-portrait--${size}`;

  return (
    <span className={`cec-portrait ${sizeClass} ${className}`.trim()} aria-hidden>
      {src && !imgFailed ? (
        <img
          className="cec-portrait-img"
          src={src}
          alt=""
          draggable={false}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span className="cec-portrait-emoji">{avatar.emoji}</span>
      )}
    </span>
  );
}

export default CecWorshiperPortrait;
