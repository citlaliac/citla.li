import React, { useEffect } from 'react';

function CecRankToast({ rank, onDone }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 3200);
    return () => window.clearTimeout(t);
  }, [onDone]);

  return (
    <div className="cec-rank-toast" role="status">
      Promoted to <strong>{rank.label}</strong>
    </div>
  );
}

export default CecRankToast;
