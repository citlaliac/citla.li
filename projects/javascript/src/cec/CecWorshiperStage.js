import React, { useId } from 'react';
import CecWorshiperPortrait from './CecWorshiperPortrait';
import { ENTRY_WORSHIPER_SKINS_BY_ID, nextRank, POPE_RANK, papacyRulesBullets } from './cecConfig';
import { getSeasonStarNameStyle } from './cecSeasonTheme';

function CecWorshiperStage({
  worshiper,
  reigningPope,
  faction,
  onPortraitClick,
  onCongregationClick,
  onLogout,
  starPalette = 'gold',
}) {
  const nameStyle = getSeasonStarNameStyle(starPalette);
  const papacyCtx = { accountId: worshiper.accountId, reigningPope };
  const upcoming = nextRank(worshiper.pontifexPoints, papacyCtx);
  const skin =
    ENTRY_WORSHIPER_SKINS_BY_ID[worshiper.avatarId] ?? {
      label: 'Worshiper',
    };
  const ppToNext = upcoming ? upcoming.minPP - worshiper.pontifexPoints : 0;
  const nextIsBonusLevel = upcoming?.id === 'pope';
  const isPope = worshiper.rank.id === 'pope';
  const papacyRulesId = useId();
  const papacyRules = papacyRulesBullets();
  const popeEligibleNotReigning =
    worshiper.accountId &&
    (worshiper.pontifexPoints ?? 0) >= POPE_RANK.minPP &&
    !isPope &&
    reigningPope;

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

      {isPope ? (
        <span className="cec-worshiper-stage-rank-wrap">
          <span
            className="cec-worshiper-stage-rank cec-worshiper-stage-rank--pope"
            tabIndex={0}
            aria-describedby={papacyRulesId}
          >
            {worshiper.rank.label}
          </span>
          <span className="cec-papacy-rules-tip" id={papacyRulesId} role="tooltip">
            <ul className="cec-papacy-rules-list">
              {papacyRules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </span>
        </span>
      ) : (
        <p className="cec-worshiper-stage-rank">{worshiper.rank.label}</p>
      )}

      <div className="cec-worshiper-stage-pp-block">
        <span className="cec-worshiper-stage-pp-label">Pontifex Points</span>
        <strong className="cec-worshiper-stage-pp-value">{worshiper.pontifexPoints}</strong>
      </div>

      {onCongregationClick && (
        <button
          type="button"
          className="cec-worshiper-stage-congregation"
          onClick={onCongregationClick}
        >
          Congregation
          {faction?.joined ? (
            <span>{faction.descendantFollowers} followers</span>
          ) : (
            <span>Join or found one</span>
          )}
        </button>
      )}

      {upcoming ? (
        <p className="cec-worshiper-stage-next">
          {nextIsBonusLevel ? 'BONUS LEVEL' : 'Next'}: <strong>{upcoming.label}</strong>
          <span className="cec-worshiper-stage-next-pp">
            {ppToNext > 0 ? `${ppToNext} PP to go` : '— rank up!'}
          </span>
        </p>
      ) : (
        <p className="cec-worshiper-stage-next cec-worshiper-stage-next--max">
          {isPope ? 'Supreme pontiff' : 'Highest rank this visit'}
        </p>
      )}

      {worshiper.accountId && onLogout && (
        <button type="button" className="cec-worshiper-stage-logout" onClick={onLogout}>
          Log out
        </button>
      )}

      {popeEligibleNotReigning && (
        <p className="cec-worshiper-stage-papacy-hint">
          Outrank {reigningPope.displayName} to reclaim the Papacy.
        </p>
      )}
    </aside>
  );
}

export default CecWorshiperStage;
