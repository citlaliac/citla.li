import {
  ACTIVITY_REWARDS,
  AMEN_DISCOVERY_PP,
  DEFAULT_SKIN_ID,
  VALID_SKIN_IDS,
  amenDiscoveryKey,
  canCompleteAction,
  rankFromPoints,
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
  if (VALID_SKIN_IDS.has(skinId)) return skinId;
  return DEFAULT_SKIN_ID;
}

export function createWorshiper(displayName, skinId = DEFAULT_SKIN_ID) {
  return {
    sessionId: newSessionId(),
    displayName: displayName.trim().slice(0, 24),
    avatarId: normalizeSkinId(skinId),
    pontifexPoints: 0,
    rank: rankFromPoints(0),
    completedActions: [],
    lastSpinDate: null,
  };
}

export function loadWorshiper() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const w = JSON.parse(raw);
    if (!w?.sessionId || !w?.displayName) return null;
    w.avatarId = normalizeSkinId(w.avatarId);
    w.rank = rankFromPoints(w.pontifexPoints || 0);
    return w;
  } catch {
    return null;
  }
}

export function saveWorshiper(worshiper) {
  const next = {
    ...worshiper,
    avatarId: normalizeSkinId(worshiper.avatarId),
    rank: rankFromPoints(worshiper.pontifexPoints),
  };
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
  const next = {
    ...worshiper,
    pontifexPoints: worshiper.pontifexPoints + pp,
    completedActions: [...worshiper.completedActions, actionId],
  };
  const saved = saveWorshiper(next);
  const newRank = rankFromPoints(saved.pontifexPoints);
  const rankUp = newRank.id !== prevRank.id ? newRank : null;
  return { worshiper: saved, awarded: pp, rankUp };
}

export function awardAmenDiscovery(worshiper, locationId) {
  const key = amenDiscoveryKey(locationId);
  if (worshiper.completedActions.includes(key)) {
    return { worshiper, awarded: 0, rankUp: null };
  }
  const prevRank = rankFromPoints(worshiper.pontifexPoints);
  const next = {
    ...worshiper,
    pontifexPoints: worshiper.pontifexPoints + AMEN_DISCOVERY_PP,
    completedActions: [...worshiper.completedActions, key],
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
