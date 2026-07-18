/** Catholic e Cloud — ranks, locations, paths, saints, PP rules */

export const RANKS = [
  { id: 'cantor', label: 'Cantor', minPP: 0 },
  { id: 'seminarian', label: 'Seminarian', minPP: 120 },
  { id: 'deacon', label: 'Deacon', minPP: 620 },
  { id: 'priest', label: 'Priest', minPP: 1150 },
  { id: 'pope', label: 'Pope', minPP: 3000 },
];

export const POPE_RANK = RANKS.find((r) => r.id === 'pope');
export const PRIEST_RANK = RANKS.find((r) => r.id === 'priest');

/** Months without login or synced play before a Pope loses the throne. */
export const POPE_INACTIVITY_MONTHS = 3;

export const SEDE_VACANTE_LABEL = 'Sede Vacante';

/** Short hover bullets for the Supreme Pope rank. */
export function papacyRulesBullets() {
  const pp = POPE_RANK.minPP;
  const months = POPE_INACTIVITY_MONTHS;
  return [
    'One Supreme Pope among active congregation founders',
    `Founders need ${pp}+ PP to remain eligible`,
    'The eligible founder with most PP holds the throne',
    `No login or play for ${months} months — lose the Papacy`,
    `Throne empty? ${SEDE_VACANTE_LABEL}`,
  ];
}

/** Map actions (and Amens) reset after this cooldown. */
export const MAP_ACTION_COOLDOWN_MS = 60 * 60 * 1000;

/** Shared Pope portrait — public/assets/catholicecloud/worshipers/pope.png */
export const POPE_PORTRAIT = {
  id: 'pope',
  rankId: 'pope',
  label: 'Pope',
  emoji: '👑',
  imageFile: 'pope.png',
};

/** Rank-up toast copy — includes worshiper display name. */
export function rankPromotionMessage(rankId, displayName) {
  const name = (displayName || 'Worshiper').trim() || 'Worshiper';
  switch (rankId) {
    case 'seminarian':
      return `${name}, you've been admitted to seminary.`;
    case 'deacon':
      return `${name}, you've been ordained to the Diaconate.`;
    case 'priest':
      return `${name}, you've been ordained to the Priesthood.`;
    case 'pope':
      return `${name}, you have been elevated to the Papacy.`;
    default:
      return null;
  }
}

export function popeDemotionMessage(displayName, reigningPopeName, pointsNeeded) {
  const name = (displayName || 'Worshiper').trim() || 'Worshiper';
  const pope = (reigningPopeName || 'another worshiper').trim() || 'another worshiper';
  const need = Math.max(1, pointsNeeded);
  return `${name}, you have lost the Papacy. ${pope} now reigns. Earn ${need} more Pontifex Points to reclaim it.`;
}

/** PP needed to overtake the reigning pope (must exceed their total). */
export function ppToOvertakePope(myPP, reigningPopePP) {
  const theirs = Math.max(0, reigningPopePP ?? 0);
  return Math.max(1, theirs - myPP + 1);
}

/** Tuned so one map pass reaches Seminarian only; Deacon+ need hourly returns. */
export const ACTIVITY_REWARDS = {
  register: { pp: 28, maxPerSession: 1 },
  incense: { pp: 32, maxPerSession: 1 },
  fish_fry: { pp: 36, maxPerSession: 1 },
  rosary: { pp: 48, maxPerSession: 1 },
  vatican: { pp: 42, maxPerSession: 1 },
  aspergillum: { pp: 30, maxPerSession: 1 },
  st_jude: { pp: 34, maxPerSession: 1 },
  candle: { pp: 32, maxPerSession: 1 },
  bulletin_post: { pp: 46, maxPerSession: 2 },
};

/** amen_${locationId} — Amen discovery PP per map building; resets hourly (not bulletin/wheel). */
export const AMEN_DISCOVERY_PP = 31;

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
    label: 'Light incense',
    buildingFile: 'insence-before.png',
    visitedBuildingFile: 'insence_gif.gif',
    fallbackEmoji: '💨',
    top: '5.1%',
    left: '2.6%',
    actionId: 'incense',
    fact: 'Burn some incense and say a prayer.',
    actionLabel: 'Burn incense',
    actionType: 'amen',
  },
  {
    id: 'fish_fry',
    label: 'Friday Fish Fry',
    buildingFile: 'lent-fish-fry.png',
    visitedBuildingFile: 'fish-eaten.png',
    fallbackEmoji: '🐟',
    top: '65.4%',
    left: '3.9%',
    actionId: 'fish_fry',
    fact: 'Eat the fish for Lent, to gain a health (PP) boost.',
    actionLabel: 'Eat the fish',
    actionType: 'partake',
  },
  {
    id: 'rosary',
    label: 'Rosary Chapel',
    buildingFile: 'rosary.webp',
    visitedGlow: true,
    fallbackEmoji: '📿',
    top: '89.8%',
    left: '19.0%',
    actionId: 'rosary',
    fact: 'Pray ten decades of the rosary to atone for your sins.',
    actionType: 'rosary',
  },
  {
    id: 'vatican',
    label: 'Basilica',
    buildingFile: 'vatican.png',
    visitedBuildingFile: 'basillica-on.png',
    fallbackEmoji: '🏛️',
    top: '10.0%',
    left: '47.7%',
    actionId: 'vatican',
    fact: 'Your visit has topped up your ecclesiastical health!',
    actionLabel: 'Communion',
    actionType: 'communion',
  },
  {
    id: 'aspergillum',
    label: 'Aspergillum splash',
    buildingFile: 'aspergillum.png',
    flipUntilVisited: true,
    fallbackEmoji: '💧',
    top: '19.9%',
    left: '85.8%',
    actionId: 'aspergillum',
    fact: "Sprinkle sprinkle! You're all wet with holy water!",
    actionType: 'amen',
  },
  {
    id: 'st_jude',
    label: 'St. Jude Shrine',
    buildingFile: 'st-jude-arm-bone.png',
    visitedFlip: true,
    fallbackEmoji: '🦴',
    top: '28.5%',
    left: '67.6%',
    actionId: 'st_jude',
    fact: 'Pray a novena to Saint Jude.',
    actionLabel: 'Pray novena',
    actionType: 'amen',
  },
  {
    id: 'candle',
    label: 'Votive Candle',
    buildingFile: 'votive-candle.png',
    fallbackEmoji: '🕯️',
    top: '91.1%',
    left: '59.3%',
    actionId: 'candle',
    fact: 'Light a candle for a fallen worshiper.',
    actionLabel: 'Spread the light',
    actionType: 'candle',
  },
  {
    id: 'bulletin',
    label: 'Parish Bulletin',
    buildingFile: 'bulletin.png',
    fallbackEmoji: '📋',
    top: '30.8%',
    left: '33.9%',
    actionId: null,
    fact: 'Leave a note for the cloud. Names reset when you close this tab.',
    actionType: 'bulletin',
  },
  {
    id: 'wheel',
    label: 'Wheel of Saints',
    buildingFile: 'spin_wheel.png',
    fallbackEmoji: '☸️',
    top: '92.8%',
    left: '82.0%',
    actionId: null,
    fact: 'One spin per worshiper per day. The saints are generous (usually).',
    actionType: 'wheel',
  },
];

/** Default entry skin */
export const WORSHIPER_SKIN_ID = 'frog';
export const DEFAULT_SKIN_ID = WORSHIPER_SKIN_ID;

/** Pick one at registration — frog/fairy use rank sprites; A/B use emoji until art ships */
export const ENTRY_WORSHIPER_SKINS = [
  { id: 'frog', label: 'Frog Worshiper', emoji: '🐸' },
  { id: 'fairy', label: 'Fairy Worshiper', emoji: '🧚' },
  { id: 'lamb', label: 'Lamb Worshiper', emoji: '🐑' },
  { id: 'worshiper_a', label: 'Worshiper A', emoji: '🙏' },
];

/** Skins offered on the registration picker (art-ready only). */
export const REGISTER_WORSHIPER_SKINS = ENTRY_WORSHIPER_SKINS.filter(
  (skin) => skin.id !== 'worshiper_a'
);

export const ENTRY_WORSHIPER_SKINS_BY_ID = Object.fromEntries(
  ENTRY_WORSHIPER_SKINS.map((s) => [s.id, s])
);

export const VALID_SKIN_IDS = new Set(ENTRY_WORSHIPER_SKINS.map((s) => s.id));

/** Frog worshiper sprites in public/assets/catholicecloud/worshipers/ */
export const FROG_PORTRAITS = [
  { id: 'frog_cantor', rankId: 'cantor', label: 'Frog Cantor', emoji: '🐸', imageFile: 'frog-cantor.png' },
  {
    id: 'frog_seminarian',
    rankId: 'seminarian',
    label: 'Frog Seminarian',
    emoji: '🐸',
    imageFile: 'frog-seminarian.png',
  },
  { id: 'frog_deacon', rankId: 'deacon', label: 'Frog Deacon', emoji: '🐸', imageFile: 'frog-deacon.png' },
  { id: 'frog_priest', rankId: 'priest', label: 'Frog Priest', emoji: '🐸', imageFile: 'frog-priest.png' },
];

/** Fairy worshiper sprites — filenames match uploads (incl. fairy-preist.png typo) */
export const FAIRY_PORTRAITS = [
  { id: 'fairy_cantor', rankId: 'cantor', label: 'Fairy Cantor', emoji: '🧚', imageFile: 'fairy-cantor.png' },
  {
    id: 'fairy_seminarian',
    rankId: 'seminarian',
    label: 'Fairy Seminarian',
    emoji: '🧚',
    imageFile: 'fairy-seminarian.png',
  },
  { id: 'fairy_deacon', rankId: 'deacon', label: 'Fairy Deacon', emoji: '🧚', imageFile: 'fairy-deacon.png' },
  { id: 'fairy_priest', rankId: 'priest', label: 'Fairy Priest', emoji: '🧚', imageFile: 'fairy-preist.png' },
];

/** Lamb worshiper sprites — keep exact extension casing from uploads */
export const LAMB_PORTRAITS = [
  { id: 'lamb_cantor', rankId: 'cantor', label: 'Lamb Cantor', emoji: '🐑', imageFile: 'lamb-cantor.PNG' },
  {
    id: 'lamb_seminarian',
    rankId: 'seminarian',
    label: 'Lamb Seminarian',
    emoji: '🐑',
    imageFile: 'lamb-seminarian.PNG',
  },
  { id: 'lamb_deacon', rankId: 'deacon', label: 'Lamb Deacon', emoji: '🐑', imageFile: 'lamb-deacon.png' },
  { id: 'lamb_priest', rankId: 'priest', label: 'Lamb Priest', emoji: '🐑', imageFile: 'lamb-priest.png' },
];

/** Skins with per-rank PNG portraits */
export const RANK_PORTRAIT_SKIN_IDS = new Set(['frog', 'fairy', 'lamb']);

/** @deprecated alias */
export const WORSHIPER_PORTRAITS = FROG_PORTRAITS;

export const DEFAULT_AVATAR_ID = DEFAULT_SKIN_ID;

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

export const FROG_PORTRAITS_BY_RANK = Object.fromEntries(FROG_PORTRAITS.map((p) => [p.rankId, p]));

export const FROG_PORTRAITS_BY_ID = Object.fromEntries(FROG_PORTRAITS.map((p) => [p.id, p]));

export const FAIRY_PORTRAITS_BY_RANK = Object.fromEntries(FAIRY_PORTRAITS.map((p) => [p.rankId, p]));

export const FAIRY_PORTRAITS_BY_ID = Object.fromEntries(FAIRY_PORTRAITS.map((p) => [p.id, p]));

export const LAMB_PORTRAITS_BY_RANK = Object.fromEntries(LAMB_PORTRAITS.map((p) => [p.rankId, p]));

export const LAMB_PORTRAITS_BY_ID = Object.fromEntries(LAMB_PORTRAITS.map((p) => [p.id, p]));

export const RANK_PORTRAITS_BY_ID = {
  ...FROG_PORTRAITS_BY_ID,
  ...FAIRY_PORTRAITS_BY_ID,
  ...LAMB_PORTRAITS_BY_ID,
  pope: POPE_PORTRAIT,
};

export const WORSHIPER_PORTRAITS_BY_RANK = FROG_PORTRAITS_BY_RANK;
export const WORSHIPER_PORTRAITS_BY_ID = FROG_PORTRAITS_BY_ID;

/** @deprecated */
export const WORSHIPER_AVATARS = FROG_PORTRAITS;

export function frogPortraitForRank(rankId) {
  return FROG_PORTRAITS_BY_RANK[rankId] || FROG_PORTRAITS[0];
}

export function fairyPortraitForRank(rankId) {
  return FAIRY_PORTRAITS_BY_RANK[rankId] || FAIRY_PORTRAITS[0];
}

export function lambPortraitForRank(rankId) {
  return LAMB_PORTRAITS_BY_RANK[rankId] || LAMB_PORTRAITS[0];
}

export function rankPortraitForSkin(skinId, rankId) {
  if (rankId === 'pope') return { ...POPE_PORTRAIT, id: `pope_${skinId}` };
  if (skinId === 'frog') return frogPortraitForRank(rankId);
  if (skinId === 'fairy') return fairyPortraitForRank(rankId);
  if (skinId === 'lamb') return lambPortraitForRank(rankId);
  return null;
}

/** @deprecated — frog only */
export function portraitForRank(rankId) {
  return frogPortraitForRank(rankId);
}

export function portraitForSkinAndRank(skinId, rankId = 'cantor') {
  const skin = VALID_SKIN_IDS.has(skinId) ? skinId : DEFAULT_SKIN_ID;
  if (rankId === 'pope') {
    return { ...POPE_PORTRAIT, id: `pope_${skin}` };
  }
  const rankPortrait = rankPortraitForSkin(skin, rankId);
  if (rankPortrait) return rankPortrait;
  const entry = ENTRY_WORSHIPER_SKINS_BY_ID[skin];
  return {
    id: `${skin}_${rankId}`,
    emoji: entry?.emoji ?? '✦',
    imageFile: null,
    label: entry?.label ?? 'Worshiper',
  };
}

export function portraitForWorshiper(worshiper) {
  const rankId = worshiper?.rank?.id ?? rankFromPoints(worshiper?.pontifexPoints ?? 0).id;
  return portraitForSkinAndRank(worshiper?.avatarId, rankId);
}

export function avatarById(id) {
  if (RANK_PORTRAITS_BY_ID[id]) return RANK_PORTRAITS_BY_ID[id];
  if (ENTRY_WORSHIPER_SKINS_BY_ID[id]) {
    const entry = ENTRY_WORSHIPER_SKINS_BY_ID[id];
    return { id, emoji: entry.emoji, imageFile: null, label: entry.label };
  }
  if (id === DEFAULT_SKIN_ID || id?.startsWith('cantor_')) return FROG_PORTRAITS[0];
  return FROG_PORTRAITS[0];
}

/** Point thresholds only — ignores papacy contest. */
export function rankFromPoints(pp) {
  let current = RANKS[0];
  for (const r of RANKS) {
    if (pp >= r.minPP) current = r;
  }
  return current;
}

/**
 * Effective rank for display — only one registered account holds Pope at a time.
 * @param {number} pp
 * @param {{ accountId?: number, reigningPope?: { accountId: number, displayName: string, pontifexPoints: number } | null }} [ctx]
 */
export function effectiveRank(pp, ctx = {}) {
  const base = rankFromPoints(pp);
  if (base.id !== 'pope') return base;

  const { accountId, reigningPope } = ctx;
  if (!accountId) return PRIEST_RANK;
  if (!reigningPope) return PRIEST_RANK;
  if (reigningPope.accountId === accountId) return POPE_RANK;
  return PRIEST_RANK;
}

export function isPopeHolder(worshiper, reigningPope) {
  return (
    !!worshiper?.accountId &&
    !!reigningPope &&
    reigningPope.accountId === worshiper.accountId &&
    (worshiper.pontifexPoints ?? 0) >= POPE_RANK.minPP
  );
}

export function nextRank(pp, ctx = {}) {
  const current = effectiveRank(pp, ctx);
  if (current.id === 'pope') return null;

  const idx = RANKS.findIndex((r) => r.id === current.id);
  const byPoints = idx < RANKS.length - 1 ? RANKS[idx + 1] : null;

  if (current.id === 'priest' && pp >= POPE_RANK.minPP) {
    const reigningPP = ctx.reigningPope?.pontifexPoints ?? 0;
    const targetPP =
      reigningPP > 0 && ctx.reigningPope?.accountId !== ctx.accountId
        ? reigningPP + 1
        : POPE_RANK.minPP;
    return { ...POPE_RANK, minPP: targetPP, papacyContest: true };
  }

  return byPoints;
}

export function getActionLastDone(worshiper, key) {
  const ts = worshiper?.actionLastDone?.[key];
  return typeof ts === 'number' && Number.isFinite(ts) ? ts : null;
}

function isWithinMapCooldown(lastDoneMs) {
  if (lastDoneMs == null) return false;
  return Date.now() - lastDoneMs < MAP_ACTION_COOLDOWN_MS;
}

/** Register is once per browser session; map actions refresh hourly. */
export function canCompleteAction(worshiper, actionId) {
  const rule = ACTIVITY_REWARDS[actionId];
  if (!rule) return false;
  if (actionId === 'register') {
    return !(worshiper.completedActions || []).includes('register');
  }
  const last = getActionLastDone(worshiper, actionId);
  if (last == null) return true;
  return !isWithinMapCooldown(last);
}

export function hasActionDoneRecently(worshiper, actionId) {
  if (!actionId) return false;
  return isWithinMapCooldown(getActionLastDone(worshiper, actionId));
}

export function amenDiscoveryKey(locationId) {
  return `amen_${locationId}`;
}

export function canAwardAmenDiscovery(worshiper, locationId) {
  const key = amenDiscoveryKey(locationId);
  const last = getActionLastDone(worshiper, key);
  if (last == null) return true;
  return !isWithinMapCooldown(last);
}

/** True if this map stop’s Amen was claimed within the last hour. */
export function hasAmenDiscovery(worshiper, locationId) {
  return isWithinMapCooldown(getActionLastDone(worshiper, amenDiscoveryKey(locationId)));
}

/** Milliseconds until an action can be done again (0 if ready or unknown). */
export function actionCooldownRemainingMs(worshiper, actionId) {
  if (!actionId || actionId === 'register') return 0;
  const last = getActionLastDone(worshiper, actionId);
  if (last == null) return 0;
  const remaining = MAP_ACTION_COOLDOWN_MS - (Date.now() - last);
  return remaining > 0 ? remaining : 0;
}

export function formatActionCooldown(remainingMs) {
  if (!remainingMs || remainingMs <= 0) return '';
  const totalMin = Math.ceil(remainingMs / 60000);
  if (totalMin >= 60) {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return m > 0 ? `about ${h}h ${m}m` : `about ${h}h`;
  }
  return totalMin <= 1 ? 'about a minute' : `about ${totalMin} minutes`;
}

export function recordActionLastDone(worshiper, key) {
  return {
    ...worshiper,
    actionLastDone: {
      ...(worshiper.actionLastDone || {}),
      [key]: Date.now(),
    },
  };
}

/** Hourly portrait communion — Blood → Body → stuffed (3rd click). */
export const PORTRAIT_COMMUNION_CYCLE_KEY = 'portrait_communion_cycle';
export const PORTRAIT_COMMUNION_STEP_KEY = 'portrait_communion_step';

export const PORTRAIT_COMMUNION = {
  blood: {
    id: 'blood',
    title: 'The Blood of Christ',
    prompt: 'Drink the Blood of Christ',
    imageFile: 'bloodwine.png',
    emoji: '🍷',
    bonusPP: 24,
  },
  body: {
    id: 'body',
    title: 'The Body of Christ',
    prompt: 'Receive the Body of Christ',
    imageFile: 'wafer.png',
    emoji: '🫓',
    bonusPP: 28,
  },
  stuffed: {
    id: 'stuffed',
    message: "No thanks, im stuffed!",
    emoji: '😌',
  },
};

export function getPortraitCommunionStep(worshiper) {
  const raw = worshiper?.actionLastDone?.[PORTRAIT_COMMUNION_STEP_KEY];
  return typeof raw === 'number' && raw >= 0 && raw <= 3 ? raw : 0;
}

export function portraitCommunionCycleExpired(worshiper) {
  const cycleStart = getActionLastDone(worshiper, PORTRAIT_COMMUNION_CYCLE_KEY);
  if (cycleStart == null) return true;
  return Date.now() - cycleStart >= MAP_ACTION_COOLDOWN_MS;
}

/** @returns {'blood' | 'body' | 'stuffed'} */
export function portraitCommunionKindForClick(worshiper) {
  const step = portraitCommunionCycleExpired(worshiper) ? 0 : getPortraitCommunionStep(worshiper);
  if (step >= 2) return 'stuffed';
  if (step === 1) return 'body';
  return 'blood';
}

export function advancePortraitCommunion(worshiper) {
  const expired = portraitCommunionCycleExpired(worshiper);
  const step = expired ? 0 : getPortraitCommunionStep(worshiper);
  const kind = portraitCommunionKindForClick(worshiper);
  const newStep = step >= 2 ? 3 : step + 1;
  const cycleTs = expired ? Date.now() : getActionLastDone(worshiper, PORTRAIT_COMMUNION_CYCLE_KEY);

  return {
    kind,
    worshiper: {
      ...worshiper,
      actionLastDone: {
        ...(worshiper.actionLastDone || {}),
        [PORTRAIT_COMMUNION_CYCLE_KEY]: cycleTs,
        [PORTRAIT_COMMUNION_STEP_KEY]: newStep,
      },
    },
  };
}

export function locationById(id) {
  return CEC_LOCATIONS.find((l) => l.id === id);
}

/** Buildings that open the frame popup (Amen dismiss grants discovery; hourly cooldown). */
export const AMEN_DISCOVERABLE_LOCATION_COUNT = CEC_LOCATIONS.filter(
  (l) => l.actionType !== 'bulletin' && l.actionType !== 'wheel'
).length;

/** Map building action ids (excludes register, bulletin, wheel). */
export const MAP_ACTIVITY_IDS = [
  'incense',
  'fish_fry',
  'rosary',
  'vatican',
  'aspergillum',
  'st_jude',
  'candle',
];

export function minWheelPontifexPoints() {
  return WHEEL_SAINTS.reduce((min, s) => Math.min(min, s.ppMin), Number.POSITIVE_INFINITY);
}

export function maxWheelPontifexPoints() {
  return WHEEL_SAINTS.reduce((max, s) => Math.max(max, s.ppMax), 0);
}

/** Max PP from activities + Amens in one session (wheel spin not included). */
export function maxPontifexPointsNonWheelSession() {
  let sum = 0;
  for (const rule of Object.values(ACTIVITY_REWARDS)) {
    sum += rule.pp * rule.maxPerSession;
  }
  sum += AMEN_DISCOVERY_PP * AMEN_DISCOVERABLE_LOCATION_COUNT;
  return sum;
}

/** Register + all map activities + all Amen discoveries + one wheel spin (worst saint roll). */
export function minPontifexPointsPerDay() {
  let sum = ACTIVITY_REWARDS.register.pp;
  for (const id of MAP_ACTIVITY_IDS) {
    sum += ACTIVITY_REWARDS[id].pp;
  }
  sum += AMEN_DISCOVERY_PP * AMEN_DISCOVERABLE_LOCATION_COUNT;
  sum += minWheelPontifexPoints();
  return sum;
}

/** Full session cap including best possible wheel spin. */
export function maxPontifexPointsFullDay() {
  return maxPontifexPointsNonWheelSession() + maxWheelPontifexPoints();
}

export function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}
