import React from 'react';
import CecWorshiperPortrait from './CecWorshiperPortrait';
import { ENTRY_WORSHIPER_SKINS_BY_ID, nextRank } from './cecConfig';
import { getSeasonStarNameStyle } from './cecSeasonTheme';

function CecWorshiperStage({ worshiper, onPortraitClick, starPalette = 'gold' }) {
  const nameStyle = getSeasonStarNameStyle(starPalette);
  const upcoming = nextRank(worshiper.pontifexPoints);
  const skin =
    ENTRY_WORSHIPER_SKINS_BY_ID[worshiper.avatarId] ?? {
      label: 'Worshiper',
    };
  const ppToNext = upcoming ? upcoming.minPP - worshiper.pontifexPoints : 0;
  const nextIsBonusLevel = upcoming?.id === 'pope';

  return (
    <aside className="cec-worshiper-stage" aria-label="Your worshiper">
      <p className="cec-worshiper-stage-kicker">Your worshiper</p>
      <p className="cec-worshiper-stage-type">{skin.label}</p>
      <p className="cec-worshiper-stage-name" style={nameStyle}>
        {worshiper.displayName}
      </p>

      <button
        type="button"
        className="cec-worshiper-stage-portrait-btn"
        onClick={onPortraitClick}
        aria-label="Receive communion"
      >
        <CecWorshiperPortrait worshiper={worshiper} size="hero" />
      </button>

      <p className="cec-worshiper-stage-rank">{worshiper.rank.label}</p>

      <div className="cec-worshiper-stage-pp-block">
        <span className="cec-worshiper-stage-pp-label">Pontifex Points</span>
        <strong className="cec-worshiper-stage-pp-value">{worshiper.pontifexPoints}</strong>
      </div>

      {upcoming ? (
        <p className="cec-worshiper-stage-next">
          {nextIsBonusLevel ? 'BONUS LEVEL' : 'Next'}: <strong>{upcoming.label}</strong>
          <span className="cec-worshiper-stage-next-pp">
            {ppToNext > 0 ? `${ppToNext} PP to go` : '— rank up!'}
          </span>
        </p>
      ) : (
        <p className="cec-worshiper-stage-next cec-worshiper-stage-next--max">
          {worshiper.rank.id === 'pope' ? 'Supreme pontiff' : 'Highest rank this visit'}
        </p>
      )}
    </aside>
  );
}

export default CecWorshiperStage;
