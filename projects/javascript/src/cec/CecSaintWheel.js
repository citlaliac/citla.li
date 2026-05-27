import React, { useMemo, useState } from 'react';
import { WHEEL_SAINTS } from './cecConfig';
import { ASSET_DIRS, saintImageUrl } from './cecAssets';
import CecSaintResultPopup from './CecSaintResultPopup';

const SEGMENT_COUNT = WHEEL_SAINTS.length;
const SLICE_DEG = 360 / SEGMENT_COUNT;
const HALF_SLICE = SLICE_DEG / 2;

/** Pie wedge from center — slice 0 centered at top (12 o'clock). */
function wedgeClipPath(index) {
  const toPoint = (deg) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    const r = 50.2;
    return `${50 + r * Math.cos(rad)}% ${50 + r * Math.sin(rad)}%`;
  };
  const start = index * SLICE_DEG - HALF_SLICE;
  const end = index * SLICE_DEG + HALF_SLICE;
  return `polygon(50% 50%, ${toPoint(start)}, ${toPoint(end)})`;
}

/** Saint art sits in the middle of each slice; slight tilt so labels feel hand-placed. */
function sliceContentStyle(index) {
  const mid = index * SLICE_DEG;
  const rad = ((mid - 90) * Math.PI) / 180;
  const dist = 33;
  const x = 50 + dist * Math.cos(rad);
  const y = 50 + dist * Math.sin(rad);
  const tilt = ((index % 5) - 2) * 5;
  return {
    left: `${x}%`,
    top: `${y}%`,
    transform: `translate(-50%, -50%) rotate(${mid + tilt}deg)`,
  };
}

function WheelSlice({ saint, index }) {
  const [failed, setFailed] = useState(false);
  const src = saintImageUrl(saint);

  return (
    <div
      className={`cec-wheel-slice${index % 2 === 1 ? ' cec-wheel-slice--alt' : ''}`}
      style={{ clipPath: wedgeClipPath(index) }}
      aria-hidden
    >
      <div className="cec-wheel-slice-content" style={sliceContentStyle(index)}>
        {src && !failed ? (
          <img
            className="cec-wheel-slice-img"
            src={src}
            alt=""
            draggable={false}
            onError={() => setFailed(true)}
          />
        ) : (
          <span className="cec-wheel-slice-emoji">✦</span>
        )}
        <span className="cec-wheel-slice-label">{saint.shortLabel}</span>
      </div>
    </div>
  );
}

function CecSaintWheel({ worshiper, alreadySpun, onClose, onSpinResult }) {
  const [spinning, setSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

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
      const landOn = extraTurns * 360 + (360 - safeIdx * SLICE_DEG);
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
          <div className="cec-wheel-pointer" aria-hidden>
            ▼
          </div>
          <div
            className={`cec-wheel-rotator${spinning ? ' cec-wheel-rotator--spinning' : ''}${alreadySpun ? ' cec-wheel-rotator--done' : ''}`}
            style={{ transform: `rotate(${wheelRotation}deg)` }}
          >
            <img
              className="cec-wheel-wood"
              src={ASSET_DIRS.wheelWood}
              alt=""
              draggable={false}
            />
            <div className="cec-wheel-disc">
              {WHEEL_SAINTS.map((saint, i) => (
                <WheelSlice key={saint.id} saint={saint} index={i} />
              ))}
            </div>
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
