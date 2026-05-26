import React, { useState } from 'react';
import { CEC_LOCATIONS } from './cecConfig';
import { buildDecorativePaths } from './cecPathUtils';
import { hasAmenDiscovery } from './cecConfig';
import { canSpinToday } from './worshiperStorage';

const PUB = process.env.PUBLIC_URL || '';
const RELICS_BASE = `${PUB}/assets/catholicecloud/relics`;
const PATH_DS = buildDecorativePaths();

function CecBuilding({ location, worshiper, onSelect }) {
  const [useFallback, setUseFallback] = useState(false);
  const wheelDone = location.id === 'wheel' && !canSpinToday(worshiper);
  const visited =
    (location.actionId && worshiper.completedActions.includes(location.actionId)) ||
    wheelDone;
  const discovered = hasAmenDiscovery(worshiper, location.id);
  const src = location.buildingFile
    ? `${RELICS_BASE}/${location.buildingFile}`
    : null;

  return (
    <div
      className={`cec-building${visited || discovered ? ' cec-building--visited' : ''}`}
      style={{ top: location.top, left: location.left }}
    >
      <button
        type="button"
        className="cec-building-hit"
        onClick={() => onSelect(location)}
        aria-label={
        wheelDone
          ? `${location.label}. Already visited today.`
          : `${location.label}. Click to visit.`
      }
      >
        {src && !useFallback ? (
          <img
            className="cec-building-img"
            src={src}
            alt=""
            draggable={false}
            onError={() => setUseFallback(true)}
          />
        ) : (
          <span className="cec-building-emoji" aria-hidden>
            {location.fallbackEmoji}
          </span>
        )}
      </button>
      <span className="cec-building-label">
        {location.label}
        {wheelDone ? ' · today' : ''}
      </span>
    </div>
  );
}

function CecParishMap({ worshiper, onSelectLocation }) {
  return (
    <div className="cec-playfield cec-playfield--map">
      <div className="cec-map-ground" aria-hidden="true" />
      <svg
        className="cec-walk-path"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {PATH_DS.map((d, i) => (
          <g key={`path-${i}`}>
            <g transform="translate(0.35 0.5)">
              <path className="cec-walk-path-shadow" d={d} />
            </g>
            <path className="cec-walk-path-line" d={d} />
          </g>
        ))}
      </svg>
      {CEC_LOCATIONS.map((loc) => (
        <CecBuilding
          key={loc.id}
          location={loc}
          worshiper={worshiper}
          onSelect={onSelectLocation}
        />
      ))}
    </div>
  );
}

export default CecParishMap;
