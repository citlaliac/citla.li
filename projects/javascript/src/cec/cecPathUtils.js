import { CEC_LOCATIONS, CEC_PATH_EDGES } from './cecConfig';

function pctCoord(pctStr) {
  return parseFloat(String(pctStr).replace('%', ''), 10);
}

export function locationCenter(loc) {
  return { x: pctCoord(loc.left), y: pctCoord(loc.top) };
}

const LOC_BY_ID = Object.fromEntries(CEC_LOCATIONS.map((l) => [l.id, l]));

/** Jagged segment between two points in 0–100 viewBox space */
export function buildWobblySegment(a, b, segIndex = 0) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const px = -dy / len;
  const py = dx / len;
  const segs = 5;
  let d = `M ${a.x.toFixed(2)} ${a.y.toFixed(2)}`;
  for (let s = 1; s <= segs; s++) {
    const t = s / segs;
    let x = a.x + dx * t;
    let y = a.y + dy * t;
    const wobble =
      Math.sin(segIndex * 2.1 + s * 0.85) * 2.2 +
      ((s + segIndex) % 3 === 0 ? 1.4 : -0.9);
    x += px * wobble;
    y += py * wobble;
    d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return d;
}

export function buildDecorativePaths() {
  return CEC_PATH_EDGES.map(([fromId, toId], i) => {
    const from = LOC_BY_ID[fromId];
    const to = LOC_BY_ID[toId];
    if (!from || !to) return '';
    return buildWobblySegment(locationCenter(from), locationCenter(to), i);
  }).filter(Boolean);
}
