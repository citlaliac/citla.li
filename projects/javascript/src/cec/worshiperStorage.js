import {
  ACTIVITY_REWARDS,
  AMEN_DISCOVERY_PP,
  DEFAULT_SKIN_ID,
  VALID_SKIN_IDS,
  amenDiscoveryKey,
  canAwardAmenDiscovery,
  canCompleteAction,
  rankFromPoints,
  recordActionLastDone,
  todayDateString,
} from './cecConfig';

const STORAGE_KEY = 'cec_worshiper';

function newSessionId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `cec-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function normalizeSkinId(skinId) {
  if (!skinId || skinId.startsWith('cantor_')) return DEFAULT_SKIN_ID;
  if (skinId === 'worshiper_b') return 'worshiper_a';
  if (VALID_SKIN_IDS.has(skinId)) return skinId;
  return DEFAULT_SKIN_ID;
}

function normalizeWorshiper(worshiper) {
  const w = { ...worshiper };
  w.actionLastDone =
    w.actionLastDone && typeof w.actionLastDone === 'object' ? { ...w.actionLastDone } : {};
  w.completedActions = Array.isArray(w.completedActions) ? [...w.completedActions] : [];
  w.avatarId = normalizeSkinId(w.avatarId);
  w.rank = rankFromPoints(w.pontifexPoints || 0);
  return w;
}

export function createWorshiper(displayName, skinId = DEFAULT_SKIN_ID) {
  return {
    sessionId: newSessionId(),
    displayName: displayName.trim().slice(0, 24),
    avatarId: normalizeSkinId(skinId),
    pontifexPoints: 0,
    rank: rankFromPoints(0),
    completedActions: [],
    actionLastDone: {},
    lastSpinDate: null,
  };
}

export function loadWorshiper() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const w = normalizeWorshiper(JSON.parse(raw));
    if (!w?.sessionId || !w?.displayName) return null;
    return w;
  } catch {
    return null;
  }
}

export function saveWorshiper(worshiper) {
  const next = normalizeWorshiper(worshiper);
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function awardPoints(worshiper, actionId) {
  if (!canCompleteAction(worshiper, actionId)) {
    return { worshiper, awarded: 0, rankUp: null };
  }
  const rule = ACTIVITY_REWARDS[actionId];
  const pp = rule.pp;
  const prevRank = rankFromPoints(worshiper.pontifexPoints);
  let next = recordActionLastDone(worshiper, actionId);
  next = {
    ...next,
    pontifexPoints: worshiper.pontifexPoints + pp,
    completedActions:
      actionId === 'register'
        ? [...next.completedActions, actionId]
        : next.completedActions,
  };
  const saved = saveWorshiper(next);
  const newRank = rankFromPoints(saved.pontifexPoints);
  const rankUp = newRank.id !== prevRank.id ? newRank : null;
  return { worshiper: saved, awarded: pp, rankUp };
}

export function awardAmenDiscovery(worshiper, locationId) {
  if (!canAwardAmenDiscovery(worshiper, locationId)) {
    return { worshiper, awarded: 0, rankUp: null };
  }
  const key = amenDiscoveryKey(locationId);
  const prevRank = rankFromPoints(worshiper.pontifexPoints);
  let next = recordActionLastDone(worshiper, key);
  next = {
    ...next,
    pontifexPoints: worshiper.pontifexPoints + AMEN_DISCOVERY_PP,
  };
  const saved = saveWorshiper(next);
  const newRank = rankFromPoints(saved.pontifexPoints);
  const rankUp = newRank.id !== prevRank.id ? newRank : null;
  return { worshiper: saved, awarded: AMEN_DISCOVERY_PP, rankUp };
}

export function addWheelPoints(worshiper, points) {
  const prevRank = rankFromPoints(worshiper.pontifexPoints);
  const next = {
    ...worshiper,
    pontifexPoints: worshiper.pontifexPoints + points,
    lastSpinDate: todayDateString(),
  };
  const saved = saveWorshiper(next);
  const newRank = rankFromPoints(saved.pontifexPoints);
  const rankUp = newRank.id !== prevRank.id ? newRank : null;
  return { worshiper: saved, rankUp };
}

export function canSpinToday(worshiper) {
  return worshiper.lastSpinDate !== todayDateString();
}

export function registerWorshiper(displayName, skinId = DEFAULT_SKIN_ID) {
  const w = createWorshiper(displayName, skinId);
  const { worshiper } = awardPoints(w, 'register');
  return worshiper;
}
