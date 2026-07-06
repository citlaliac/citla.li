const isDev = process.env.NODE_ENV === 'development';

export function financeApiBase() {
  return isDev ? 'http://localhost:4201/api/finance' : '/finance-api.php';
}

export function financeApiUrl(resource, { action = '', query = {}, id = null } = {}) {
  if (isDev) {
    const base = financeApiBase();
    if (resource === 'auth') return `${base}/auth/login`;
    if (resource === 'categories') return `${base}/categories`;
    if (resource === 'sync') return `${base}/sync`;
    if (resource === 'plaid' && action === 'link-token') return `${base}/plaid/link-token`;
    if (resource === 'plaid' && action === 'exchange') return `${base}/plaid/exchange`;
    if (resource === 'plaid' && action === 'items') return `${base}/plaid/items`;
    if (resource === 'transactions' && id != null) return `${base}/transactions/${id}`;
    if (resource === 'transactions') {
      const qs = new URLSearchParams(query).toString();
      return `${base}/transactions${qs ? `?${qs}` : ''}`;
    }
    if (resource === 'reports') {
      const qs = new URLSearchParams(query).toString();
      return `${base}/reports?${qs}`;
    }
    if (resource === 'export') {
      const qs = new URLSearchParams(query).toString();
      return `${base}/export?${qs}`;
    }
    return base;
  }
  const params = new URLSearchParams({ resource, ...query });
  if (action) params.set('action', action);
  if (id != null) params.set('id', String(id));
  return `${financeApiBase()}?${params.toString()}`;
}

export function currentMonthKey() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${m}`;
}

export function formatMoney(amount) {
  const n = Number(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n);
}
