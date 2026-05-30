import React, { useEffect, useRef, useState } from 'react';
import { getCecSeasonTheme, seasonAssetUrl } from './cecSeasonTheme';

const FLOATER_PLACEHOLDER = {
  wreath: '🕯️',
  angel: '👼',
  camel: '🐫',
  fish: '🐟',
  palm: '🌿',
  lamb: '🐑',
  fire: '🔥',
};

const SPEED_MIN = 0.3;
const SPEED_MAX = 0.58;

function randomSpeed() {
  const sign = () => (Math.random() > 0.5 ? 1 : -1);
  return {
    vx: sign() * (SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN)),
    vy: sign() * (SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN)),
  };
}

function CecSeasonBouncer({ spec }) {
  const rootRef = useRef(null);
  const motion = spec.motion ?? 'drift';
  const src = seasonAssetUrl(spec.asset);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return undefined;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sim = { x: 0, y: 0, w: 0, h: 0, ...randomSpeed() };

    const measure = () => {
      sim.w = el.offsetWidth;
      sim.h = el.offsetHeight;
    };

    const placeCenter = () => {
      measure();
      const maxX = Math.max(0, window.innerWidth - sim.w);
      const maxY = Math.max(0, window.innerHeight - sim.h);
      sim.x = maxX * 0.5;
      sim.y = maxY * 0.5;
      el.style.transform = `translate(${sim.x}px, ${sim.y}px)`;
    };

    placeCenter();

    let rafId = 0;

    const tick = () => {
      if (sim.w <= 0 || sim.h <= 0) {
        measure();
        if (sim.w > 0 && sim.h > 0) {
          const maxX = Math.max(0, window.innerWidth - sim.w);
          const maxY = Math.max(0, window.innerHeight - sim.h);
          sim.x = Math.min(sim.x, maxX);
          sim.y = Math.min(sim.y, maxY);
        }
        rafId = window.requestAnimationFrame(tick);
        return;
      }

      const maxX = Math.max(0, window.innerWidth - sim.w);
      const maxY = Math.max(0, window.innerHeight - sim.h);

      sim.x += sim.vx;
      sim.y += sim.vy;

      if (sim.x <= 0) {
        sim.x = 0;
        sim.vx = Math.abs(sim.vx);
      } else if (sim.x >= maxX) {
        sim.x = maxX;
        sim.vx = -Math.abs(sim.vx);
      }

      if (sim.y <= 0) {
        sim.y = 0;
        sim.vy = Math.abs(sim.vy);
      } else if (sim.y >= maxY) {
        sim.y = maxY;
        sim.vy = -Math.abs(sim.vy);
      }

      el.style.transform = `translate(${sim.x}px, ${sim.y}px)`;
      rafId = window.requestAnimationFrame(tick);
    };

    const onResize = () => {
      const prevW = sim.w;
      const prevH = sim.h;
      measure();
      const maxX = Math.max(0, window.innerWidth - sim.w);
      const maxY = Math.max(0, window.innerHeight - sim.h);
      if (prevW > 0 && prevH > 0) {
        sim.x = (sim.x / Math.max(1, window.innerWidth - prevW)) * maxX;
        sim.y = (sim.y / Math.max(1, window.innerHeight - prevH)) * maxY;
      }
      sim.x = Math.min(Math.max(0, sim.x), maxX);
      sim.y = Math.min(Math.max(0, sim.y), maxY);
    };

    window.addEventListener('resize', onResize);

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(el);

    if (!reduced) {
      rafId = window.requestAnimationFrame(tick);
    }

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      ro?.disconnect();
    };
  }, [spec.asset, spec.kind]);

  const style = {
    '--cec-floater-opacity': spec.opacity,
    '--cec-floater-size': `${spec.sizeRem}rem`,
  };

  return (
    <div
      ref={rootRef}
      className={`cec-season-floater cec-season-floater--bounce cec-season-floater--${spec.kind}${
        motion === 'fan' ? ' cec-season-floater--fan' : ''
      }`}
      style={style}
      aria-hidden
    >
      {src && !broken ? (
        <img
          className="cec-season-floater-img"
          src={src}
          alt=""
          draggable={false}
          onError={() => setBroken(true)}
        />
      ) : (
        <span className="cec-season-floater-placeholder">{FLOATER_PLACEHOLDER[spec.kind]}</span>
      )}
    </div>
  );
}

function CecSeasonAmbience({ themeId }) {
  const theme = getCecSeasonTheme(themeId);
  const spec = theme.floaters?.[0];

  if (!spec) return null;

  return (
    <div className="cec-season-ambience" aria-hidden>
      <CecSeasonBouncer key={themeId} spec={spec} />
    </div>
  );
}

export default CecSeasonAmbience;
