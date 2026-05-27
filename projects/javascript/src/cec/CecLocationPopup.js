import React, { useState } from 'react';
import { ACTIVITY_REWARDS, canCompleteAction } from './cecConfig';

const PUB = process.env.PUBLIC_URL || '';
const FRAME_POPUP = `${PUB}/assets/catholicecloud/frame.png`;
const AMEN_BURST_MS = 480;
const AMEN_SPARKLE_CHARS = ['✦', '⋆', '˖', '✧', '✶', '﹡', '°', '·'];
const ROSARY_BEADS = 10;

function CecLocationPopup({
  location,
  worshiper,
  amenSparkle,
  onDismissAmen,
  onCommunion,
  onPartake,
  onRosaryComplete,
  onLightCandle,
  onActionDone,
}) {
  const [rosaryCount, setRosaryCount] = useState(0);
  const [candleLit, setCandleLit] = useState(false);

  const actionId = location.actionId;
  const canDoAction = actionId && canCompleteAction(worshiper, actionId);

  const ppButtonLabel = (fallback) => {
    const pp = ACTIVITY_REWARDS[actionId]?.pp ?? 0;
    const verb = location.actionLabel || fallback;
    return `${verb} (+${pp} PP)`;
  };

  const handleRosaryBead = () => {
    const next = rosaryCount + 1;
    setRosaryCount(next);
    if (next >= ROSARY_BEADS) onRosaryComplete();
  };

  const extraContent = () => {
    if (location.actionType === 'communion' && canDoAction) {
      return (
        <button type="button" className="cec-popup-action" onClick={onCommunion}>
          {ppButtonLabel('Communion')}
        </button>
      );
    }
    if (location.actionType === 'partake' && canDoAction) {
      return (
        <button type="button" className="cec-popup-action" onClick={onPartake}>
          {ppButtonLabel('Eat the fish')}
        </button>
      );
    }
    if (location.actionType === 'rosary') {
      if (canDoAction) {
        return (
          <div className="cec-rosary-wrap">
            <p className="cec-rosary-hint">
              Beads: {rosaryCount}/{ROSARY_BEADS}
            </p>
            <div className="cec-rosary-beads">
              {Array.from({ length: ROSARY_BEADS }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`cec-rosary-bead${i < rosaryCount ? ' cec-rosary-bead--lit' : ''}`}
                  disabled={i !== rosaryCount}
                  onClick={handleRosaryBead}
                  aria-label={`Bead ${i + 1}`}
                />
              ))}
            </div>
          </div>
        );
      }
      return <p className="cec-popup-done">Decade complete.</p>;
    }
    if (location.actionType === 'candle') {
      if (canDoAction && !candleLit) {
        return (
          <button
            type="button"
            className="cec-popup-action"
            onClick={() => {
              setCandleLit(true);
              onLightCandle();
            }}
          >
            {ppButtonLabel('Light candle')}
          </button>
        );
      }
      return <p className="cec-popup-done">{candleLit ? 'Flame lit.' : 'Candle already lit.'}</p>;
    }
    if (location.actionType === 'amen' && canDoAction) {
      return (
        <button type="button" className="cec-popup-action" onClick={onActionDone}>
          {ppButtonLabel('Pray')}
        </button>
      );
    }
    if (actionId && !canDoAction) {
      return <p className="cec-popup-done">Visit complete.</p>;
    }
    return null;
  };

  return (
    <div
      className={`cec-toast-overlay${amenSparkle ? ' cec-toast-overlay--amen' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cec-toast-title"
    >
      <div className="cec-toast-frame-wrap">
        <div className="cec-toast-frame-visual">
          <img className="cec-toast-frame-img" src={FRAME_POPUP} alt="" draggable={false} />
          <div className="cec-toast-frame-text">
            <div className="cec-toast-frame-text-inner">
              <strong id="cec-toast-title">{location.label}</strong>
              <span className="cec-toast-body">{location.fact}</span>
              {extraContent()}
            </div>
          </div>
          <button
            type="button"
            className="cec-toast-dismiss cec-toast-dismiss--in-frame"
            onClick={onDismissAmen}
          >
            Amen
          </button>
        </div>
      </div>
      {amenSparkle && (
        <div className="cec-amen-sparkle-burst" aria-hidden="true">
          {AMEN_SPARKLE_CHARS.map((ch, i) => (
            <span
              key={`amen-sparkle-${i}`}
              className="cec-amen-sparkle-piece"
              style={{ '--a': `${(360 / AMEN_SPARKLE_CHARS.length) * i}deg` }}
            >
              {ch}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export { AMEN_BURST_MS };
export default CecLocationPopup;
