import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
/** Accept a drop once the charge enters the colored ring (VIEW units). */
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
  if (count <= 0) return -1;
  let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
  deg = ((deg % 360) + 360) % 360;
  return Math.min(count - 1, Math.floor(deg / (360 / count)));
}

/**
 * Swipe-to-category wheel: drag into a rainbow segment, or drag down to “All categories”.
 * Double-tap flips +/−. Pointer tracking uses CSS-pixel shell coords so mobile drag highlight works.
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
  const dragActiveRef = useRef(false);
  const listenersRef = useRef(null);

  const wedges = useMemo(() => {
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

  const wedgesRef = useRef(wedges);
  wedgesRef.current = wedges;

  /** Shell metrics: CSS px from center (matches card transform) + scale to VIEW units. */
  const shellMetrics = useCallback(() => {
    const el = shellRef.current;
    if (!el) {
      return { scale: 1, cx: 0, cy: 0, width: VIEW };
    }
    const rect = el.getBoundingClientRect();
    return {
      scale: rect.width / VIEW,
      cx: rect.left + rect.width / 2,
      cy: rect.top + rect.height / 2,
      width: rect.width,
    };
  }, []);

  /** Finger → CSS px relative to wheel center (same space as translate()). */
  const localPointCss = useCallback(
    (clientX, clientY) => {
      const { cx, cy } = shellMetrics();
      return { x: clientX - cx, y: clientY - cy };
    },
    [shellMetrics]
  );

  const isOverAllSlice = useCallback((clientX, clientY) => {
    const el = allSliceRef.current;
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return (
      clientY >= rect.top - 28 &&
      clientY <= rect.bottom + 12 &&
      clientX >= rect.left - 16 &&
      clientX <= rect.right + 16
    );
  }, []);

  const updateHoverFromPoint = useCallback(
    (clientX, clientY, cssX, cssY) => {
      const { scale } = shellMetrics();
      const overAll =
        isOverAllSlice(clientX, clientY) || cssY > OUTER_R * scale * 0.85;
      setHoverAll(overAll);
      if (overAll || wedgesRef.current.length === 0) {
        setHoverIndex(-1);
        return;
      }
      const dist = Math.hypot(cssX, cssY);
      // Light up a slice as soon as the finger leaves the hole (mobile needs early feedback).
      const hoverMin = INNER_R * scale * 0.35;
      if (dist < hoverMin) {
        setHoverIndex(-1);
        return;
      }
      setHoverIndex(angleToIndex(cssX, cssY, wedgesRef.current.length));
    },
    [isOverAllSlice, shellMetrics]
  );

  const clearWindowListeners = useCallback(() => {
    const bag = listenersRef.current;
    if (!bag) return;
    window.removeEventListener('pointermove', bag.move);
    window.removeEventListener('pointerup', bag.up);
    window.removeEventListener('pointercancel', bag.up);
    listenersRef.current = null;
  }, []);

  const endDrag = useCallback(
    (clientX, clientY) => {
      clearWindowListeners();
      if (!dragActiveRef.current || disabled || !transaction) {
        dragActiveRef.current = false;
        setDrag({ active: false, x: 0, y: 0 });
        setHoverIndex(-1);
        setHoverAll(false);
        return;
      }
      const { scale } = shellMetrics();
      const { x, y } = localPointCss(clientX, clientY);
      const distView = Math.hypot(x, y) / scale;
      const travelCss = Math.hypot(x - dragOriginRef.current.x, y - dragOriginRef.current.y);
      const travelView = travelCss / scale;
      const currentWedges = wedgesRef.current;
      const idx = angleToIndex(x, y, currentWedges.length);
      const wasTap = !dragMovedRef.current && travelView < TAP_MOVE_MAX;
      const openAll =
        isOverAllSlice(clientX, clientY) || y > OUTER_R * scale * 0.92;

      dragActiveRef.current = false;
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
        onOpenAll?.(true);
        return;
      }

      if (distView >= DROP_MIN_R && currentWedges[idx]?.category) {
        const cat = currentWedges[idx].category;
        if (cat.isVendor) {
          onPickVendor?.(cat.slug);
        } else {
          onAssign?.(cat.id);
        }
      }
    },
    [
      clearWindowListeners,
      disabled,
      transaction,
      shellMetrics,
      localPointCss,
      isOverAllSlice,
      onAssign,
      onPickVendor,
      onFlipAmount,
      onOpenAll,
    ]
  );

  const onPointerDown = (e) => {
    if (disabled || !transaction) return;
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* some browsers reject capture */
    }
    pointerIdRef.current = e.pointerId;
    dragMovedRef.current = false;
    dragActiveRef.current = true;
    const { x, y } = localPointCss(e.clientX, e.clientY);
    dragOriginRef.current = { x, y };
    setDrag({ active: true, x, y });
    setHoverIndex(-1);
    setHoverAll(false);

    // Window listeners — iOS often drops move events once the finger leaves the card.
    const pointerId = e.pointerId;
    const onMove = (ev) => {
      if (ev.pointerId !== pointerId || !dragActiveRef.current) return;
      ev.preventDefault();
      const pt = localPointCss(ev.clientX, ev.clientY);
      const { scale } = shellMetrics();
      const travelView =
        Math.hypot(pt.x - dragOriginRef.current.x, pt.y - dragOriginRef.current.y) / scale;
      if (travelView >= TAP_MOVE_MAX) dragMovedRef.current = true;
      setDrag({ active: true, x: pt.x, y: pt.y });
      updateHoverFromPoint(ev.clientX, ev.clientY, pt.x, pt.y);
    };
    const onUp = (ev) => {
      if (ev.pointerId !== pointerId) return;
      pointerIdRef.current = null;
      endDrag(ev.clientX, ev.clientY);
    };
    clearWindowListeners();
    listenersRef.current = { move: onMove, up: onUp };
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  useEffect(() => () => clearWindowListeners(), [clearWindowListeners]);

  if (!transaction) return null;

  const tilt = drag.active ? drag.x * 0.04 : 0;
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
        >
          <p className="finance2-wheel-merchant">{transaction.merchantName}</p>
          <p className="finance2-wheel-amount" aria-live="polite">
            {formatMoney(transaction.amount)}
          </p>
          <p className="finance2-wheel-flip-hint">double-tap +/−</p>
          <p className="finance2-wheel-date">{transaction.date}</p>
        </div>
      </div>

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
