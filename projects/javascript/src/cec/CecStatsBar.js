import React from 'react';
import { canSpinToday } from './worshiperStorage';
import CecWorshiperPortrait from './CecWorshiperPortrait';

function CecStatsBar({ worshiper, onOpenWheel }) {
  const canSpin = canSpinToday(worshiper);

  return (
    <div className="cec-stats-bar">
      <div className="cec-stats-bar-inner">
        <span className="cec-stats-portrait-badge" title="Session look">
          <CecWorshiperPortrait avatarId={worshiper.avatarId} size="sm" />
        </span>
        <span className="cec-stats-name">{worshiper.displayName}</span>
        <span className="cec-stats-rank">{worshiper.rank.label}</span>
        <span className="cec-stats-pp">
          <span className="cec-stats-pp-label">Pontifex Points</span>
          <strong>{worshiper.pontifexPoints}</strong>
        </span>
        <button
          type="button"
          className="cec-stats-wheel-btn"
          onClick={onOpenWheel}
          disabled={!canSpin}
          title={canSpin ? 'Spin once per day' : 'Already spun today'}
        >
          {canSpin ? 'Wheel of Saints' : 'Spun today'}
        </button>
      </div>
    </div>
  );
}

export default CecStatsBar;
