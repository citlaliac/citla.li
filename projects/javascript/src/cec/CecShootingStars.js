import React, { useEffect, useState } from 'react';
import { CEC_STAR_PALETTES } from './cecSeasonTheme';

const MIN_INTERVAL_MS = 5_000;
const MAX_INTERVAL_MS = 20_000;
const VIEW_W = 1000;
const VIEW_H = 600;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function createStar() {
  const x1 = randomBetween(40, 520);
  const y1 = randomBetween(16, 200);
  const cx = x1 + randomBetween(70, 220);
  const cy = y1 + randomBetween(-40, 90);
  const x2 = x1 + randomBetween(200, 480);
  const y2 = y1 + randomBetween(70, 260);

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    pathD: `M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`,
    duration: randomBetween(0.65, 1.15),
  };
}

function CecShootingStars({ starPalette = 'gold' }) {
  const [star, setStar] = useState(null);
  const palette = CEC_STAR_PALETTES[starPalette] ?? CEC_STAR_PALETTES.gold;
  const isDarkRed = starPalette === 'darkRed';

  useEffect(() => {
    let mounted = true;
    let scheduleTimer;
    let clearTimer;

    const scheduleNext = () => {
      const wait = randomBetween(MIN_INTERVAL_MS, MAX_INTERVAL_MS);
      scheduleTimer = window.setTimeout(() => {
        if (!mounted) return;
        const next = createStar();
        setStar(next);
        clearTimer = window.setTimeout(() => {
          if (mounted) setStar(null);
        }, next.duration * 1000 + 120);
        scheduleNext();
      }, wait);
    };

    scheduleNext();

    return () => {
      mounted = false;
      window.clearTimeout(scheduleTimer);
      window.clearTimeout(clearTimer);
    };
  }, [starPalette]);

  if (!star) return null;

  const gradId = `cec-star-grad-${star.id}`;

  return (
    <div
      className={`cec-shooting-stars${isDarkRed ? ' cec-shooting-stars--dark-red' : ''}`}
      aria-hidden="true"
      style={{ '--cec-star-core-shadow': palette.coreShadow }}
    >
      <svg
        className="cec-shooting-star-svg"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={VIEW_W} y2={VIEW_H}>
            {palette.stops.map(([offset, color]) => (
              <stop key={offset} offset={offset} stopColor={color} />
            ))}
          </linearGradient>
        </defs>
        <path
          className="cec-shooting-star-stroke cec-shooting-star-stroke--halo"
          d={star.pathD}
          pathLength="1"
          fill="none"
          stroke={`url(#${gradId})`}
          style={{ '--cec-star-dur': `${star.duration}s` }}
        />
        <path
          className="cec-shooting-star-stroke cec-shooting-star-stroke--core"
          d={star.pathD}
          pathLength="1"
          fill="none"
          stroke={`url(#${gradId})`}
          style={{ '--cec-star-dur': `${star.duration}s` }}
        />
      </svg>
    </div>
  );
}

export default CecShootingStars;
