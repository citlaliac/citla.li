/**
 * Catholic e Cloud liturgical ambience — maps General Roman Calendar data to visual themes.
 */

export const CEC_SEASON_THEME_IDS = [
  'advent',
  'christmas',
  'epiphany',
  'ordinary',
  'lent',
  'holyWeek',
  'easter',
  'pentecost',
];

const PUB = process.env.PUBLIC_URL || '';
const SEASON_ASSETS = `${PUB}/assets/catholicecloud/season`;

/** @typedef {'cathedral'|'heaven'|'forest'|'easterCathedral'|'christmasCathedral'|'clouds'} CecBackgroundPhotoId */

/** @typedef {'wreath'|'angel'|'camel'|'fish'|'palm'|'lamb'|'fire'} CecFloaterKind */

/**
 * @typedef {Object} CecFloaterSpec
 * @property {CecFloaterKind} kind
 * @property {string} [asset] — filename under season/
 * @property {number} opacity
 * @property {number} sizeRem
 * @property {'drift'|'walk'|'fan'} [motion]
 */

/**
 * @typedef {Object} CecSeasonTheme
 * @property {string} id
 * @property {string} label
 * @property {string} overlay — CSS color for tint layer
 * @property {number} overlayOpacity
 * @property {string} starPalette
 * @property {CecFloaterSpec[]} [floaters]
 * @property {number} floaterMinMs
 * @property {number} floaterMaxMs
 * @property {string[]} [hollyMapIds]
 * @property {CecBackgroundPhotoId[]} [backgroundPhotos]
 */

export const CEC_DEFAULT_BACKGROUND_PHOTOS = ['cathedral', 'heaven', 'forest'];

export const CEC_SEASON_THEMES = {
  advent: {
    id: 'advent',
    label: 'Advent',
    backgroundPhotos: ['cathedral'],
    overlay: 'rgba(72, 28, 110, 0.55)',
    overlayOpacity: 0.52,
    starPalette: 'deepBlue',
    floaters: [{ kind: 'wreath', asset: 'wreath.png', opacity: 0.58, sizeRem: 6.2, motion: 'drift' }],
    floaterMinMs: 10_000,
    floaterMaxMs: 20_000,
  },
  christmas: {
    id: 'christmas',
    label: 'Christmas Season',
    backgroundPhotos: ['christmasCathedral'],
    overlay: 'rgba(255, 248, 230, 0.55)',
    overlayOpacity: 0.42,
    starPalette: 'gold',
    floaters: [{ kind: 'angel', asset: 'angel.png', opacity: 0.56, sizeRem: 6.8, motion: 'drift' }],
    floaterMinMs: 10_000,
    floaterMaxMs: 20_000,
    hollyMapIds: ['vatican', 'candle'],
  },
  epiphany: {
    id: 'epiphany',
    label: 'Epiphany',
    backgroundPhotos: ['forest'],
    overlay: 'rgba(120, 82, 48, 0.48)',
    overlayOpacity: 0.44,
    starPalette: 'white',
    floaters: [{ kind: 'camel', asset: 'camel.png', opacity: 0.9, sizeRem: 8.5, motion: 'walk' }],
    floaterMinMs: 10_000,
    floaterMaxMs: 30_000,
  },
  ordinary: {
    id: 'ordinary',
    label: 'Ordinary Time',
    backgroundPhotos: ['cathedral', 'heaven', 'forest'],
    overlay: 'transparent',
    overlayOpacity: 0,
    starPalette: 'green',
    floaterMinMs: 0,
    floaterMaxMs: 0,
  },
  lent: {
    id: 'lent',
    label: 'Lent',
    backgroundPhotos: [],
    overlay: 'rgba(72, 76, 82, 0.52)',
    overlayOpacity: 0.5,
    starPalette: 'silver',
    floaters: [{ kind: 'fish', asset: 'fish.png', opacity: 0.54, sizeRem: 5.5, motion: 'drift' }],
    floaterMinMs: 10_000,
    floaterMaxMs: 20_000,
  },
  holyWeek: {
    id: 'holyWeek',
    label: 'Holy Week',
    backgroundPhotos: ['cathedral'],
    overlay: 'rgba(88, 48, 110, 0.5)',
    overlayOpacity: 0.46,
    starPalette: 'darkRed',
    floaters: [{ kind: 'palm', asset: 'palm.png', opacity: 0.58, sizeRem: 6.3, motion: 'fan' }],
    floaterMinMs: 10_000,
    floaterMaxMs: 20_000,
  },
  easter: {
    id: 'easter',
    label: 'Easter Season',
    backgroundPhotos: ['easterCathedral'],
    overlay: 'rgba(255, 252, 255, 0.58)',
    overlayOpacity: 0.44,
    starPalette: 'white',
    floaters: [{ kind: 'lamb', asset: 'lamb.png', opacity: 0.62, sizeRem: 6.2, motion: 'walk' }],
    floaterMinMs: 10_000,
    floaterMaxMs: 20_000,
  },
  pentecost: {
    id: 'pentecost',
    label: 'Pentecost',
    overlay: 'rgba(140, 18, 28, 0.52)',
    overlayOpacity: 0.5,
    starPalette: 'redGold',
    floaters: [{ kind: 'fire', asset: 'fire.png', opacity: 0.62, sizeRem: 5.8, motion: 'fan' }],
    floaterMinMs: 10_000,
    floaterMaxMs: 20_000,
  },
};

export const CEC_STAR_PALETTES = {
  deepBlue: {
    stops: [
      ['0%', 'rgba(120, 180, 255, 0)'],
      ['35%', 'rgba(80, 140, 220, 0.38)'],
      ['70%', 'rgba(60, 120, 210, 0.92)'],
      ['100%', 'rgba(200, 230, 255, 1)'],
    ],
    coreShadow:
      'drop-shadow(0 0 10px rgba(100, 160, 255, 1)) drop-shadow(0 0 20px rgba(60, 120, 210, 0.75)) drop-shadow(0 0 28px rgba(40, 80, 180, 0.4))',
    nameColor: '#c8e6ff',
    nameShadow: '0 0 10px rgba(100, 160, 255, 0.9), 0 0 18px rgba(60, 120, 210, 0.45)',
  },
  gold: {
    stops: [
      ['0%', 'rgba(255, 220, 120, 0)'],
      ['35%', 'rgba(255, 200, 80, 0.32)'],
      ['70%', 'rgba(255, 215, 100, 0.9)'],
      ['100%', 'rgba(255, 248, 220, 1)'],
    ],
    coreShadow:
      'drop-shadow(0 0 10px rgba(255, 220, 120, 1)) drop-shadow(0 0 20px rgba(255, 200, 80, 0.8)) drop-shadow(0 0 28px rgba(212, 175, 55, 0.5))',
    nameColor: '#fff8dc',
    nameShadow: '0 0 10px rgba(255, 220, 120, 0.95), 0 0 16px rgba(212, 175, 55, 0.55)',
  },
  white: {
    stops: [
      ['0%', 'rgba(255, 255, 255, 0)'],
      ['35%', 'rgba(255, 255, 255, 0.28)'],
      ['70%', 'rgba(255, 255, 255, 0.88)'],
      ['100%', 'rgba(255, 255, 255, 1)'],
    ],
    coreShadow:
      'drop-shadow(0 0 10px rgba(255, 255, 255, 1)) drop-shadow(0 0 20px rgba(240, 240, 255, 0.75)) drop-shadow(0 0 28px rgba(200, 210, 255, 0.45))',
    nameColor: '#ffffff',
    nameShadow: '0 0 10px rgba(255, 255, 255, 0.95), 0 0 16px rgba(230, 230, 255, 0.45)',
  },
  green: {
    stops: [
      ['0%', 'rgba(120, 220, 140, 0)'],
      ['35%', 'rgba(80, 180, 100, 0.32)'],
      ['70%', 'rgba(100, 210, 120, 0.9)'],
      ['100%', 'rgba(200, 255, 210, 1)'],
    ],
    coreShadow:
      'drop-shadow(0 0 10px rgba(140, 230, 160, 1)) drop-shadow(0 0 20px rgba(80, 200, 110, 0.7)) drop-shadow(0 0 28px rgba(40, 120, 60, 0.4))',
    nameColor: '#c8ffd2',
    nameShadow: '0 0 10px rgba(140, 230, 160, 0.9), 0 0 16px rgba(40, 120, 60, 0.4)',
  },
  silver: {
    stops: [
      ['0%', 'rgba(200, 205, 215, 0)'],
      ['35%', 'rgba(180, 185, 195, 0.34)'],
      ['70%', 'rgba(210, 215, 225, 0.9)'],
      ['100%', 'rgba(240, 242, 248, 1)'],
    ],
    coreShadow:
      'drop-shadow(0 0 10px rgba(240, 245, 255, 1)) drop-shadow(0 0 20px rgba(200, 210, 225, 0.75)) drop-shadow(0 0 28px rgba(140, 145, 160, 0.45))',
    nameColor: '#f0f2f8',
    nameShadow: '0 0 10px rgba(220, 225, 235, 0.9), 0 0 16px rgba(140, 145, 160, 0.45)',
  },
  darkRed: {
    stops: [
      ['0%', 'rgba(255, 120, 140, 0)'],
      ['28%', 'rgba(255, 70, 95, 0.45)'],
      ['62%', 'rgba(255, 45, 75, 0.92)'],
      ['100%', 'rgba(255, 200, 210, 1)'],
    ],
    coreShadow:
      'drop-shadow(0 0 10px rgba(255, 80, 110, 1)) drop-shadow(0 0 20px rgba(255, 40, 70, 0.75)) drop-shadow(0 0 32px rgba(180, 20, 50, 0.45))',
    nameColor: '#ff6880',
    nameShadow: '0 0 10px rgba(255, 80, 100, 0.9), 0 0 16px rgba(140, 24, 36, 0.55)',
  },
  redGold: {
    stops: [
      ['0%', 'rgba(200, 40, 40, 0)'],
      ['40%', 'rgba(220, 80, 40, 0.5)'],
      ['75%', 'rgba(255, 200, 80, 0.92)'],
      ['100%', 'rgba(255, 230, 160, 1)'],
    ],
    coreShadow:
      'drop-shadow(0 0 10px rgba(255, 140, 60, 1)) drop-shadow(0 0 20px rgba(255, 100, 50, 0.75)) drop-shadow(0 0 28px rgba(212, 175, 55, 0.5))',
    nameColor: '#ffe6a0',
    nameShadow: '0 0 10px rgba(255, 180, 80, 0.9), 0 0 16px rgba(220, 80, 40, 0.5)',
  },
};

/** Worshiper display name — matches shooting-star palette for the active season. */
export function getSeasonStarNameStyle(starPalette) {
  const palette = CEC_STAR_PALETTES[starPalette] ?? CEC_STAR_PALETTES.gold;
  return {
    color: palette.nameColor,
    textShadow: palette.nameShadow,
  };
}

const HOLY_WEEK_KEYWORDS = [
  'palm sunday',
  'passion sunday',
  'holy monday',
  'holy tuesday',
  'spy wednesday',
  'holy wednesday',
  'holy thursday',
  'maundy thursday',
  'good friday',
  'holy saturday',
  'easter vigil',
];

const PENTECOST_KEYWORDS = ['pentecost', 'whitsun'];

function celebrationTexts(day) {
  const titles = (day?.celebrations ?? [])
    .map((c) => (c?.title ?? '').toLowerCase())
    .filter(Boolean);
  return titles.join(' | ');
}

function matchesAny(haystack, needles) {
  return needles.some((n) => haystack.includes(n));
}

function parseLiturgicalDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return null;
  return { year: y, month: m, day: d };
}

/** Epiphany time after 6 Jan until Baptism of the Lord (approx. through mid-Jan). */
function isEpiphanyPeriod(dateStr, celebrationHaystack) {
  if (matchesAny(celebrationHaystack, ['epiphany', 'baptism of the lord'])) return true;
  const parsed = parseLiturgicalDate(dateStr);
  if (!parsed) return false;
  if (parsed.month === 1 && parsed.day >= 7 && parsed.day <= 20) return true;
  return false;
}

/**
 * Resolve CEC visual theme from a liturgical calendar day payload.
 * @param {{ season?: string, date?: string, celebrations?: { title?: string }[] }} [day]
 * @returns {keyof typeof CEC_SEASON_THEMES}
 */
export function resolveCecSeasonTheme(day) {
  if (!day?.season) return 'ordinary';

  const season = day.season.toLowerCase();
  const haystack = celebrationTexts(day);

  if (matchesAny(haystack, PENTECOST_KEYWORDS)) return 'pentecost';

  if (season === 'lent') {
    if (matchesAny(haystack, HOLY_WEEK_KEYWORDS)) return 'holyWeek';
    return 'lent';
  }

  if (season === 'easter') {
    return 'easter';
  }

  if (season === 'christmas') {
    if (isEpiphanyPeriod(day.date, haystack)) return 'epiphany';
    return 'christmas';
  }

  if (season === 'advent') return 'advent';

  return 'ordinary';
}

export function getCecSeasonTheme(themeId) {
  return CEC_SEASON_THEMES[themeId] ?? CEC_SEASON_THEMES.ordinary;
}

export function getSeasonBackgroundPhotos(themeId) {
  const theme = getCecSeasonTheme(themeId);
  if (theme.backgroundPhotos !== undefined) {
    return theme.backgroundPhotos;
  }
  return CEC_DEFAULT_BACKGROUND_PHOTOS;
}

/** Primary photo + heaven-bkg layered on top (opacity set per season in CSS). */
export const CEC_HEAVEN_PHOTO_OVERLAY_SEASONS = [
  'advent',
  'christmas',
  'epiphany',
  'holyWeek',
  'easter',
];

/**
 * Sky wash layered above the season photo stack.
 * @returns {'heaven'|'clouds'|null}
 */
export function getSeasonSkyOverlay(themeId) {
  const photos = getSeasonBackgroundPhotos(themeId);
  if (photos.includes('heaven')) return null;
  if (CEC_HEAVEN_PHOTO_OVERLAY_SEASONS.includes(themeId)) return 'heaven';
  if (photos.length === 0) return 'heaven';
  return 'clouds';
}

/** True when a sky image is blended on top (Ordinary/Pentecost include heaven in the collage). */
export function seasonUsesHeavenOverlay(themeId) {
  return getSeasonSkyOverlay(themeId) !== null;
}

export function seasonAssetUrl(filename) {
  if (!filename) return null;
  return `${SEASON_ASSETS}/${encodeURIComponent(filename)}`;
}

const QUERY_THEME_KEY = 'cecSeason';

/** Season preview UI — only on this path (not linked from the public map). */
export const CEC_SEASON_TEST_PATH = '/catholicecloudtest';

/** Read ?cecSeason=advent override from the URL. */
export function readSeasonThemeOverride() {
  if (typeof window === 'undefined') return null;
  const raw = new URLSearchParams(window.location.search).get(QUERY_THEME_KEY);
  if (!raw) return null;
  const id = raw.trim();
  return CEC_SEASON_THEME_IDS.includes(id) ? id : null;
}

export function isSeasonDebugEnabled() {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  return path === CEC_SEASON_TEST_PATH;
}

export function buildSeasonTestUrl(themeId) {
  return `${CEC_SEASON_TEST_PATH}?${QUERY_THEME_KEY}=${encodeURIComponent(themeId)}`;
}
