import React, { useState } from 'react';

const PUB = process.env.PUBLIC_URL || '';
const FRAME_POPUP = `${PUB}/assets/catholicecloud/frame.png`;

function CecSaintWheel({ worshiper, onClose, onSpinResult }) {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSpin = async () => {
    setSpinning(true);
    setError(null);
    try {
      const res = await fetch('/cec-wheel-spin.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: worshiper.sessionId }),
      });
      const data = await res.json();
      if (res.status === 409) {
        setError('Already spun today for this worshiper.');
        return;
      }
      if (!data.success) throw new Error(data.error || 'Spin failed');
      setResult(data);
      onSpinResult(data.points, data.saintLabel);
    } catch (err) {
      setError(err.message || 'Wheel stuck. Try later.');
    } finally {
      setSpinning(false);
    }
  };

  return (
    <div className="cec-toast-overlay" role="dialog" aria-modal="true" aria-labelledby="cec-wheel-title">
      <div className="cec-toast-frame-wrap cec-wheel-wrap">
        <div className="cec-toast-frame-visual">
          <img className="cec-toast-frame-img" src={FRAME_POPUP} alt="" draggable={false} />
          <div className="cec-toast-frame-text">
            <div className="cec-toast-frame-text-inner">
              <strong id="cec-wheel-title">Wheel of Saints</strong>
              {!result ? (
                <>
                  <span className="cec-toast-body">One spin per worshiper per day.</span>
                  <button
                    type="button"
                    className="cec-popup-action"
                    onClick={handleSpin}
                    disabled={spinning}
                  >
                    {spinning ? 'Spinning…' : 'Spin'}
                  </button>
                  {error && <p className="cec-wheel-error">{error}</p>}
                </>
              ) : (
                <span className="cec-toast-body">
                  {result.saintLabel} grants you <strong>{result.points}</strong> Pontifex Points!
                </span>
              )}
            </div>
          </div>
        </div>
        <button type="button" className="cec-toast-dismiss" onClick={onClose}>
          {result ? 'Amen' : 'Close'}
        </button>
      </div>
    </div>
  );
}

export default CecSaintWheel;
