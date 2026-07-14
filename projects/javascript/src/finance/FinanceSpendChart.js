import React, { useMemo } from 'react';
import { formatMoney } from './financeConfig';

/**
 * Lightweight SVG line chart for monthly spend — no chart library.
 * Points: [{ month, label, total }]
 */
function FinanceSpendChart({ series = [], avgMonthlySpend = 0 }) {
  const { points, path, maxY, width, height, pad } = useMemo(() => {
    const w = 320;
    const h = 140;
    const p = { top: 16, right: 12, bottom: 28, left: 8 };
    const values = series.map((s) => Number(s.total) || 0);
    const max = Math.max(...values, Number(avgMonthlySpend) || 0, 1);
    const innerW = w - p.left - p.right;
    const innerH = h - p.top - p.bottom;
    const n = Math.max(series.length, 1);
    const pts = series.map((s, i) => {
      const x = p.left + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
      const y = p.top + innerH - ((Number(s.total) || 0) / max) * innerH;
      return { ...s, x, y };
    });
    const d =
      pts.length === 0
        ? ''
        : pts.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(' ');
    return { points: pts, path: d, maxY: max, width: w, height: h, pad: p };
  }, [series, avgMonthlySpend]);

  if (!series.length) {
    return <p className="finance-muted">Not enough data for a trend yet.</p>;
  }

  const avgY =
    pad.top +
    (height - pad.top - pad.bottom) -
    ((Number(avgMonthlySpend) || 0) / maxY) * (height - pad.top - pad.bottom);

  return (
    <div className="finance-spend-chart" role="img" aria-label="Monthly spending line chart">
      <svg viewBox={`0 0 ${width} ${height}`} className="finance-spend-chart-svg">
        {/* Average guide line */}
        {avgMonthlySpend > 0 && (
          <line
            className="finance-spend-chart-avg"
            x1={pad.left}
            y1={avgY}
            x2={width - pad.right}
            y2={avgY}
          />
        )}
        <path className="finance-spend-chart-line" d={path} fill="none" />
        {points.map((pt) => (
          <g key={pt.month}>
            <circle className="finance-spend-chart-dot" cx={pt.x} cy={pt.y} r={3.5} />
            <text className="finance-spend-chart-xlabel" x={pt.x} y={height - 8} textAnchor="middle">
              {pt.label}
            </text>
          </g>
        ))}
      </svg>
      <div className="finance-spend-chart-legend">
        <span>Avg {formatMoney(avgMonthlySpend)} / mo</span>
        {points.length > 0 && (
          <span>
            Peak {formatMoney(Math.max(...points.map((p) => p.total)))}
          </span>
        )}
      </div>
    </div>
  );
}

export default FinanceSpendChart;
