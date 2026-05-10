import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useSEO } from '../hooks/useSEO';
import '../styles/CatholiceCloudPage.css';

/** Files in public/ — must use runtime URL; css-loader cannot resolve absolute /assets paths */
const PUB = process.env.PUBLIC_URL || '';
const BG = {
  cathedral: `${PUB}/assets/catholicecloud/background/cathedral-bkg.jpg`,
  heaven: `${PUB}/assets/catholicecloud/background/heaven-bkg.jpg`,
  forest: `${PUB}/assets/catholicecloud/background/foret_fontainebleu.jpg`,
};

const RELICS_BASE = `${PUB}/assets/catholicecloud/relics`;
const FRAME_POPUP = `${PUB}/assets/catholicecloud/frame.png`;

/** Fixed sparkles — viewport-locked like old Neopets city chrome */
const SPRINKLES = [
  { id: 'sp1', c: '✦', t: '6%', l: '5%', sz: 13, o: 0.5, r: -12 },
  { id: 'sp2', c: '⋆', t: '11%', l: '92%', sz: 16, o: 0.45, r: 8 },
  { id: 'sp3', c: '˖', t: '22%', l: '3%', sz: 18, o: 0.4, r: 0 },
  { id: 'sp4', c: '✧', t: '18%', l: '78%', sz: 12, o: 0.55, r: 22 },
  { id: 'sp5', c: '°', t: '34%', l: '96%', sz: 20, o: 0.35, r: 0 },
  { id: 'sp6', c: '﹡', t: '44%', l: '8%', sz: 14, o: 0.48, r: -6 },
  { id: 'sp7', c: '✶', t: '52%', l: '94%', sz: 15, o: 0.42, r: 15 },
  { id: 'sp8', c: '·', t: '63%', l: '4%', sz: 22, o: 0.38, r: 0 },
  { id: 'sp9', c: '✦', t: '71%', l: '88%', sz: 13, o: 0.52, r: -18 },
  { id: 'sp10', c: '⋆', t: '82%', l: '10%', sz: 17, o: 0.44, r: 6 },
  { id: 'sp11', c: '˖', t: '88%', l: '72%', sz: 14, o: 0.46, r: -10 },
  { id: 'sp12', c: '✧', t: '93%', l: '42%', sz: 15, o: 0.5, r: 20 },
  { id: 'sp13', c: '✦', t: '28%', l: '48%', sz: 11, o: 0.32, r: 0 },
  { id: 'sp14', c: '⋆', t: '58%', l: '52%', sz: 12, o: 0.28, r: 14 },
  { id: 'sp15', c: '·', t: '76%', l: '35%', sz: 19, o: 0.3, r: 0 },
  { id: 'sp16', c: '﹡', t: '14%', l: '58%', sz: 10, o: 0.42, r: -25 },
  { id: 'sp17', c: '✶', t: '39%', l: '22%', sz: 13, o: 0.36, r: 11 },
  { id: 'sp18', c: '˖', t: '47%', l: '68%', sz: 14, o: 0.4, r: -8 },
  { id: 'sp19', c: '✧', t: '66%', l: '58%', sz: 12, o: 0.33, r: 0 },
  { id: 'sp20', c: '°', t: '8%', l: '38%', sz: 15, o: 0.37, r: 5 },
  { id: 'sp21', c: '✦', t: '96%', l: '18%', sz: 13, o: 0.48, r: -15 },
  { id: 'sp22', c: '⋆', t: '61%', l: '26%', sz: 11, o: 0.34, r: 0 },
  { id: 'sp23', c: '·', t: '31%', l: '88%', sz: 16, o: 0.29, r: 0 },
  { id: 'sp24', c: '﹡', t: '54%', l: '14%', sz: 12, o: 0.41, r: 18 },
];

/** public/assets/catholicecloud/relics/ — png / jpg / webp; fallbackEmoji if load fails */
const HOTSPOTS = [
  {
    id: 'aspergillum',
    icon: 'aspergillum.png',
    fallbackEmoji: '💧',
    label: 'Aspergillum',
    fact: "sprinkle sprinkle! You're all wet with holy water!",
    top: '11%',
    left: '84%',
  },
  {
    id: 'vatican',
    icon: 'vatican.png',
    fallbackEmoji: '🏛️',
    label: 'Vatican',
    fact: 'Yur visit to the Vatican has topped up your ecclesiastical health!',
    top: '22%',
    left: '46%',
  },
  {
    id: 'rosary',
    icon: 'rosary.webp',
    fallbackEmoji: '📿',
    label: 'Rosary',
    fact: 'Placeholder: your decade counter is still loading. Check back after Vespers.',
    top: '58%',
    left: '9%',
  },
  {
    id: 'incense',
    icon: 'insence.webp',
    fallbackEmoji: '💨',
    label: 'Incense',
    fact: 'Placeholder: thurible physics are being smoke-tested. Fun fact TBD.',
    top: '16%',
    left: '14%',
  },
  {
    id: 'candle',
    icon: 'vigil-candle.png',
    fallbackEmoji: '🕯️',
    label: 'Vigil candle',
    fact: 'Placeholder: this flame is purely decorative until the wax DLC drops.',
    top: '84%',
    left: '54%',
  },
  {
    id: 'st-jude',
    icon: 'st-jude-arm-bone.png',
    fallbackEmoji: '🦴',
    label: 'St. Jude',
    fact: 'Placeholder: patron of hopeless causes — including this tooltip.',
    top: '48%',
    left: '88%',
  },
  {
    id: 'fish-fry',
    icon: 'lent-fish-fry.png',
    fallbackEmoji: '🐟',
    label: 'Lent fish fry',
    fact: 'Placeholder: Friday squad pending. Tartar sauce not canonical but respected.',
    top: '76%',
    left: '22%',
  },
];

/** Map tour order — snakes across the board like an old Neopets map */
const WALK_ORDER = [
  'incense',
  'fish-fry',
  'rosary',
  'vatican',
  'aspergillum',
  'st-jude',
  'candle',
];

function pctCoord(pctStr) {
  return parseFloat(String(pctStr).replace('%', ''), 10);
}

function spotCenter(spot) {
  return { x: pctCoord(spot.left), y: pctCoord(spot.top) };
}

/** Jagged “hand-drawn” polyline in 0–100 space (same as % positions) */
function buildWobblyWalkPath(points) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const px = -dy / len;
    const py = dx / len;
    const segs = 6;
    for (let s = 1; s <= segs; s++) {
      const t = s / segs;
      let x = a.x + dx * t;
      let y = a.y + dy * t;
      const wobble =
        Math.sin(i * 2.7 + s * 0.9) * 2.8 +
        ((s + i) % 3 === 0 ? 1.6 : -1.1) +
        (s % 2) * 0.9;
      x += px * wobble;
      y += py * wobble;
      d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
    }
  }
  return d;
}

const SPOT_BY_ID = Object.fromEntries(HOTSPOTS.map((s) => [s.id, s]));
const WALK_PATH_POINTS = WALK_ORDER.map((id) => spotCenter(SPOT_BY_ID[id]));
const WALK_PATH_D = buildWobblyWalkPath(WALK_PATH_POINTS);

function RelicHotspotButton({ spot, onPick }) {
  const [useFallback, setUseFallback] = useState(false);
  const src = `${RELICS_BASE}/${spot.icon}`;

  return (
    <button
      type="button"
      className="cec-hotspot"
      style={{ top: spot.top, left: spot.left }}
      aria-label={`${spot.label}. Tap for a fun fact.`}
      onClick={() => onPick(spot)}
    >
      {useFallback ? (
        <span className="cec-hotspot-fallback" aria-hidden>
          {spot.fallbackEmoji}
        </span>
      ) : (
        <img
          className="cec-hotspot-img"
          src={src}
          alt=""
          draggable={false}
          decoding="async"
          onError={() => setUseFallback(true)}
        />
      )}
    </button>
  );
}

const AMEN_BURST_MS = 480;
const AMEN_SPARKLE_CHARS = ['✦', '⋆', '˖', '✧', '✶', '﹡', '°', '·'];

function CatholiceCloudPage() {
  const [activeHotspot, setActiveHotspot] = useState(null);
  const [amenSparkle, setAmenSparkle] = useState(false);

  const dismissAmen = () => {
    setAmenSparkle(true);
    window.setTimeout(() => {
      setActiveHotspot(null);
      setAmenSparkle(false);
    }, AMEN_BURST_MS);
  };

  useSEO({
    title: 'Catholic e Cloud | citla.li/catholicecloud',
    description:
      'Heaven online — a campy Vatican-cloud hangout. Catholics, enjoy this space.',
    keywords: 'citla.li, catholic e cloud, heaven online',
    canonicalUrl: 'https://citla.li/catholicecloud',
    ogTitle: 'Catholic e Cloud',
    ogDescription: 'Heaven on earth? This is heaven online.',
    ogImage: 'https://citla.li/og-image.gif',
    twitterTitle: 'Catholic e Cloud',
    twitterDescription: 'Heaven online. Catholics, enjoy this space.',
    twitterImage: 'https://citla.li/og-image.gif',
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="cec-page">
      <div className="cec-bg-stack" aria-hidden="true">
        <div className="cec-bg-layer cec-bg-layer--gradient" />
        <div
          className="cec-bg-layer cec-bg-layer--photo cec-bg-layer--photo-cathedral"
          style={{ backgroundImage: `url('${BG.cathedral}')` }}
        />
        <div
          className="cec-bg-layer cec-bg-layer--photo cec-bg-layer--photo-heaven"
          style={{ backgroundImage: `url('${BG.heaven}')` }}
        />
        <div
          className="cec-bg-layer cec-bg-layer--photo cec-bg-layer--photo-forest"
          style={{ backgroundImage: `url('${BG.forest}')` }}
        />
        <div className="cec-bg-layer cec-bg-layer--marble" />
        <div className="cec-bg-layer cec-bg-layer--clouds" />
        <div className="cec-bg-layer cec-bg-layer--gold-dust" />
        <div className="cec-bg-layer cec-bg-layer--vignette" />
      </div>

      <div className="cec-sprinkles" aria-hidden="true">
        {SPRINKLES.map((s) => (
          <span
            key={s.id}
            className="cec-sprinkle"
            style={{
              top: s.t,
              left: s.l,
              fontSize: `${s.sz}px`,
              opacity: s.o,
              transform: s.r !== undefined ? `rotate(${s.r}deg)` : undefined,
            }}
          >
            {s.c}
          </span>
        ))}
      </div>

      <Header />

      <main className="cec-main">
        <header className="cec-banner">
          <h1 className="cec-title">catholic e cloud</h1>
          <p className="cec-subtitle">Heaven on earth? This is heaven online.</p>
          <p className="cec-blurb">A cool online space for Catholics to hang out.</p>
        </header>

        <div className="cec-playfield">
          <svg
            className="cec-walk-path"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <g transform="translate(0.35 0.5)" className="cec-walk-path-offset">
              <path className="cec-walk-path-shadow" d={WALK_PATH_D} />
            </g>
            <path className="cec-walk-path-line" d={WALK_PATH_D} />
          </svg>
          {HOTSPOTS.map((spot) => (
            <RelicHotspotButton key={spot.id} spot={spot} onPick={setActiveHotspot} />
          ))}
        </div>
      </main>

      <Footer />

      {activeHotspot && (
        <div
          className={`cec-toast-overlay${amenSparkle ? ' cec-toast-overlay--amen' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cec-toast-title"
        >
          <div className="cec-toast-frame-wrap">
            <div className="cec-toast-frame-visual">
              <img
                className="cec-toast-frame-img"
                src={FRAME_POPUP}
                alt=""
                draggable={false}
              />
              <div className="cec-toast-frame-text">
                <div className="cec-toast-frame-text-inner">
                  <strong id="cec-toast-title">{activeHotspot.label}</strong>
                  <span className="cec-toast-body">{activeHotspot.fact}</span>
                </div>
              </div>
            </div>
            <button type="button" className="cec-toast-dismiss" onClick={dismissAmen}>
              Amen
            </button>
          </div>
          {amenSparkle && (
            <div className="cec-amen-sparkle-burst" aria-hidden="true">
              {AMEN_SPARKLE_CHARS.map((ch, i) => (
                <span
                  key={`amen-sparkle-${i}`}
                  className="cec-amen-sparkle-piece"
                  style={{
                    '--a': `${(360 / AMEN_SPARKLE_CHARS.length) * i}deg`,
                  }}
                >
                  {ch}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CatholiceCloudPage;
