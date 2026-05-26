import React from 'react';
import CecWorshiperPortrait from './CecWorshiperPortrait';
import { nextRank } from './cecConfig';

function CecWorshiperStage({ worshiper }) {
  const upcoming = nextRank(worshiper.pontifexPoints);

  return (
    <aside className="cec-worshiper-stage" aria-label="Your worshiper">
      <CecWorshiperPortrait worshiper={worshiper} size="hero" />
      <p className="cec-worshiper-stage-name">{worshiper.displayName}</p>
      <p className="cec-worshiper-stage-rank">{worshiper.rank.label}</p>
      <p className="cec-worshiper-stage-pp">
        <strong>{worshiper.pontifexPoints}</strong> Pontifex Points
      </p>
      {upcoming && (
        <p className="cec-worshiper-stage-next">
          Next: {upcoming.label} at {upcoming.minPP} PP
        </p>
      )}
    </aside>
  );
}

export default CecWorshiperStage;
