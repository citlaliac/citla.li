import {
  ACTIVITY_REWARDS,
  AMEN_DISCOVERY_PP,
  WORSHIPER_AVATARS,
  amenDiscoveryKey,
  canCompleteAction,
  DEFAULT_AVATAR_ID,
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

export function createWorshiper(displayName, avatarId = DEFAULT_AVATAR_ID) {
  return {
    sessionId: newSessionId(),
    displayName: displayName.trim().slice(0, 24),
    avatarId: avatarId || DEFAULT_AVATAR_ID,
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
    if (!w.avatarId) w.avatarId = DEFAULT_AVATAR_ID;
    w.rank = rankFromPoints(w.pontifexPoints || 0);
    return w;
  } catch {
    return null;
  }
}

export function saveWorshiper(worshiper) {
  const next = {
    ...worshiper,
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

export function registerWorshiper(displayName, avatarId) {
  const chosenAvatarId = avatarId || chooseCantorVariantForSession();
  const w = createWorshiper(displayName, chosenAvatarId);
  const { worshiper } = awardPoints(w, 'register');
  return worshiper;
}

function chooseCantorVariantForSession() {
  const avatars = WORSHIPER_AVATARS;
  if (avatars.length === 0) return DEFAULT_AVATAR_ID;
  return avatars[Math.floor(Math.random() * avatars.length)].id;
}
