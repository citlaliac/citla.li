import React, { useEffect, useState } from 'react';
import { CEC_LOCATIONS, hasActionDoneRecently, hasAmenDiscovery } from './cecConfig';

const PUB = process.env.PUBLIC_URL || '';
const RELICS_BASE = `${PUB}/assets/catholicecloud/relics`;
const MAP_IMAGE = `${PUB}/assets/catholicecloud/map2.png`;
const ASPERGILLUM_SPLASH_MS = 2000;

/** Holy-water droplets — spawn below the aspergillum and fall downward */
const ASPERGILLUM_DROPS = [
  { left: '32%', top: '76%', delay: 0.15, drift: -10 },
  { left: '42%', top: '80%', delay: 0.2, drift: -4 },
  { left: '38%', top: '78%', delay: 0.18, drift: 2 },
  { left: '48%', top: '82%', delay: 0.24, drift: 6 },
  { left: '52%', top: '77%', delay: 0.22, drift: -2 },
  { left: '58%', top: '81%', delay: 0.28, drift: 10 },
  { left: '44%', top: '84%', delay: 0.26, drift: 0 },
  { left: '54%', top: '79%', delay: 0.3, drift: 8 },
  { left: '36%', top: '83%', delay: 0.32, drift: -6 },
  { left: '60%', top: '85%', delay: 0.34, drift: 12 },
];

function relicSrc(filename) {
  if (!filename) return null;
  const encoded = filename
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
  return `${RELICS_BASE}/${encoded}`;
}

function buildingArtFile(location, actionComplete) {
  if (actionComplete && location.visitedBuildingFile) {
    return location.visitedBuildingFile;
  }
  return location.buildingFile;
}

function isBuildingFlipped(location, actionComplete) {
  if (location.flipUntilVisited && location.actionId) {
    return !actionComplete;
  }
  if (location.visitedFlip) {
    return !!actionComplete;
  }
  return false;
}

function CecBuilding({ location, worshiper, onSelect, aspergillumSplash }) {
  const actionComplete = location.actionId && hasActionDoneRecently(worshiper, location.actionId);
  const discovered = hasAmenDiscovery(worshiper, location.id);
  const visited = actionComplete || discovered;
  const candleLit = location.id === 'candle' && actionComplete;
  const buildingFlipped = isBuildingFlipped(location, actionComplete);
  const rosaryGlow = location.id === 'rosary' && actionComplete && location.visitedGlow;
  const basilicaVisited =
    location.id === 'vatican' && actionComplete && !!location.visitedBuildingFile;
  const splashActive = location.id === 'aspergillum' && aspergillumSplash;
  const artFile = buildingArtFile(location, actionComplete);
  const src = relicSrc(artFile);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    setUseFallback(false);
  }, [artFile]);

  return (
    <div
      className={`cec-building cec-building--${location.id}${
        visited ? ' cec-building--visited' : ''
      }${candleLit ? ' cec-building--candle-lit' : ''}${
        buildingFlipped ? ' cec-building--img-flipped' : ''
      }${rosaryGlow ? ' cec-building--rosary-glow' : ''}${
        basilicaVisited ? ' cec-building--basilica-visited' : ''
      }${splashActive ? ' cec-building--aspergillum-splash' : ''}`}
      style={{ top: location.top, left: location.left }}
    >
      <button
        type="button"
        className="cec-building-hit"
        onClick={() => onSelect(location)}
        aria-label={`${location.label}. Click to visit.`}
      >
        {rosaryGlow && <span className="cec-rosary-glow" aria-hidden />}
        {basilicaVisited && <span className="cec-basilica-glow" aria-hidden />}
        {splashActive && (
          <div className="cec-aspergillum-splash-fx" aria-hidden>
            {ASPERGILLUM_DROPS.map((drop, i) => (
              <span
                key={`aspergillum-drop-${i}`}
                className="cec-aspergillum-drop"
                style={{
                  left: drop.left,
                  top: drop.top,
                  '--delay': `${drop.delay}s`,
                  '--drift': `${drop.drift}px`,
                }}
              />
            ))}
          </div>
        )}
        {src && !useFallback ? (
          <img
            key={artFile}
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
        {candleLit && <span className="cec-candle-flame" aria-hidden />}
      </button>
      <span className="cec-building-label">{location.label}</span>
    </div>
  );
}

function CecParishMap({
  worshiper,
  onSelectLocation,
  aspergillumSplash = false,
  onAspergillumSplashEnd,
}) {
  useEffect(() => {
    if (!aspergillumSplash) return undefined;
    const t = window.setTimeout(() => {
      onAspergillumSplashEnd?.();
    }, ASPERGILLUM_SPLASH_MS);
    return () => window.clearTimeout(t);
  }, [aspergillumSplash, onAspergillumSplashEnd]);

  return (
    <div className="cec-playfield cec-playfield--map">
      <div className="cec-map-frame">
        <img className="cec-map-base" src={MAP_IMAGE} alt="" draggable={false} />
        <div className="cec-map-stops" role="group" aria-label="Parish map stops">
          {CEC_LOCATIONS.map((loc) => (
            <CecBuilding
              key={loc.id}
              location={loc}
              worshiper={worshiper}
              onSelect={onSelectLocation}
              aspergillumSplash={aspergillumSplash}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default CecParishMap;
