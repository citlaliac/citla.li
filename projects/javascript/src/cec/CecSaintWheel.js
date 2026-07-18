import React, { useMemo, useState } from 'react';
import { WHEEL_SAINTS } from './cecConfig';
import { saintImageUrl } from './cecAssets';
import CecSaintResultPopup from './CecSaintResultPopup';
import { cecAuthHeaders } from './cecApi';

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

function CecSaintWheel({ worshiper, onClose, onSpinResult }) {
  const [spinning, setSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const resultIndex = useMemo(() => {
    if (!result?.saintId) return -1;
    return WHEEL_SAINTS.findIndex((s) => s.id === result.saintId);
  }, [result]);

  const handleSpin = async () => {
    setSpinning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/cec-wheel-spin.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...cecAuthHeaders() },
        body: JSON.stringify({ sessionId: worshiper.sessionId }),
      });
      const payload = await res.json();
      let data = payload;

      if (res.status === 409) {
        // Unlimited spins visually; server still guards PP to first eligible spin.
        const randomSaint = WHEEL_SAINTS[Math.floor(Math.random() * WHEEL_SAINTS.length)];
        data = {
          success: true,
          saintId: randomSaint.id,
          saintLabel: randomSaint.label,
          points: 0,
        };
      } else if (!payload.success) {
        throw new Error(payload.error || 'Spin failed');
      }

      const idx = WHEEL_SAINTS.findIndex((s) => s.id === data.saintId);
      const safeIdx = idx >= 0 ? idx : 0;
      const extraTurns = 4 + Math.floor(Math.random() * 2);
      const landOn = extraTurns * 360 + (360 - safeIdx * SLICE_DEG);
      setWheelRotation((r) => r + landOn);

      window.setTimeout(() => {
        setResult(data);
        if (data.points > 0) onSpinResult(data);
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
          Spin as much as you want. Pontifex Points are awarded once per worshiper per day.
        </p>

        <div className="cec-wheel-stage">
          <div className="cec-wheel-pointer" aria-hidden>
            ▼
          </div>
          <div
            className={`cec-wheel-rotator${spinning ? ' cec-wheel-rotator--spinning' : ''}`}
            style={{ transform: `rotate(${wheelRotation}deg)` }}
          >
            <div className="cec-wheel-disc">
              {WHEEL_SAINTS.map((saint, i) => (
                <WheelSlice key={saint.id} saint={saint} index={i} />
              ))}
            </div>
          </div>
          <button type="button" className="cec-wheel-hub" onClick={handleSpin} disabled={spinning}>
            {spinning ? '…' : 'SPIN'}
          </button>
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
