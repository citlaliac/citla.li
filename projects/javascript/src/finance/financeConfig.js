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

/** Report timeframe presets shown in the UI. */
export const REPORT_RANGE_OPTIONS = [
  { id: 'month', label: 'Month' },
  { id: 'last6', label: 'Last 6 months' },
  { id: 'last12', label: 'Last 12 months' },
  { id: 'ytd', label: 'Year to date' },
];

function toIsoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Resolve a report window for API calls and local filtering.
 * @returns {{ range: string, month: string|null, start: string, end: string, label: string }}
 */
export function resolveReportWindow(rangeId, monthKey = currentMonthKey()) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = toIsoDate(today);
  const range = rangeId || 'month';

  if (range === 'last6') {
    const start = new Date(today);
    start.setMonth(start.getMonth() - 6);
    return {
      range,
      month: null,
      start: toIsoDate(start),
      end,
      label: 'Last 6 months',
    };
  }
  if (range === 'last12') {
    const start = new Date(today);
    start.setMonth(start.getMonth() - 12);
    return {
      range,
      month: null,
      start: toIsoDate(start),
      end,
      label: 'Last 12 months',
    };
  }
  if (range === 'ytd') {
    const start = new Date(today.getFullYear(), 0, 1);
    return {
      range,
      month: null,
      start: toIsoDate(start),
      end,
      label: 'Year to date',
    };
  }

  // Single calendar month (default).
  const month = monthKey || currentMonthKey();
  const [y, m] = month.split('-').map(Number);
  const startDate = new Date(y, m - 1, 1);
  const endDate = new Date(y, m, 0);
  return {
    range: 'month',
    month,
    start: toIsoDate(startDate),
    end: toIsoDate(endDate),
    label: month,
  };
}

export function formatMoney(amount) {
  const n = Number(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n);
}
