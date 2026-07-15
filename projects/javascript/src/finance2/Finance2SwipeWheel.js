import React, { useCallback, useMemo, useRef, useState } from 'react';
import { formatMoney } from '../finance/financeConfig';
import { financeChipStyle } from '../finance/financeCategoryUi';

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

const VIEW = 320;
const CX = VIEW / 2;
const CY = VIEW / 2;
const OUTER_R = 148;
const INNER_R = 78;
/** Drop must land in the colored ring (beyond this radius from center). */
const DROP_MIN_R = (INNER_R + OUTER_R) / 2 - 8;

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
 * Swipe-to-category wheel: drag the charge into a colored ring segment (or tap a wedge).
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
        color: financeChipStyle(slug).backgroundColor,
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
      const idx = angleToIndex(x, y, wedges.length);
      setDrag({ active: false, x: 0, y: 0 });
      setHoverIndex(-1);
      if (dist >= DROP_MIN_R && wedges[idx]?.category) {
        onAssign?.(wedges[idx].category.id);
      }
    },
    [drag.active, disabled, transaction, localPoint, wedges, onAssign]
  );

  const onPointerDown = (e) => {
    if (disabled || !transaction) return;
    // Don’t start a swipe when tapping the +/- control.
    if (e.target.closest('.finance2-wheel-flip')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointerIdRef.current = e.pointerId;
    const { x, y } = localPoint(e.clientX, e.clientY);
    setDrag({ active: true, x, y });
    setHoverIndex(angleToIndex(x, y, wedges.length));
  };

  const onPointerMove = (e) => {
    if (!drag.active || pointerIdRef.current !== e.pointerId) return;
    const { x, y } = localPoint(e.clientX, e.clientY);
    setDrag({ active: true, x, y });
    const dist = Math.hypot(x, y);
    setHoverIndex(dist >= INNER_R * 0.85 ? angleToIndex(x, y, wedges.length) : -1);
  };

  const onPointerUp = (e) => {
    if (pointerIdRef.current !== e.pointerId) return;
    pointerIdRef.current = null;
    endDrag(e.clientX, e.clientY);
  };

  if (!transaction) return null;

  const cardTransform = drag.active
    ? `translate(${drag.x}px, ${drag.y}px)`
    : 'translate(0, 0)';

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
            {/* Soft radial wash so segment colors read as one gradient ring. */}
            <radialGradient id="finance2-wheel-sheen" cx="50%" cy="40%" r="65%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
              <stop offset="55%" stopColor="#ffffff" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.12" />
            </radialGradient>
          </defs>

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
          {/* Hollow center for the charge card */}
          <circle cx={CX} cy={CY} r={INNER_R} className="finance2-wheel-hole" />
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
          <button
            type="button"
            className="finance2-wheel-flip"
            onClick={(e) => {
              e.stopPropagation();
              onFlipAmount?.();
            }}
            disabled={disabled}
            title="Tap to flip + / −"
            aria-label="Flip amount sign"
          >
            {formatMoney(transaction.amount)}
            <span className="finance2-wheel-flip-hint">+/−</span>
          </button>
          <p className="finance2-wheel-date">{transaction.date}</p>
        </div>
      </div>

      <p className="finance2-wheel-hint">Swipe into a category · or tap a wedge</p>
    </div>
  );
}

export default Finance2SwipeWheel;
