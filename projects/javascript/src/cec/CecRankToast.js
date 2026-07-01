import React, { useEffect, useMemo } from 'react';
import CecWorshiperPortrait from './CecWorshiperPortrait';
import { popeDemotionMessage, rankPromotionMessage } from './cecConfig';

const RANK_UP_MS = 6200;
const REWARD_MS = 4500;
const PAPACY_LOST_MS = 7200;
const BURST_SPARKS = ['✦', '✧', '★', '☆', '✶', '⋆', '˖', '﹡'];

function CecRankToast({ worshiper, pp = 0, rank, papacyLost, onDone }) {
  const isRankUp = !!rank;
  const isPapacyLost = !!papacyLost;

  useEffect(() => {
    const ms = isPapacyLost ? PAPACY_LOST_MS : isRankUp ? RANK_UP_MS : REWARD_MS;
    const t = window.setTimeout(onDone, ms);
    return () => window.clearTimeout(t);
  }, [onDone, isRankUp, isPapacyLost]);

  const previewWorshiper = rank
    ? { ...worshiper, rank }
    : isPapacyLost
      ? { ...worshiper, rank: { id: 'priest', label: 'Priest' } }
      : worshiper;
  const promotionLine = rank ? rankPromotionMessage(rank.id, worshiper.displayName) : null;
  const demotionLine = papacyLost
    ? popeDemotionMessage(
        worshiper.displayName,
        papacyLost.reigningPopeName,
        papacyLost.pointsNeeded
      )
    : null;

  const sparks = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        char: BURST_SPARKS[i % BURST_SPARKS.length],
        angle: (360 / 14) * i,
        delay: i * 0.05,
      })),
    []
  );

  const showBurst = isRankUp || isPapacyLost;

  return (
    <div
      className={`cec-reward-overlay${showBurst ? ' cec-reward-overlay--rank-up' : ''}${
        isPapacyLost ? ' cec-reward-overlay--papacy-lost' : ''
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cec-reward-title"
      onClick={onDone}
    >
      {showBurst && (
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
        className={showBurst ? 'cec-rank-burst-panel' : 'cec-reward-panel'}
        onClick={(e) => e.stopPropagation()}
      >
        {isPapacyLost ? (
          <>
            <p className="cec-rank-burst-kicker">The Papacy Has Passed</p>
            <div className="cec-rank-burst-medallion">
              <CecWorshiperPortrait worshiper={previewWorshiper} size="hero" />
            </div>
            <div className="cec-rank-burst-caption">
              <p className="cec-rank-burst-title" id="cec-reward-title">
                Priest
              </p>
              <p className="cec-reward-rank">{demotionLine}</p>
            </div>
          </>
        ) : isRankUp ? (
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
