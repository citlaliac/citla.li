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
  const congregationTipId = useId();
  const papacyRules = papacyRulesBullets();
  const popeEligibleNotReigning =
    worshiper.accountId &&
    (worshiper.pontifexPoints ?? 0) >= POPE_RANK.minPP &&
    !isPope &&
    reigningPope;
  // Founder name is the congregation label shown under the worshiper name.
  const congregationName = faction?.joined ? faction.founder?.displayName : '';

  return (
    <aside className="cec-worshiper-stage" aria-label="Your worshiper">
      <p className="cec-worshiper-stage-kicker">Your worshiper</p>
      <p className="cec-worshiper-stage-type">{skin.label}</p>
      <p className="cec-worshiper-stage-name" style={nameStyle}>
        {worshiper.displayName}
      </p>

      {congregationName && onCongregationClick ? (
        <span className="cec-worshiper-stage-flock-wrap">
          <button
            type="button"
            className="cec-worshiper-stage-flock"
            onClick={onCongregationClick}
            aria-describedby={congregationTipId}
          >
            of the {congregationName} Congregation
          </button>
          <span className="cec-worshiper-stage-flock-tip" id={congregationTipId} role="tooltip">
            Click to change your congregation (who you follow)
          </span>
        </span>
      ) : null}

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

      {onCongregationClick && (
        <button
          type="button"
          className="cec-worshiper-stage-congregation"
          onClick={onCongregationClick}
          title={
            faction?.joined
              ? `${faction.descendantFollowers} followers`
              : 'Join or found a congregation'
          }
        >
          Congregation
          {faction?.joined ? (
            <span aria-hidden="true"> · {faction.descendantFollowers}</span>
          ) : null}
        </button>
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
