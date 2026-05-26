/** Catholic e Cloud — ranks, locations, paths, saints, PP rules */

export const RANKS = [
  { id: 'cantor', label: 'Cantor', minPP: 0 },
  { id: 'seminarian', label: 'Seminarian', minPP: 90 },
  { id: 'deacon', label: 'Deacon', minPP: 220 },
  { id: 'priest', label: 'Priest', minPP: 500 },
];

export const ACTIVITY_REWARDS = {
  register: { pp: 5, maxPerSession: 1 },
  incense: { pp: 6, maxPerSession: 1 },
  fish_fry: { pp: 14, maxPerSession: 1 },
  rosary: { pp: 22, maxPerSession: 1 },
  vatican: { pp: 18, maxPerSession: 1 },
  aspergillum: { pp: 8, maxPerSession: 1 },
  st_jude: { pp: 12, maxPerSession: 1 },
  candle: { pp: 10, maxPerSession: 1 },
  bulletin_post: { pp: 15, maxPerSession: 2 },
};

/** amen_${locationId} — discovery bonus per building */
export const AMEN_DISCOVERY_PP = 4;

/** Decorative path edges only (not visit order) */
export const CEC_PATH_EDGES = [
  ['incense', 'fish_fry'],
  ['fish_fry', 'rosary'],
  ['rosary', 'vatican'],
  ['vatican', 'aspergillum'],
  ['aspergillum', 'st_jude'],
  ['st_jude', 'candle'],
  ['candle', 'bulletin'],
  ['vatican', 'wheel'],
  ['rosary', 'bulletin'],
  ['incense', 'vatican'],
];

export const CEC_LOCATIONS = [
  {
    id: 'incense',
    label: 'Thurible & Co.',
    buildingFile: 'insence.webp',
    fallbackEmoji: '💨',
    top: '14%',
    left: '12%',
    actionId: 'incense',
    fact: 'The thurible swings. Frankincense levels: critically aesthetic.',
    actionType: 'amen',
  },
  {
    id: 'fish_fry',
    label: 'Friday Fish Fry',
    buildingFile: 'lent-fish-fry.png',
    fallbackEmoji: '🐟',
    top: '72%',
    left: '18%',
    actionId: 'fish_fry',
    fact: 'Tartar sauce is not canonical but is respected.',
    actionType: 'partake',
  },
  {
    id: 'rosary',
    label: 'Rosary Chapel',
    buildingFile: 'rosary.webp',
    fallbackEmoji: '📿',
    top: '58%',
    left: '8%',
    actionId: 'rosary',
    fact: 'Ten Hail Marys for your Pontifex Points.',
    actionType: 'rosary',
  },
  {
    id: 'vatican',
    label: 'Basilica',
    buildingFile: 'vatican.png',
    fallbackEmoji: '🏛️',
    top: '20%',
    left: '48%',
    actionId: 'vatican',
    fact: 'Yur visit has topped up your ecclesiastical health!',
    actionType: 'communion',
  },
  {
    id: 'aspergillum',
    label: 'Holy Water Font',
    buildingFile: 'aspergillum.png',
    fallbackEmoji: '💧',
    top: '10%',
    left: '82%',
    actionId: 'aspergillum',
    fact: "Sprinkle sprinkle! You're all wet with holy water!",
    actionType: 'amen',
  },
  {
    id: 'st_jude',
    label: 'St. Jude Shrine',
    buildingFile: 'st-jude-arm-bone.png',
    fallbackEmoji: '🦴',
    top: '46%',
    left: '86%',
    actionId: 'st_jude',
    fact: 'Patron of hopeless causes — including this tooltip.',
    actionType: 'amen',
  },
  {
    id: 'candle',
    label: 'Vigil Candle Stand',
    buildingFile: 'vigil-candle.png',
    fallbackEmoji: '🕯️',
    top: '82%',
    left: '52%',
    actionId: 'candle',
    fact: 'This flame is purely decorative until the wax DLC drops.',
    actionType: 'candle',
  },
  {
    id: 'bulletin',
    label: 'Parish Bulletin',
    buildingFile: null,
    fallbackEmoji: '📋',
    top: '38%',
    left: '28%',
    actionId: null,
    fact: 'Leave a note for the cloud. Names reset when you close this tab.',
    actionType: 'bulletin',
  },
  {
    id: 'wheel',
    label: 'Wheel of Saints',
    buildingFile: null,
    fallbackEmoji: '☸️',
    top: '28%',
    left: '68%',
    actionId: null,
    fact: 'One spin per worshiper per day. The saints are generous (usually).',
    actionType: 'wheel',
  },
];

/** Drop PNG/WebP in public/assets/catholicecloud/worshipers/ — filename = imageFile */
export const WORSHIPER_AVATARS = [
  { id: 'cantor_a', label: 'Cantor I', emoji: '🎵', imageFile: 'cantor_a.png' },
  { id: 'cantor_b', label: 'Cantor II', emoji: '🎶', imageFile: 'cantor_b.png' },
  { id: 'cantor_c', label: 'Cantor III', emoji: '🎼', imageFile: 'cantor_c.png' },
];

export const DEFAULT_AVATAR_ID = WORSHIPER_AVATARS[0].id;

export const WHEEL_SAINTS = [
  {
    id: 'francis',
    label: 'St. Francis of Assisi',
    shortLabel: 'Francis',
    weight: 10,
    ppMin: 8,
    ppMax: 15,
    imageFile: 'assisi.png',
    blurb: 'Patron of animals, nature, and poverty. Birds and simple living.',
  },
  {
    id: 'anthony',
    label: 'St. Anthony of Padua',
    shortLabel: 'Anthony',
    weight: 10,
    ppMin: 10,
    ppMax: 15,
    imageFile: 'padua.png',
    blurb: 'Known for helping find lost things.',
  },
  {
    id: 'joan',
    label: 'St. Joan of Arc',
    shortLabel: 'Joan',
    weight: 10,
    ppMin: 18,
    ppMax: 26,
    imageFile: 'joan.png',
    blurb: 'French warrior saint with visions and armor.',
  },
  {
    id: 'peter',
    label: 'St. Peter',
    shortLabel: 'Peter',
    weight: 10,
    ppMin: 14,
    ppMax: 20,
    imageFile: 'saints/peter.png',
    blurb: 'Apostle with the keys of heaven and the first pope.',
  },
  {
    id: 'therese',
    label: 'St. Thérèse of Lisieux',
    shortLabel: 'Thérèse',
    weight: 10,
    ppMin: 8,
    ppMax: 14,
    imageFile: 'Saint Therese of Lisieux.png',
    blurb: 'The Little Flower. Roses and small acts of holiness.',
  },
  {
    id: 'drogo',
    label: 'St. Drogo',
    shortLabel: 'Drogo',
    weight: 10,
    ppMin: 12,
    ppMax: 18,
    imageFile: 'drogo.png',
    blurb: 'Patron of unattractive people and coffeehouse owners, somehow.',
  },
  {
    id: 'bibiana',
    label: 'St. Bibiana',
    shortLabel: 'Bibiana',
    weight: 10,
    ppMin: 10,
    ppMax: 16,
    imageFile: 'bibiana.png',
    blurb: 'Patron saint of hangovers.',
  },
  {
    id: 'genesius',
    label: 'St. Genesius',
    shortLabel: 'Genesius',
    weight: 10,
    ppMin: 14,
    ppMax: 22,
    imageFile: 'Genesius.png',
    blurb: 'Patron of actors and comedians — converted mid-performance.',
  },
  {
    id: 'vitus',
    label: 'St. Vitus',
    shortLabel: 'Vitus',
    weight: 10,
    ppMin: 16,
    ppMax: 24,
    imageFile: 'vitus.png',
    blurb: 'Saint Vitus Dance sounds like a medieval indie band.',
  },
  {
    id: 'fiacre',
    label: 'St. Fiacre',
    shortLabel: 'Fiacre',
    weight: 10,
    ppMin: 12,
    ppMax: 20,
    imageFile: 'Fiacre.png',
    blurb: 'Patron of gardeners, cab drivers, and hemorrhoid sufferers.',
  },
];

export const WHEEL_SAINTS_BY_ID = Object.fromEntries(WHEEL_SAINTS.map((s) => [s.id, s]));

export const WORSHIPER_AVATARS_BY_ID = Object.fromEntries(
  WORSHIPER_AVATARS.map((a) => [a.id, a])
);

export function avatarById(id) {
  return WORSHIPER_AVATARS_BY_ID[id] || WORSHIPER_AVATARS[0];
}

export function rankFromPoints(pp) {
  let current = RANKS[0];
  for (const r of RANKS) {
    if (pp >= r.minPP) current = r;
  }
  return current;
}

export function nextRank(pp) {
  const current = rankFromPoints(pp);
  const idx = RANKS.findIndex((r) => r.id === current.id);
  return idx < RANKS.length - 1 ? RANKS[idx + 1] : null;
}

export function canCompleteAction(worshiper, actionId) {
  const rule = ACTIVITY_REWARDS[actionId];
  if (!rule) return false;
  const count = worshiper.completedActions.filter((a) => a === actionId).length;
  return count < rule.maxPerSession;
}

export function amenDiscoveryKey(locationId) {
  return `amen_${locationId}`;
}

export function hasAmenDiscovery(worshiper, locationId) {
  return worshiper.completedActions.includes(amenDiscoveryKey(locationId));
}

export function locationById(id) {
  return CEC_LOCATIONS.find((l) => l.id === id);
}

export function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}
