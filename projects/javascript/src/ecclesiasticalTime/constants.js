export const LITURGICAL_TODAY_PATH = '/api/liturgical/today';

/** Refresh liturgical data once per hour */
export const ECCLESIASTICAL_REFRESH_MS = 60 * 60 * 1000;

export const ECCLESIASTICAL_FALLBACK = {
  season: 'Ordinary Time',
  celebration: '—',
  color: 'Green',
  themeId: 'ordinary',
};
