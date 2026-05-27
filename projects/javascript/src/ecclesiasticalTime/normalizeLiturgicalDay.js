import { ECCLESIASTICAL_FALLBACK } from './constants';

const SEASON_LABELS = {
  advent: 'Advent',
  christmas: 'Christmas',
  lent: 'Lent',
  easter: 'Easter',
  ordinary: 'Ordinary Time',
};

const COLOR_LABELS = {
  green: 'Green',
  violet: 'Violet',
  white: 'White',
  red: 'Red',
};

function capitalizeWord(value) {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function formatColor(colour) {
  const key = colour.toLowerCase();
  return COLOR_LABELS[key] ?? capitalizeWord(colour);
}

/** Highest-rank celebration (lowest rank_num per Table of Liturgical Days). */
export function pickPrimaryCelebration(celebrations) {
  if (!celebrations?.length) return null;
  return [...celebrations].sort((a, b) => a.rank_num - b.rank_num)[0];
}

export function formatLiturgicalWeek(day) {
  const parts = [];
  if (day.weekday) {
    parts.push(capitalizeWord(day.weekday));
  }
  const seasonLabel = SEASON_LABELS[day.season] ?? capitalizeWord(day.season);
  if (day.season_week != null && day.season_week > 0 && seasonLabel) {
    parts.push(`Week ${day.season_week} of ${seasonLabel}`);
  }
  return parts.length ? parts.join(' · ') : undefined;
}

export function normalizeLiturgicalDay(day) {
  const primary = pickPrimaryCelebration(day.celebrations);
  const season = SEASON_LABELS[day.season] ?? ECCLESIASTICAL_FALLBACK.season;

  return {
    season,
    celebration: primary?.title?.trim() || ECCLESIASTICAL_FALLBACK.celebration,
    color: primary ? formatColor(primary.colour) : ECCLESIASTICAL_FALLBACK.color,
    rank: primary?.rank,
    week: formatLiturgicalWeek(day),
  };
}
