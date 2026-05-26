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
const CANTOR_COLLECTION_KEY = 'cec_cantor_collection_v1';
const CANTOR_ROTATION_KEY = 'cec_cantor_rotation_idx_v1';

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
  const avatars = WORSHIPER_AVATARS.map((a) => a.id);
  if (avatars.length === 0) return DEFAULT_AVATAR_ID;

  let seen = [];
  try {
    const raw = localStorage.getItem(CANTOR_COLLECTION_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    seen = Array.isArray(parsed) ? parsed.filter((id) => avatars.includes(id)) : [];
  } catch {
    seen = [];
  }

  const unseen = avatars.filter((id) => !seen.includes(id));
  let selected;

  if (unseen.length > 0) {
    selected = unseen[Math.floor(Math.random() * unseen.length)];
  } else {
    const currentRotation = Number(localStorage.getItem(CANTOR_ROTATION_KEY) || 0);
    selected = avatars[currentRotation % avatars.length];
    localStorage.setItem(CANTOR_ROTATION_KEY, String((currentRotation + 1) % avatars.length));
  }

  const nextSeen = seen.includes(selected) ? seen : [...seen, selected];
  try {
    localStorage.setItem(CANTOR_COLLECTION_KEY, JSON.stringify(nextSeen));
  } catch {
    /* ignore localStorage write errors */
  }

  return selected;
}

export function getCantorCollectionProgress() {
  const total = WORSHIPER_AVATARS.length;
  try {
    const raw = localStorage.getItem(CANTOR_COLLECTION_KEY);
    const seen = raw ? JSON.parse(raw) : [];
    const count = Array.isArray(seen)
      ? new Set(seen.filter((id) => WORSHIPER_AVATARS.some((a) => a.id === id))).size
      : 0;
    return { seenCount: count, total };
  } catch {
    return { seenCount: 0, total };
  }
}
