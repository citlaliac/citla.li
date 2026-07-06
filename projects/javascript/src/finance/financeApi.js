import { financeApiUrl } from './financeConfig';
import {
  DEMO_CATEGORIES,
  DEMO_REPORT,
  DEMO_TRANSACTIONS,
} from './financeDemoData';

const TOKEN_KEY = 'finance_auth_token';
const DEMO_TOKEN = 'demo-local-preview';

export const isFinanceDemo = process.env.REACT_APP_FINANCE_DEMO === 'true';

let demoInbox = [...DEMO_TRANSACTIONS];

function demoDelay(data, ms = 180) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), ms);
  });
}

export function getFinanceToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setFinanceToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export function clearFinanceToken() {
  setFinanceToken(null);
}

async function financeRequest(url, options = {}) {
  const token = getFinanceToken();
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { ...options, headers });
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('text/csv')) {
    const blob = await res.blob();
    if (!res.ok) throw new Error('Export failed');
    return { blob, filename: 'export.csv' };
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export function financeLogin(password) {
  if (isFinanceDemo) {
    if (!password) return Promise.reject(new Error('Password is required'));
    return demoDelay({ success: true, token: DEMO_TOKEN }).then((data) => {
      setFinanceToken(DEMO_TOKEN);
      return data;
    });
  }
  return financeRequest(financeApiUrl('auth', { action: 'login' }), {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

export function financeFetchCategories() {
  if (isFinanceDemo) {
    return demoDelay({ success: true, categories: DEMO_CATEGORIES });
  }
  return financeRequest(financeApiUrl('categories'));
}

export function financeCreateLinkToken() {
  if (isFinanceDemo) {
    return Promise.reject(new Error('Plaid Link is disabled in demo mode'));
  }
  return financeRequest(financeApiUrl('plaid', { action: 'link-token' }), { method: 'POST' });
}

export function financeExchangePublicToken(publicToken, institutionName) {
  if (isFinanceDemo) {
    return Promise.reject(new Error('Plaid Link is disabled in demo mode'));
  }
  return financeRequest(financeApiUrl('plaid', { action: 'exchange' }), {
    method: 'POST',
    body: JSON.stringify({ publicToken, institutionName }),
  });
}

export function financeFetchPlaidItems() {
  if (isFinanceDemo) {
    return demoDelay({
      success: true,
      items: [
        {
          id: 1,
          institutionName: 'Chase (demo)',
          lastSyncedAt: new Date().toISOString(),
        },
      ],
    });
  }
  return financeRequest(financeApiUrl('plaid', { action: 'items' }));
}

export function financeSync() {
  if (isFinanceDemo) {
    return demoDelay({ success: true, added: 0, modified: 0 });
  }
  return financeRequest(financeApiUrl('sync'), { method: 'POST' });
}

export function financeFetchTransactions(status = 'uncategorized') {
  if (isFinanceDemo) {
    const transactions = status === 'uncategorized' ? [...demoInbox] : [];
    return demoDelay({ success: true, transactions });
  }
  return financeRequest(financeApiUrl('transactions', { query: { status } }));
}

export function financeCategorizeTransaction(id, categoryId) {
  if (isFinanceDemo) {
    demoInbox = demoInbox.filter((t) => t.id !== id);
    return demoDelay({ success: true, id, categoryId });
  }
  return financeRequest(financeApiUrl('transactions', { id }), {
    method: 'PATCH',
    body: JSON.stringify({ categoryId }),
  });
}

export function financeFetchReport(month) {
  if (isFinanceDemo) {
    return demoDelay({ success: true, month, ...DEMO_REPORT });
  }
  return financeRequest(financeApiUrl('reports', { query: { month } }));
}

export function financeExportMonth(month, { download = false } = {}) {
  if (isFinanceDemo) {
    if (download) {
      const csv = 'date,merchant,amount,category\n2026-07-05,Trader Joe\'s,47.82,Groceries\n';
      const blob = new Blob([csv], { type: 'text/csv' });
      return demoDelay({ blob, filename: `finance-${month}.csv` });
    }
    return demoDelay({ success: true, exported: 12, message: 'Demo export (no Drive upload)' });
  }
  const query = { month };
  if (download) query.download = '1';
  return financeRequest(financeApiUrl('export', { query }), { method: 'POST' });
}
