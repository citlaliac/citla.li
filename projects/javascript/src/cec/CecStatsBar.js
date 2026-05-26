import React from 'react';

function CecStatsBar({ worshiper }) {
  return (
    <div className="cec-stats-bar">
      <div className="cec-stats-bar-inner">
        <span className="cec-stats-name">{worshiper.displayName}</span>
        <span className="cec-stats-rank">{worshiper.rank.label}</span>
        <span className="cec-stats-pp">
          <span className="cec-stats-pp-label">Pontifex Points</span>
          <strong>{worshiper.pontifexPoints}</strong>
        </span>
      </div>
    </div>
  );
}

export default CecStatsBar;
