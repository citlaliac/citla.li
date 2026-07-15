import React, { useCallback, useMemo, useRef, useState } from 'react';
import { formatMoney } from '../finance/financeConfig';
import {
  FINANCE2_DEFAULT_WHEEL_SLUGS,
  FINANCE2_WHEEL_RAINBOW,
  wheelShortLabel,
} from './finance2WheelPrefs';

const VIEW = 320;
const CX = VIEW / 2;
const CY = VIEW / 2;
/** Bigger outer ring, smaller hole → slice-forward layout. */
const OUTER_R = 158;
const INNER_R = 48;
/** Round only the outer rim corners — keeps slices full-width. */
const OUTER_CORNER_R = 18;
/** Tiny seam so neighboring fills don’t fight (not a “skinny gap”). */
const SEAM_DEG = 0.35;
/** Accept a drop once the charge enters the colored ring. */
const DROP_MIN_R = INNER_R + 4;
const TAP_MOVE_MAX = 14;
const DOUBLE_TAP_MS = 380;

function toRad(deg) {
  return ((deg - 90) * Math.PI) / 180;
}

function polar(r, deg) {
  const a = toRad(deg);
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
}

/**
 * Full-width annular sector with soft rounded *outer* corners only.
 * Spokes stay nearly full so slices don’t look skinny.
 */
function wedgePathRoundedOuter(startDeg, endDeg, innerR, outerR, cornerR) {
  const a0 = startDeg + SEAM_DEG;
  const a1 = endDeg - SEAM_DEG;
  const span = a1 - a0;
  const outerInset = (cornerR / outerR) * (180 / Math.PI);

  if (outerInset * 2 >= span * 0.85 || cornerR <= 0) {
    const s = polar(outerR, a0);
    const e = polar(outerR, a1);
    const i = polar(innerR, a1);
    const j = polar(innerR, a0);
    const large = span > 180 ? 1 : 0;
    return [
      `M ${s.x} ${s.y}`,
      `A ${outerR} ${outerR} 0 ${large} 1 ${e.x} ${e.y}`,
      `L ${i.x} ${i.y}`,
      `A ${innerR} ${innerR} 0 ${large} 0 ${j.x} ${j.y}`,
      'Z',
    ].join(' ');
  }

  const rSpoke = outerR - cornerR;
  const oStart = polar(outerR, a0 + outerInset);
  const oEnd = polar(outerR, a1 - outerInset);
  const spokeStart = polar(rSpoke, a0);
  const spokeEnd = polar(rSpoke, a1);
  const iEnd = polar(innerR, a1);
  const iStart = polar(innerR, a0);
  const large = a1 - a0 - outerInset * 2 > 180 ? 1 : 0;
  const largeInner = span > 180 ? 1 : 0;

  return [
    `M ${spokeStart.x} ${spokeStart.y}`,
    `A ${cornerR} ${cornerR} 0 0 1 ${oStart.x} ${oStart.y}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${oEnd.x} ${oEnd.y}`,
    `A ${cornerR} ${cornerR} 0 0 1 ${spokeEnd.x} ${spokeEnd.y}`,
    `L ${iEnd.x} ${iEnd.y}`,
    `A ${innerR} ${innerR} 0 ${largeInner} 0 ${iStart.x} ${iStart.y}`,
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
 * Swipe-to-category wheel: drag into a rainbow segment, or drag down to “All categories”.
 * Double-tap flips +/−.
 */
function Finance2SwipeWheel({
  transaction,
  categories,
  wheelSlugs = FINANCE2_DEFAULT_WHEEL_SLUGS,
  disabled = false,
  onAssign,
  onPickVendor,
  onFlipAmount,
  onUndo,
  onOpenAll,
  canUndo = false,
  allOpen = false,
}) {
  const shellRef = useRef(null);
  const allSliceRef = useRef(null);
  const [drag, setDrag] = useState({ active: false, x: 0, y: 0 });
  const [hoverIndex, setHoverIndex] = useState(-1);
  const [hoverAll, setHoverAll] = useState(false);
  const pointerIdRef = useRef(null);
  const dragOriginRef = useRef({ x: 0, y: 0 });
  const dragMovedRef = useRef(false);
  const lastTapAtRef = useRef(0);

  const wedges = useMemo(() => {
    // Exact same partition as Settings → View (no silent default fallback).
    const bySlug = Object.fromEntries((categories || []).map((c) => [c.slug, c]));
    const active = (wheelSlugs || []).filter((s) => bySlug[s]);
    if (active.length === 0) return [];
    const step = 360 / active.length;
    return active.map((slug, i) => {
      const cat = bySlug[slug];
      const start = i * step;
      const end = (i + 1) * step;
      const mid = start + step / 2;
      const labelR = INNER_R + (OUTER_R - INNER_R) * 0.58;
      const labelPos = polar(labelR, mid);
      return {
        slug,
        category: cat,
        start,
        end,
        mid,
        path: wedgePathRoundedOuter(start, end, INNER_R, OUTER_R, OUTER_CORNER_R),
        labelX: labelPos.x,
        labelY: labelPos.y,
        shortLabel: wheelShortLabel(slug, cat),
        color: FINANCE2_WHEEL_RAINBOW[i % FINANCE2_WHEEL_RAINBOW.length],
      };
    });
  }, [categories, wheelSlugs]);

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

  const isOverAllSlice = useCallback((clientX, clientY) => {
    const el = allSliceRef.current;
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    // Generous pad so “slide to the bottom” is easy to hit.
    return (
      clientY >= rect.top - 28 &&
      clientY <= rect.bottom + 12 &&
      clientX >= rect.left - 16 &&
      clientX <= rect.right + 16
    );
  }, []);

  const endDrag = useCallback(
    (clientX, clientY) => {
      if (!drag.active || disabled || !transaction) {
        setDrag({ active: false, x: 0, y: 0 });
        setHoverIndex(-1);
        setHoverAll(false);
        return;
      }
      const { x, y } = localPoint(clientX, clientY);
      const dist = Math.hypot(x, y);
      const travel = Math.hypot(x - dragOriginRef.current.x, y - dragOriginRef.current.y);
      const idx = angleToIndex(x, y, wedges.length);
      const wasTap = !dragMovedRef.current && travel < TAP_MOVE_MAX;
      const openAll = isOverAllSlice(clientX, clientY) || y > OUTER_R * 0.92;

      setDrag({ active: false, x: 0, y: 0 });
      setHoverIndex(-1);
      setHoverAll(false);

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

      if (openAll) {
        // Dragging onto the bottom slice always opens the full picker.
        onOpenAll?.(true);
        return;
      }

      if (dist >= DROP_MIN_R && wedges[idx]?.category) {
        const cat = wedges[idx].category;
        // Vendor slices (Amazon) need a follow-up spend category.
        if (cat.isVendor) {
          onPickVendor?.(cat.slug);
        } else {
          onAssign?.(cat.id);
        }
      }
    },
    [
      drag.active,
      disabled,
      transaction,
      localPoint,
      wedges,
      onAssign,
      onPickVendor,
      onFlipAmount,
      onOpenAll,
      isOverAllSlice,
    ]
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
    setHoverAll(false);
  };

  const onPointerMove = (e) => {
    if (!drag.active || pointerIdRef.current !== e.pointerId) return;
    const { x, y } = localPoint(e.clientX, e.clientY);
    const travel = Math.hypot(x - dragOriginRef.current.x, y - dragOriginRef.current.y);
    if (travel >= TAP_MOVE_MAX) dragMovedRef.current = true;
    setDrag({ active: true, x, y });

    const overAll = isOverAllSlice(e.clientX, e.clientY) || y > OUTER_R * 0.85;
    setHoverAll(overAll);
    if (overAll) {
      setHoverIndex(-1);
      return;
    }
    const dist = Math.hypot(x, y);
    setHoverIndex(dist >= INNER_R * 0.55 ? angleToIndex(x, y, wedges.length) : -1);
  };

  const onPointerUp = (e) => {
    if (pointerIdRef.current !== e.pointerId) return;
    pointerIdRef.current = null;
    endDrag(e.clientX, e.clientY);
  };

  if (!transaction) return null;

  // Shrink slightly when “picked up” (Tinder-style grab feedback).
  const tilt = drag.active ? drag.x * 0.07 : 0;
  const cardTransform = drag.active
    ? `translate(${drag.x}px, ${drag.y}px) rotate(${tilt}deg) scale(0.84)`
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
            <radialGradient id="finance2-wheel-sheen" cx="42%" cy="32%" r="70%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
              <stop offset="55%" stopColor="#ffffff" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#1a1020" stopOpacity="0.06" />
            </radialGradient>
          </defs>

          {wedges.map((w, i) => (
            <path
              key={w.slug}
              className={`finance2-wheel-wedge${hoverIndex === i ? ' is-hot' : ''}${
                drag.active && hoverIndex !== i && !hoverAll ? ' is-dim' : ''
              }`}
              d={w.path}
              fill={w.color}
              onClick={() => {
                if (disabled) return;
                if (w.category.isVendor) onPickVendor?.(w.category.slug);
                else onAssign?.(w.category.id);
              }}
            />
          ))}

          {wedges.map((w) => (
            <text
              key={`${w.slug}-label`}
              className="finance2-wheel-label"
              x={w.labelX}
              y={w.labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              pointerEvents="none"
            >
              {w.shortLabel}
            </text>
          ))}

          {wedges.length === 0 && (
            <text
              className="finance2-wheel-empty-label"
              x={CX}
              y={CY - INNER_R - 28}
              textAnchor="middle"
              dominantBaseline="middle"
              pointerEvents="none"
            >
              Empty — use More
            </text>
          )}

          <circle
            cx={CX}
            cy={CY}
            r={OUTER_R}
            fill="url(#finance2-wheel-sheen)"
            pointerEvents="none"
          />
          <circle cx={CX} cy={CY} r={INNER_R} className="finance2-wheel-hole" />
          <circle
            cx={CX}
            cy={CY}
            r={INNER_R - 0.5}
            className="finance2-wheel-hole-ring"
            fill="none"
          />
        </svg>

        <div
          className={`finance2-wheel-charge${drag.active ? ' is-dragging' : ''}${
            hoverAll ? ' is-toward-all' : ''
          }`}
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

      {/* Bottom “slice” — tap or drag the charge onto it to open all categories. */}
      <button
        ref={allSliceRef}
        type="button"
        className={`finance2-all-slice${hoverAll || allOpen ? ' is-hot' : ''}`}
        onClick={() => onOpenAll?.()}
        disabled={disabled}
        aria-expanded={allOpen}
      >
        <span className="finance2-all-slice-label">
          {allOpen ? 'Hide categories' : 'More categories'}
        </span>
        <span className="finance2-all-slice-hint">slide card down</span>
      </button>

      <p className="finance2-wheel-hint">Swipe a category · or slide down for more</p>
    </div>
  );
}

export default Finance2SwipeWheel;
