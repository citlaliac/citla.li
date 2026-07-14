import React, { useMemo } from 'react';
import { formatMoney } from './financeConfig';

/**
 * Map series points into SVG coordinates for a line chart.
 * Pace mode positions by calendar day so this vs prior month share the x-axis.
 */
function layoutSeries(series, valueKey, maxY, width, height, pad, { byDay = false, axisDays = 1 } = {}) {
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const n = Math.max(byDay ? axisDays : series.length, 1);
  return series.map((s, i) => {
    const slot = byDay ? Math.max((Number(s.day) || 1) - 1, 0) : i;
    const x = pad.left + (n === 1 ? innerW / 2 : (slot / (n - 1)) * innerW);
    const value = Number(s[valueKey]) || 0;
    const y = pad.top + innerH - (value / maxY) * innerH;
    return { ...s, x, y, value };
  });
}

function pathFromPoints(pts) {
  if (!pts.length) return '';
  return pts
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(' ');
}

/**
 * Lightweight SVG spend chart — monthly totals, or month-to-date cumulative vs prior month.
 *
 * @param {'monthly'|'pace'} mode
 * @param {Array} series - monthly: { month, label, total }; pace: { day, label, cumulative }
 * @param {Array} [compareSeries] - prior month cumulative (pace mode)
 * @param {number} [avgMonthlySpend] - avg guide (monthly mode)
 * @param {object} [pace] - { throughDay, thisMonthTotal, priorMonthTotal, priorMonthLabel, delta, pctVsPrior }
 */
function FinanceSpendChart({
  mode = 'monthly',
  series = [],
  compareSeries = [],
  avgMonthlySpend = 0,
  pace = null,
}) {
  const valueKey = mode === 'pace' ? 'cumulative' : 'total';
  const { points, comparePoints, path, comparePath, maxY, width, height, pad } = useMemo(() => {
    const w = 320;
    const h = 140;
    const p = { top: 16, right: 12, bottom: 28, left: 8 };
    const primaryVals = series.map((s) => Number(s[valueKey]) || 0);
    const compareVals = compareSeries.map((s) => Number(s[valueKey]) || 0);
    const max = Math.max(
      ...primaryVals,
      ...compareVals,
      mode === 'monthly' ? Number(avgMonthlySpend) || 0 : 0,
      1
    );
    const axisDays = Math.max(
      ...series.map((s) => Number(s.day) || 0),
      ...compareSeries.map((s) => Number(s.day) || 0),
      series.length,
      1
    );
    const layoutOpts = mode === 'pace' ? { byDay: true, axisDays } : {};
    const pts = layoutSeries(series, valueKey, max, w, h, p, layoutOpts);
    const cPts = layoutSeries(compareSeries, valueKey, max, w, h, p, layoutOpts);
    return {
      points: pts,
      comparePoints: cPts,
      path: pathFromPoints(pts),
      comparePath: pathFromPoints(cPts),
      maxY: max,
      width: w,
      height: h,
      pad: p,
    };
  }, [series, compareSeries, avgMonthlySpend, mode, valueKey]);

  if (!series.length) {
    return <p className="finance-muted">Not enough data for a trend yet.</p>;
  }

  const avgY =
    pad.top +
    (height - pad.top - pad.bottom) -
    ((Number(avgMonthlySpend) || 0) / maxY) * (height - pad.top - pad.bottom);

  // Sparse day labels so a 31-day axis stays readable on phones.
  const showLabel = (i, len) => {
    if (mode !== 'pace') return true;
    if (len <= 10) return true;
    return i === 0 || i === len - 1 || (i + 1) % 5 === 0;
  };

  const paceNote = (() => {
    if (mode !== 'pace' || !pace) return null;
    const through = pace.throughDay != null ? `through day ${pace.throughDay}` : '';
    if (pace.pctVsPrior == null) {
      return `${formatMoney(pace.thisMonthTotal)} ${through}`.trim();
    }
    const sign = pace.pctVsPrior > 0 ? '+' : '';
    const vs =
      pace.pctVsPrior === 0
        ? 'even with'
        : `${sign}${pace.pctVsPrior}% vs`;
    return `${formatMoney(pace.thisMonthTotal)} ${through} · ${vs} ${pace.priorMonthLabel || 'prior month'}`;
  })();

  return (
    <div
      className="finance-spend-chart"
      role="img"
      aria-label={
        mode === 'pace'
          ? 'Cumulative spending this month versus prior month'
          : 'Monthly spending line chart'
      }
    >
      <svg viewBox={`0 0 ${width} ${height}`} className="finance-spend-chart-svg">
        {mode === 'monthly' && avgMonthlySpend > 0 && (
          <line
            className="finance-spend-chart-avg"
            x1={pad.left}
            y1={avgY}
            x2={width - pad.right}
            y2={avgY}
          />
        )}
        {comparePath && (
          <path className="finance-spend-chart-line finance-spend-chart-line--compare" d={comparePath} fill="none" />
        )}
        <path className="finance-spend-chart-line" d={path} fill="none" />
        {points.map((pt, i) => (
          <g key={pt.month || pt.day || i}>
            <circle className="finance-spend-chart-dot" cx={pt.x} cy={pt.y} r={mode === 'pace' ? 2.25 : 3.5} />
            {showLabel(i, points.length) && (
              <text className="finance-spend-chart-xlabel" x={pt.x} y={height - 8} textAnchor="middle">
                {pt.label}
              </text>
            )}
          </g>
        ))}
      </svg>
      <div className="finance-spend-chart-legend">
        {mode === 'pace' ? (
          <>
            <span className="finance-spend-chart-swatch finance-spend-chart-swatch--this">This month</span>
            {compareSeries.length > 0 && (
              <span className="finance-spend-chart-swatch finance-spend-chart-swatch--prior">
                {pace?.priorMonthLabel || 'Prior month'}
              </span>
            )}
          </>
        ) : (
          <>
            <span>Avg {formatMoney(avgMonthlySpend)} / mo</span>
            {points.length > 0 && (
              <span>Peak {formatMoney(Math.max(...points.map((p) => p.value)))}</span>
            )}
          </>
        )}
      </div>
      {paceNote && <p className="finance-spend-chart-pace-note">{paceNote}</p>}
    </div>
  );
}

export default FinanceSpendChart;
