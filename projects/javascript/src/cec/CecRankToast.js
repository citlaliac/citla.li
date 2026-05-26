import React, { useEffect } from 'react';
import CecWorshiperPortrait from './CecWorshiperPortrait';

function CecRankToast({ worshiper, rank, onDone }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 3200);
    return () => window.clearTimeout(t);
  }, [onDone]);

  const previewWorshiper = { ...worshiper, rank };

  return (
    <div className="cec-rank-toast" role="status">
      <CecWorshiperPortrait worshiper={previewWorshiper} size="xl" />
      <p className="cec-rank-toast-text">
        Promoted to <strong>{rank.label}</strong>
      </p>
    </div>
  );
}

export default CecRankToast;
