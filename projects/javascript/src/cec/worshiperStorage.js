import {
  ACTIVITY_REWARDS,
  AMEN_DISCOVERY_PP,
  DEFAULT_SKIN_ID,
  VALID_SKIN_IDS,
  amenDiscoveryKey,
  canAwardAmenDiscovery,
  advancePortraitCommunion,
  PORTRAIT_COMMUNION,
  canCompleteAction,
  effectiveRank,
  ppToOvertakePope,
  recordActionLastDone,
  todayDateString,
} from './cecConfig';
import { cecSyncAccount } from './cecApi';

const STORAGE_KEY = 'cec_worshiper';
const AUTH_TOKEN_KEY = 'cec_auth_token';

let reigningPope = null;

export function getReigningPope() {
  return reigningPope;
}

export function setReigningPope(pope) {
  reigningPope = pope ?? null;
}

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

function rankContext(worshiper) {
  return {
    accountId: worshiper?.accountId,
    reigningPope: getReigningPope(),
  };
}

function rankFor(worshiper) {
  return effectiveRank(worshiper.pontifexPoints || 0, rankContext(worshiper));
}

function rankChange(prevWorshiper, saved) {
  const prevRank = rankFor(prevWorshiper);
  const newRank = rankFor(saved);
  const ctx = rankContext(saved);

  if (prevRank.id === 'pope' && newRank.id !== 'pope' && saved.accountId) {
    const pointsNeeded = ppToOvertakePope(
      saved.pontifexPoints,
      ctx.reigningPope?.pontifexPoints ?? 0
    );
    return {
      rankUp: null,
      papacyLost: {
        reigningPopeName: ctx.reigningPope?.displayName ?? 'another worshiper',
        pointsNeeded,
      },
    };
  }

  if (prevRank.id !== 'pope' && newRank.id === 'pope') {
    return { rankUp: newRank, papacyLost: null };
  }

  if (newRank.id !== prevRank.id) {
    return { rankUp: newRank, papacyLost: null };
  }

  return { rankUp: null, papacyLost: null };
}

export function normalizeWorshiper(worshiper) {
  const w = { ...worshiper };
  w.actionLastDone =
    w.actionLastDone && typeof w.actionLastDone === 'object' ? { ...w.actionLastDone } : {};
  w.completedActions = Array.isArray(w.completedActions) ? [...w.completedActions] : [];
  w.avatarId = normalizeSkinId(w.avatarId);
  w.rank = rankFor(w);
  return w;
}

/** Recompute rank after reigning pope changes; may surface papacy loss or promotion. */
export function applyReigningPope(worshiper, nextPope) {
  if (!worshiper) return { worshiper, rankUp: null, papacyLost: null };
  const prevRank = rankFor(worshiper);
  setReigningPope(nextPope);
  const saved = normalizeWorshiper(worshiper);
  const newRank = saved.rank;

  if (prevRank.id === 'pope' && newRank.id !== 'pope' && saved.accountId) {
    return {
      worshiper: saved,
      rankUp: null,
      papacyLost: {
        reigningPopeName: nextPope?.displayName ?? 'another worshiper',
        pointsNeeded: ppToOvertakePope(saved.pontifexPoints, nextPope?.pontifexPoints ?? 0),
      },
    };
  }

  if (prevRank.id !== 'pope' && newRank.id === 'pope') {
    return { worshiper: saved, rankUp: newRank, papacyLost: null };
  }

  return { worshiper: saved, rankUp: null, papacyLost: null };
}

export function getAuthToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token) {
  try {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch {
    /* ignore */
  }
}

export function clearAuth() {
  setAuthToken(null);
  setReigningPope(null);
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function applyAccountWorshiper(serverWorshiper, serverReigningPope) {
  if (serverReigningPope !== undefined) {
    setReigningPope(serverReigningPope);
  }
  return normalizeWorshiper({
    ...serverWorshiper,
    avatarId: normalizeSkinId(serverWorshiper.avatarId),
  });
}

let syncTimer = null;
let onSyncResult = null;

export function setAccountSyncHandler(handler) {
  onSyncResult = typeof handler === 'function' ? handler : null;
}

function scheduleAccountSync(worshiper) {
  if (!worshiper?.accountId) return;
  const token = getAuthToken();
  if (!token) return;
  if (syncTimer) window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(() => {
    cecSyncAccount(token, worshiper)
      .then((data) => {
        if (data.reigningPope !== undefined) {
          setReigningPope(data.reigningPope);
        }
        onSyncResult?.(data);
      })
      .catch(() => {});
  }, 400);
}

export function createWorshiper(displayName, skinId = DEFAULT_SKIN_ID) {
  return {
    sessionId: newSessionId(),
    displayName: displayName.trim().slice(0, 24),
    avatarId: normalizeSkinId(skinId),
    pontifexPoints: 0,
    rank: rankFor({ pontifexPoints: 0 }),
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

function persistWorshiper(worshiper, { sync = true } = {}) {
  const next = normalizeWorshiper(worshiper);
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  if (sync) scheduleAccountSync(next);
  return next;
}

export function saveWorshiper(worshiper) {
  return persistWorshiper(worshiper, { sync: true });
}

/** Persist account state locally without pushing to the server (e.g. after GET /me). */
export function saveWorshiperLocal(worshiper) {
  return persistWorshiper(worshiper, { sync: false });
}

export function awardPoints(worshiper, actionId) {
  if (!canCompleteAction(worshiper, actionId)) {
    return { worshiper, awarded: 0, rankUp: null, papacyLost: null };
  }
  const rule = ACTIVITY_REWARDS[actionId];
  const pp = rule.pp;
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
  const { rankUp, papacyLost } = rankChange(worshiper, saved);
  return { worshiper: saved, awarded: pp, rankUp, papacyLost };
}

export function awardAmenDiscovery(worshiper, locationId) {
  if (!canAwardAmenDiscovery(worshiper, locationId)) {
    return { worshiper, awarded: 0, rankUp: null, papacyLost: null };
  }
  const key = amenDiscoveryKey(locationId);
  let next = recordActionLastDone(worshiper, key);
  next = {
    ...next,
    pontifexPoints: worshiper.pontifexPoints + AMEN_DISCOVERY_PP,
  };
  const saved = saveWorshiper(next);
  const { rankUp, papacyLost } = rankChange(worshiper, saved);
  return { worshiper: saved, awarded: AMEN_DISCOVERY_PP, rankUp, papacyLost };
}

export function addWheelPoints(worshiper, points) {
  const next = {
    ...worshiper,
    pontifexPoints: worshiper.pontifexPoints + points,
    lastSpinDate: todayDateString(),
  };
  const saved = saveWorshiper(next);
  const { rankUp, papacyLost } = rankChange(worshiper, saved);
  return { worshiper: saved, rankUp, papacyLost };
}

export function canSpinToday(worshiper) {
  return worshiper.lastSpinDate !== todayDateString();
}

export function registerWorshiper(displayName, skinId = DEFAULT_SKIN_ID) {
  const w = createWorshiper(displayName, skinId);
  const { worshiper } = awardPoints(w, 'register');
  return worshiper;
}

export function receivePortraitCommunion(worshiper) {
  const { worshiper: advanced, kind } = advancePortraitCommunion(worshiper);
  const bonusPP =
    kind === 'blood' || kind === 'body' ? PORTRAIT_COMMUNION[kind].bonusPP ?? 0 : 0;
  const next = {
    ...advanced,
    pontifexPoints: worshiper.pontifexPoints + bonusPP,
  };
  const saved = saveWorshiper(next);
  const { rankUp, papacyLost } = rankChange(worshiper, saved);
  return { worshiper: saved, kind, awarded: bonusPP, rankUp, papacyLost };
}
