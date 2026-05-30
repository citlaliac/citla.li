import React, { useEffect, useMemo } from 'react';
import CecWorshiperPortrait from './CecWorshiperPortrait';
import { rankPromotionMessage } from './cecConfig';

const RANK_UP_MS = 6200;
const REWARD_MS = 4500;
const BURST_SPARKS = ['✦', '✧', '★', '☆', '✶', '⋆', '˖', '﹡'];

function CecRankToast({ worshiper, pp = 0, rank, onDone }) {
  const isRankUp = !!rank;

  useEffect(() => {
    const t = window.setTimeout(onDone, isRankUp ? RANK_UP_MS : REWARD_MS);
    return () => window.clearTimeout(t);
  }, [onDone, isRankUp]);

  const previewWorshiper = rank ? { ...worshiper, rank } : worshiper;
  const promotionLine = rank ? rankPromotionMessage(rank.id, worshiper.displayName) : null;

  const sparks = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        char: BURST_SPARKS[i % BURST_SPARKS.length],
        angle: (360 / 14) * i,
        delay: i * 0.05,
      })),
    []
  );

  return (
    <div
      className={`cec-reward-overlay${isRankUp ? ' cec-reward-overlay--rank-up' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cec-reward-title"
      onClick={onDone}
    >
      {isRankUp && (
        <div className="cec-rank-burst-fx" aria-hidden>
          <div className="cec-rank-burst-rays" />
          <div className="cec-rank-burst-ring" />
          {sparks.map((s, i) => (
            <span
              key={`rank-spark-${i}`}
              className="cec-rank-burst-spark"
              style={{ '--a': `${s.angle}deg`, '--d': `${s.delay}s` }}
            >
              {s.char}
            </span>
          ))}
        </div>
      )}

      <div
        className={isRankUp ? 'cec-rank-burst-panel' : 'cec-reward-panel'}
        onClick={(e) => e.stopPropagation()}
      >
        {isRankUp ? (
          <>
            <p className="cec-rank-burst-kicker">Your Calling Deepens</p>
            <div className="cec-rank-burst-medallion">
              <CecWorshiperPortrait worshiper={previewWorshiper} size="hero" />
            </div>
            <div className="cec-rank-burst-caption">
              {rank && (
                <p className="cec-rank-burst-title" id="cec-reward-title">
                  {rank.label}
                </p>
              )}
              {promotionLine && <p className="cec-reward-rank">{promotionLine}</p>}
            </div>
          </>
        ) : (
          <>
            <CecWorshiperPortrait worshiper={previewWorshiper} size="hero" />
            <div className="cec-reward-copy">
              {pp > 0 && (
                <p id="cec-reward-title" className="cec-reward-pp">
                  +{pp} Pontifex Points
                </p>
              )}
              {promotionLine && <p className="cec-reward-rank">{promotionLine}</p>}
              {pp > 0 && <p className="cec-reward-name">{worshiper.displayName}</p>}
            </div>
          </>
        )}
        <button type="button" className="cec-toast-dismiss cec-reward-dismiss" onClick={onDone}>
          Amen
        </button>
      </div>
    </div>
  );
}

export default CecRankToast;
