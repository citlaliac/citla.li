import React, { useState } from 'react';
import { portraitForSkinAndRank, portraitForWorshiper } from './cecConfig';
import { worshiperAvatarUrl } from './cecAssets';

function CecWorshiperPortrait({
  worshiper,
  skinId,
  rankId = 'cantor',
  size = 'md',
  className = '',
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const portrait = worshiper ? portraitForWorshiper(worshiper) : portraitForSkinAndRank(skinId, rankId);
  const src = worshiperAvatarUrl(portrait);
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
        <span className="cec-portrait-emoji">{portrait.emoji}</span>
      )}
    </span>
  );
}

export default CecWorshiperPortrait;
