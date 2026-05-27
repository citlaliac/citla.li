import React, { useEffect, useState } from 'react';

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

function CecShootingStars() {
  const [star, setStar] = useState(null);

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
  }, []);

  if (!star) return null;

  const gradId = `cec-star-grad-${star.id}`;

  return (
    <div className="cec-shooting-stars" aria-hidden="true">
      <svg
        className="cec-shooting-star-svg"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={VIEW_W} y2={VIEW_H}>
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0)" />
            <stop offset="28%" stopColor="rgba(255, 248, 230, 0.12)" />
            <stop offset="62%" stopColor="rgba(255, 252, 245, 0.55)" />
            <stop offset="88%" stopColor="rgba(255, 255, 255, 0.92)" />
            <stop offset="100%" stopColor="rgba(255, 250, 235, 1)" />
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
