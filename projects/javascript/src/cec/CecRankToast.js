import React, { useEffect } from 'react';
import CecWorshiperPortrait from './CecWorshiperPortrait';
import { rankPromotionMessage } from './cecConfig';

function CecRankToast({ worshiper, pp = 0, rank, onDone }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 4500);
    return () => window.clearTimeout(t);
  }, [onDone]);

  const previewWorshiper = rank ? { ...worshiper, rank } : worshiper;
  const promotionLine = rank ? rankPromotionMessage(rank.id, worshiper.displayName) : null;

  return (
    <div
      className="cec-reward-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cec-reward-title"
      onClick={onDone}
    >
      <div className="cec-reward-panel" onClick={(e) => e.stopPropagation()}>
        <CecWorshiperPortrait worshiper={previewWorshiper} size="hero" />
        <div className="cec-reward-copy">
          {pp > 0 && (
            <p id="cec-reward-title" className="cec-reward-pp">
              +{pp} Pontifex Points
            </p>
          )}
          {promotionLine && (
            <p className="cec-reward-rank">{promotionLine}</p>
          )}
          {!rank && pp > 0 && (
            <p className="cec-reward-name">{worshiper.displayName}</p>
          )}
        </div>
        <button type="button" className="cec-toast-dismiss cec-reward-dismiss" onClick={onDone}>
          Amen
        </button>
      </div>
    </div>
  );
}

export default CecRankToast;
