import React, { useCallback, useMemo, useRef, useState } from 'react';
import { formatMoney } from '../finance/financeConfig';

/** Categories shown on the outer wheel (matches the rough draft layout). */
export const FINANCE2_WHEEL_SLUGS = [
  'utilities',
  'groceries',
  'entertainment',
  'subscriptions',
  'oops-splurge',
  'restaurants',
  'home-goods',
  'rent',
];

/** Short wedge labels that fit in a segment. */
const WHEEL_SHORT_LABEL = {
  utilities: 'Utilities',
  groceries: 'Grocery',
  entertainment: 'Entertain.',
  subscriptions: 'Subs',
  'oops-splurge': 'Oops',
  restaurants: 'Restaurants',
  'home-goods': 'House',
  rent: 'Rent',
};

/** Soft pastel rainbow — less neon, more Tinder-warm. */
const WHEEL_RAINBOW = [
  '#ff8fab', // blush rose
  '#ffb347', // soft orange
  '#ffe066', // warm yellow
  '#8fd9a8', // mint
  '#7ec8e3', // sky
  '#a78bfa', // soft violet
  '#e879f9', // orchid
  '#fb7185', // coral pink
];

const VIEW = 320;
const CX = VIEW / 2;
const CY = VIEW / 2;
// Thicker ring + smaller hole → more swipe surface toward categories.
const OUTER_R = 155;
const INNER_R = 62;
/** Accept a drop once the charge enters the colored ring. */
const DROP_MIN_R = INNER_R + 6;
/** Pointer movement below this (viewBox units) counts as a tap, not a swipe. */
const TAP_MOVE_MAX = 14;
const DOUBLE_TAP_MS = 380;

/**
 * Build an SVG donut-slice path from startAngle→endAngle (degrees, 0 = top, clockwise).
 */
function wedgePath(startDeg, endDeg, innerR, outerR) {
  const toRad = (d) => ((d - 90) * Math.PI) / 180;
  const sx = CX + outerR * Math.cos(toRad(startDeg));
  const sy = CY + outerR * Math.sin(toRad(startDeg));
  const ex = CX + outerR * Math.cos(toRad(endDeg));
  const ey = CY + outerR * Math.sin(toRad(endDeg));
  const ix = CX + innerR * Math.cos(toRad(endDeg));
  const iy = CY + innerR * Math.sin(toRad(endDeg));
  const jx = CX + innerR * Math.cos(toRad(startDeg));
  const jy = CY + innerR * Math.sin(toRad(startDeg));
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return [
    `M ${sx} ${sy}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${ex} ${ey}`,
    `L ${ix} ${iy}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${jx} ${jy}`,
    'Z',
  ].join(' ');
}

/** Pointer angle → wheel segment index (0 at top, clockwise). */
function angleToIndex(dx, dy, count) {
  let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
  deg = ((deg % 360) + 360) % 360;
  return Math.min(count - 1, Math.floor(deg / (360 / count)));
}

/**
 * Swipe-to-category wheel: drag the charge into a rainbow ring segment (or tap a wedge).
 * Double-tap the amount to flip +/− (single tap does nothing).
 */
function Finance2SwipeWheel({
  transaction,
  categories,
  disabled = false,
  onAssign,
  onFlipAmount,
  onUndo,
  canUndo = false,
}) {
  const shellRef = useRef(null);
  const [drag, setDrag] = useState({ active: false, x: 0, y: 0 });
  const [hoverIndex, setHoverIndex] = useState(-1);
  const pointerIdRef = useRef(null);
  const dragOriginRef = useRef({ x: 0, y: 0 });
  const dragMovedRef = useRef(false);
  const lastTapAtRef = useRef(0);

  const wedges = useMemo(() => {
    const bySlug = Object.fromEntries((categories || []).map((c) => [c.slug, c]));
    const step = 360 / FINANCE2_WHEEL_SLUGS.length;
    return FINANCE2_WHEEL_SLUGS.map((slug, i) => {
      const cat = bySlug[slug];
      const start = i * step;
      const end = (i + 1) * step;
      const mid = start + step / 2;
      const labelR = (INNER_R + OUTER_R) / 2;
      const toRad = (d) => ((d - 90) * Math.PI) / 180;
      return {
        slug,
        category: cat,
        start,
        end,
        mid,
        path: wedgePath(start, end, INNER_R, OUTER_R),
        labelX: CX + labelR * Math.cos(toRad(mid)),
        labelY: CY + labelR * Math.sin(toRad(mid)),
        shortLabel: WHEEL_SHORT_LABEL[slug] || slug,
        color: WHEEL_RAINBOW[i % WHEEL_RAINBOW.length],
      };
    }).filter((w) => w.category);
  }, [categories]);

  const localPoint = useCallback((clientX, clientY) => {
    const el = shellRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    const scale = VIEW / rect.width;
    return {
      x: (clientX - rect.left) * scale - CX,
      y: (clientY - rect.top) * scale - CY,
    };
  }, []);

  const endDrag = useCallback(
    (clientX, clientY) => {
      if (!drag.active || disabled || !transaction) {
        setDrag({ active: false, x: 0, y: 0 });
        setHoverIndex(-1);
        return;
      }
      const { x, y } = localPoint(clientX, clientY);
      const dist = Math.hypot(x, y);
      const travel = Math.hypot(x - dragOriginRef.current.x, y - dragOriginRef.current.y);
      const idx = angleToIndex(x, y, wedges.length);
      const wasTap = !dragMovedRef.current && travel < TAP_MOVE_MAX;

      setDrag({ active: false, x: 0, y: 0 });
      setHoverIndex(-1);

      // Double-tap anywhere on the charge (without swiping) flips +/−.
      if (wasTap) {
        const now = Date.now();
        if (now - lastTapAtRef.current <= DOUBLE_TAP_MS) {
          lastTapAtRef.current = 0;
          onFlipAmount?.();
          return;
        }
        lastTapAtRef.current = now;
        return;
      }

      if (dist >= DROP_MIN_R && wedges[idx]?.category) {
        onAssign?.(wedges[idx].category.id);
      }
    },
    [drag.active, disabled, transaction, localPoint, wedges, onAssign, onFlipAmount]
  );

  const onPointerDown = (e) => {
    if (disabled || !transaction) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointerIdRef.current = e.pointerId;
    dragMovedRef.current = false;
    const { x, y } = localPoint(e.clientX, e.clientY);
    dragOriginRef.current = { x, y };
    setDrag({ active: true, x, y });
    setHoverIndex(-1);
  };

  const onPointerMove = (e) => {
    if (!drag.active || pointerIdRef.current !== e.pointerId) return;
    const { x, y } = localPoint(e.clientX, e.clientY);
    const travel = Math.hypot(x - dragOriginRef.current.x, y - dragOriginRef.current.y);
    if (travel >= TAP_MOVE_MAX) dragMovedRef.current = true;
    setDrag({ active: true, x, y });
    const dist = Math.hypot(x, y);
    // Highlight earlier so the hit area feels bigger while dragging.
    setHoverIndex(dist >= INNER_R * 0.55 ? angleToIndex(x, y, wedges.length) : -1);
  };

  const onPointerUp = (e) => {
    if (pointerIdRef.current !== e.pointerId) return;
    pointerIdRef.current = null;
    endDrag(e.clientX, e.clientY);
  };

  if (!transaction) return null;

  // Soft Tinder-like tilt while dragging; snaps back with CSS when released.
  const tilt = drag.active ? drag.x * 0.07 : 0;
  const cardTransform = drag.active
    ? `translate(${drag.x}px, ${drag.y}px) rotate(${tilt}deg) scale(1.05)`
    : 'translate(0, 0) rotate(0deg) scale(1)';

  return (
    <div className="finance2-wheel-wrap">
      <button
        type="button"
        className="finance2-undo"
        onClick={onUndo}
        disabled={!canUndo || disabled}
        aria-label="Undo last category"
      >
        undo
      </button>

      <div className="finance2-wheel-shell" ref={shellRef}>
        <svg
          className="finance2-wheel-svg"
          viewBox={`0 0 ${VIEW} ${VIEW}`}
          role="img"
          aria-label="Category wheel — swipe charge into a segment"
        >
          <defs>
            {/* Soft sheen + circular clip so the ring feels like a single soft puck. */}
            <radialGradient id="finance2-wheel-sheen" cx="42%" cy="32%" r="70%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.42" />
              <stop offset="45%" stopColor="#ffffff" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#1a1020" stopOpacity="0.1" />
            </radialGradient>
            <clipPath id="finance2-wheel-clip">
              <circle cx={CX} cy={CY} r={OUTER_R} />
            </clipPath>
          </defs>

          <g clipPath="url(#finance2-wheel-clip)">
            {wedges.map((w, i) => (
              <g key={w.slug}>
                <path
                  className={`finance2-wheel-wedge${hoverIndex === i ? ' is-hot' : ''}`}
                  d={w.path}
                  fill={w.color}
                  onClick={() => !disabled && onAssign?.(w.category.id)}
                />
                <text
                  className="finance2-wheel-label"
                  x={w.labelX}
                  y={w.labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${w.mid}, ${w.labelX}, ${w.labelY})`}
                  pointerEvents="none"
                >
                  {w.shortLabel}
                </text>
              </g>
            ))}
            <circle
              cx={CX}
              cy={CY}
              r={OUTER_R}
              fill="url(#finance2-wheel-sheen)"
              pointerEvents="none"
            />
          </g>

          {/* Soft center well for the swipe card */}
          <circle cx={CX} cy={CY} r={INNER_R} className="finance2-wheel-hole" />
          <circle
            cx={CX}
            cy={CY}
            r={INNER_R - 1}
            className="finance2-wheel-hole-ring"
            fill="none"
          />
        </svg>

        <div
          className={`finance2-wheel-charge${drag.active ? ' is-dragging' : ''}`}
          style={{ transform: cardTransform }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <p className="finance2-wheel-merchant">{transaction.merchantName}</p>
          <p className="finance2-wheel-amount" aria-live="polite">
            {formatMoney(transaction.amount)}
          </p>
          <p className="finance2-wheel-flip-hint">double-tap +/−</p>
          <p className="finance2-wheel-date">{transaction.date}</p>
        </div>
      </div>

      <p className="finance2-wheel-hint">Swipe into a category · or tap a wedge</p>
    </div>
  );
}

export default Finance2SwipeWheel;
