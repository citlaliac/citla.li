import React, { useMemo, useState } from 'react';
import { WHEEL_SAINTS } from './cecConfig';
import { ASSET_DIRS, saintImageUrl } from './cecAssets';
import CecSaintResultPopup from './CecSaintResultPopup';

const SEGMENT_COUNT = WHEEL_SAINTS.length;
const SEG_DEG = 360 / SEGMENT_COUNT;

function WheelSegmentThumb({ saint, index }) {
  const [failed, setFailed] = useState(false);
  const src = saintImageUrl(saint);
  const rot = index * SEG_DEG + SEG_DEG / 2;

  return (
    <div
      className="cec-wheel-segment"
      style={{ '--seg-rot': `${rot}deg` }}
      aria-hidden
    >
      <div className="cec-wheel-segment-inner">
        {src && !failed ? (
          <img
            className="cec-wheel-segment-img"
            src={src}
            alt=""
            draggable={false}
            onError={() => setFailed(true)}
          />
        ) : (
          <span className="cec-wheel-segment-emoji">✦</span>
        )}
        <span className="cec-wheel-segment-label">{saint.shortLabel}</span>
      </div>
    </div>
  );
}

function CecSaintWheel({ worshiper, alreadySpun, onClose, onSpinResult }) {
  const [spinning, setSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dialFailed, setDialFailed] = useState(false);

  const resultIndex = useMemo(() => {
    if (!result?.saintId) return -1;
    return WHEEL_SAINTS.findIndex((s) => s.id === result.saintId);
  }, [result]);

  const handleSpin = async () => {
    if (alreadySpun) return;
    setSpinning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/cec-wheel-spin.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: worshiper.sessionId }),
      });
      const data = await res.json();
      if (res.status === 409) {
        setError('You already spun today for this worshiper.');
        setSpinning(false);
        return;
      }
      if (!data.success) throw new Error(data.error || 'Spin failed');

      const idx = WHEEL_SAINTS.findIndex((s) => s.id === data.saintId);
      const safeIdx = idx >= 0 ? idx : 0;
      const extraTurns = 4 + Math.floor(Math.random() * 2);
      const landOn = extraTurns * 360 + (360 - safeIdx * SEG_DEG - SEG_DEG / 2);
      setWheelRotation((r) => r + landOn);

      window.setTimeout(() => {
        setResult(data);
        onSpinResult(data.points, data.saintLabel);
        setSpinning(false);
      }, 2800);
    } catch (err) {
      setError(err.message || 'Wheel stuck. Try later.');
      setSpinning(false);
    }
  };

  if (result && resultIndex >= 0) {
    return (
      <CecSaintResultPopup
        saintId={result.saintId}
        saintLabel={result.saintLabel}
        points={result.points}
        onAmen={onClose}
      />
    );
  }

  return (
    <div
      className="cec-wheel-overlay cec-wheel-overlay--map"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cec-wheel-title"
    >
      <div className="cec-wheel-modal">
        <h2 id="cec-wheel-title" className="cec-wheel-title">
          Wheel of Saints
        </h2>
        <p className="cec-wheel-tagline">
          {alreadySpun
            ? 'You already visited the Wheel of Saints today. Come back tomorrow for another spin.'
            : 'One spin per worshiper per day. The saints are generous (usually).'}
        </p>

        <div className="cec-wheel-stage">
          {!dialFailed && (
            <img
              className="cec-wheel-dial-bg"
              src={ASSET_DIRS.wheelDial}
              alt=""
              draggable={false}
              onError={() => setDialFailed(true)}
            />
          )}
          <div
            className={`cec-wheel-disc${spinning ? ' cec-wheel-disc--spinning' : ''}${alreadySpun ? ' cec-wheel-disc--done' : ''}`}
            style={{ transform: `rotate(${wheelRotation}deg)` }}
          >
            {WHEEL_SAINTS.map((saint, i) => (
              <WheelSegmentThumb key={saint.id} saint={saint} index={i} />
            ))}
          </div>
          {!alreadySpun ? (
            <button
              type="button"
              className="cec-wheel-hub"
              onClick={handleSpin}
              disabled={spinning}
            >
              {spinning ? '…' : 'SPIN'}
            </button>
          ) : (
            <div className="cec-wheel-hub cec-wheel-hub--done" aria-hidden>
              ✓
            </div>
          )}
        </div>

        {error && <p className="cec-wheel-error">{error}</p>}

        <button type="button" className="cec-toast-dismiss cec-wheel-amen" onClick={onClose}>
          Amen
        </button>
      </div>
    </div>
  );
}

export default CecSaintWheel;
