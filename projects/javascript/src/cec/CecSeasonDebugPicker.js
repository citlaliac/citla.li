import React, { useState } from 'react';
import {
  CEC_SEASON_THEME_IDS,
  CEC_SEASON_THEMES,
  buildSeasonTestUrl,
  isSeasonDebugEnabled,
} from './cecSeasonTheme';

function CecSeasonDebugPicker({ activeThemeId, overrideThemeId, onSelectOverride, liturgicalThemeId }) {
  const [collapsed, setCollapsed] = useState(false);

  if (!isSeasonDebugEnabled()) return null;

  const effective = overrideThemeId || activeThemeId;

  return (
    <div className={`cec-season-debug${collapsed ? ' cec-season-debug--collapsed' : ''}`}>
      <button
        type="button"
        className="cec-season-debug-toggle"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
      >
        Season test
      </button>
      {!collapsed && (
        <div className="cec-season-debug-body">
          <p className="cec-season-debug-meta">
            Live API: <strong>{CEC_SEASON_THEMES[liturgicalThemeId]?.label ?? liturgicalThemeId}</strong>
            <br />
            Showing: <strong>{CEC_SEASON_THEMES[effective]?.label ?? effective}</strong>
            {overrideThemeId ? ' (override)' : ''}
          </p>
          <label className="cec-season-debug-label" htmlFor="cec-season-debug-select">
            Preview theme
          </label>
          <select
            id="cec-season-debug-select"
            className="cec-season-debug-select"
            value={overrideThemeId ?? ''}
            onChange={(e) => onSelectOverride(e.target.value || null)}
          >
            <option value="">Use liturgical calendar</option>
            {CEC_SEASON_THEME_IDS.map((id) => (
              <option key={id} value={id}>
                {CEC_SEASON_THEMES[id].label}
              </option>
            ))}
          </select>
          <p className="cec-season-debug-hint">
            Or open <code>/catholicecloudtest?cecSeason=advent</code>
          </p>
          <ul className="cec-season-debug-links">
            {CEC_SEASON_THEME_IDS.map((id) => (
              <li key={id}>
                <a href={buildSeasonTestUrl(id)}>{CEC_SEASON_THEMES[id].label}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default CecSeasonDebugPicker;
