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

export function cecGuestEnter({ displayName, avatarId }) {
  return request(buildUrl('auth', { action: 'guest' }), {
    method: 'POST',
    body: JSON.stringify({ displayName, avatarId }),
  });
}

export function cecRegisterAccount({ email, password, displayName, avatarId }) {
  return request(buildUrl('auth', { action: 'register' }), {
    method: 'POST',
    body: JSON.stringify({ email, password, displayName, avatarId }),
  });
}

export function cecLoginAccount({ email, password }) {
  return request(buildUrl('auth', { action: 'login' }), {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
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
      displayName: worshiper.displayName,
      avatarId: worshiper.avatarId,
      pontifexPoints: worshiper.pontifexPoints,
      completedActions: worshiper.completedActions,
      actionLastDone: worshiper.actionLastDone,
      lastSpinDate: worshiper.lastSpinDate,
    }),
  });
}
