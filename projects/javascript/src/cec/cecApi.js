const isDev = process.env.NODE_ENV === 'development';

export function cecApiBase() {
  return isDev ? 'http://localhost:4201/api/cec' : '/cec-accounts-api.php';
}

function buildUrl(resource, { action = '', query = {} } = {}) {
  if (isDev) {
    if (resource === 'auth') {
      return `${cecApiBase()}/auth/${action}`;
    }
    if (resource === 'me') {
      return `${cecApiBase()}/me`;
    }
    if (resource === 'pope') {
      return `${cecApiBase()}/pope`;
    }
    if (resource === 'faction') {
      const qs = new URLSearchParams(query).toString();
      return `${cecApiBase()}/faction${action ? `/${action}` : ''}${qs ? `?${qs}` : ''}`;
    }
    if (resource === 'reward') {
      return `${cecApiBase()}/reward`;
    }
    if (resource === 'names') {
      const qs = new URLSearchParams(query).toString();
      return `${cecApiBase()}/names/check${qs ? `?${qs}` : ''}`;
    }
    return cecApiBase();
  }
  const params = new URLSearchParams({ resource, ...query });
  if (action) params.set('action', action);
  return `${cecApiBase()}?${params.toString()}`;
}

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const DEV_GUEST_USERNAME = 'citlali';

export function isDevGuestBypassName(name) {
  return (
    isDev && String(name || '').trim().toLowerCase() === DEV_GUEST_USERNAME
  );
}

export function cecCheckUsernameAvailable(username) {
  if (isDevGuestBypassName(username)) {
    return Promise.resolve(true);
  }
  return request(
    buildUrl('names', { action: 'check', query: { username } })
  ).then((d) => d.available);
}

export function cecRegisterAccount({ email, password, username, avatarId }) {
  return request(buildUrl('auth', { action: 'register' }), {
    method: 'POST',
    body: JSON.stringify({ email, password, username, avatarId }),
  });
}

export function cecLoginAccount({ email, password }) {
  return request(buildUrl('auth', { action: 'login' }), {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function cecFetchReigningPope() {
  return request(buildUrl('pope')).then((d) => d.reigningPope ?? null);
}

export function cecFetchAccount(token) {
  return request(buildUrl('me'), {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function cecSyncAccount(token, worshiper) {
  return request(buildUrl('me'), {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      // PP and cooldowns are intentionally excluded: the server owns progress.
      displayName: worshiper.displayName,
      avatarId: worshiper.avatarId,
    }),
  });
}

export function cecFetchFaction(token) {
  return request(buildUrl('faction'), {
    headers: { Authorization: `Bearer ${token}` },
  }).then((data) => data.faction);
}

export function cecPreviewSponsor(token, code) {
  return request(buildUrl('faction', { action: 'preview', query: { code } }), {
    headers: { Authorization: `Bearer ${token}` },
  }).then((data) => data.preview);
}

export function cecFoundFaction(token) {
  return request(buildUrl('faction', { action: 'found' }), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: '{}',
  }).then((data) => data.faction);
}

export function cecJoinFaction(token, code) {
  return request(buildUrl('faction', { action: 'join' }), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ code }),
  }).then((data) => data.faction);
}

export function cecClaimReward(token, rewardType, actionId = '') {
  return request(buildUrl('reward'), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ rewardType, actionId }),
  });
}

export function cecAuthHeaders() {
  try {
    const token = localStorage.getItem('cec_auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}
