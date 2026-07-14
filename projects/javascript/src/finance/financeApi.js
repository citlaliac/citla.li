import {
  financeApiUrl,
  lastNMonthsWindow,
  monthKeysBetween,
  monthShortLabel,
  resolveReportWindow,
} from './financeConfig';
import {
  DEMO_CATEGORIES,
  DEMO_CATEGORIZED,
  DEMO_TRANSACTIONS,
  DEMO_VENDOR_TAGS,
} from './financeDemoData';

const TOKEN_KEY = 'finance_auth_token';
/** How long “keep me signed in” lasts on the server (days). */
export const FINANCE_REMEMBER_DAYS = 30;
const DEMO_TOKEN = 'demo-local-preview';

export const isFinanceDemo = process.env.REACT_APP_FINANCE_DEMO === 'true';

let demoInbox = [...DEMO_TRANSACTIONS];
/** Mutable categorized list for demo report drill-down + recategorize. */
let demoCategorized = DEMO_CATEGORIZED.map((t) => ({ ...t }));

function demoDelay(data, ms = 180) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), ms);
  });
}

/** Prefer durable localStorage; fall back to tab sessionStorage. */
export function getFinanceToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Persist session token. remember=true → localStorage (survives browser restart);
 * remember=false → sessionStorage (cleared when the tab/window closes).
 */
export function setFinanceToken(token, { remember = true } = {}) {
  try {
    if (!token) {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      return;
    }
    if (remember) {
      localStorage.setItem(TOKEN_KEY, token);
      sessionStorage.removeItem(TOKEN_KEY);
    } else {
      sessionStorage.setItem(TOKEN_KEY, token);
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    /* ignore quota / private mode */
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

/**
 * @param {string} password
 * @param {{ rememberMe?: boolean, rememberDays?: number }} [opts]
 */
export function financeLogin(password, opts = {}) {
  const rememberMe = opts.rememberMe !== false;
  const rememberDays = opts.rememberDays ?? (rememberMe ? FINANCE_REMEMBER_DAYS : 1);
  if (isFinanceDemo) {
    if (!password) return Promise.reject(new Error('Password is required'));
    return demoDelay({
      success: true,
      token: DEMO_TOKEN,
      days: rememberDays,
    }).then((data) => {
      setFinanceToken(DEMO_TOKEN, { remember: rememberMe });
      return data;
    });
  }
  return financeRequest(financeApiUrl('auth', { action: 'login' }), {
    method: 'POST',
    body: JSON.stringify({ password, rememberMe, rememberDays }),
  });
}

export function financeFetchCategories() {
  if (isFinanceDemo) {
    return demoDelay({
      success: true,
      categories: DEMO_CATEGORIES,
      vendorTags: DEMO_VENDOR_TAGS,
    });
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

/**
 * @param {string|object} statusOrFilters - legacy status string, or { status, range, month, categoryId, vendorTag }
 */
export function financeFetchTransactions(statusOrFilters = 'uncategorized') {
  const filters =
    typeof statusOrFilters === 'string'
      ? { status: statusOrFilters }
      : { status: 'all', ...statusOrFilters };

  const window =
    filters.range || filters.month
      ? resolveReportWindow(filters.range || 'month', filters.month)
      : null;
  const inWindow = (date) => {
    if (!window) return true;
    const d = String(date).slice(0, 10);
    return d >= window.start && d <= window.end;
  };

  if (isFinanceDemo) {
    let list = [];
    if (filters.status === 'uncategorized') {
      list = [...demoInbox];
    } else if (filters.categoryId != null) {
      list = demoCategorized.filter((t) => t.categoryId === Number(filters.categoryId));
      list = list.filter((t) => inWindow(t.date));
    } else if (filters.vendorTag) {
      list = demoCategorized.filter((t) => t.vendorTag === filters.vendorTag);
      list = list.filter((t) => inWindow(t.date));
    } else if (filters.status === 'categorized') {
      list = [...demoCategorized];
    }
    return demoDelay({ success: true, transactions: list });
  }

  const query = {};
  if (filters.status && filters.status !== 'all') query.status = filters.status;
  if (filters.range) query.range = filters.range;
  if (filters.month) query.month = filters.month;
  if (filters.categoryId != null) query.categoryId = String(filters.categoryId);
  if (filters.vendorTag) query.vendorTag = filters.vendorTag;
  return financeRequest(financeApiUrl('transactions', { query }));
}

export function financeCategorizeTransaction(id, categoryId, { vendorTag } = {}) {
  if (isFinanceDemo) {
    demoInbox = demoInbox.filter((t) => t.id !== id);
    const fromCategorized = demoCategorized.find((t) => t.id === id);
    if (fromCategorized) {
      fromCategorized.categoryId = categoryId;
      if (vendorTag !== undefined) fromCategorized.vendorTag = vendorTag || null;
    }
    return demoDelay({ success: true, id, categoryId, vendorTag: vendorTag || null });
  }
  const body = { categoryId };
  if (vendorTag !== undefined) body.vendorTag = vendorTag || '';
  return financeRequest(financeApiUrl('transactions', { id }), {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

/** Flip transaction amount sign (+/−). Survives sync via amount_manual on the server. */
export function financeFlipTransactionAmount(id) {
  if (isFinanceDemo) {
    const flipIn = (list) => {
      const row = list.find((t) => t.id === id);
      if (row) {
        row.amount = -Number(row.amount);
        row.amountManual = true;
      }
      return row;
    };
    const updated = flipIn(demoInbox) || flipIn(demoCategorized);
    return demoDelay({
      success: true,
      transaction: updated || { id, amount: 0 },
    });
  }
  return financeRequest(financeApiUrl('transactions', { id }), {
    method: 'PATCH',
    body: JSON.stringify({ flipAmount: true }),
  });
}

/**
 * @param {string|{ range?: string, month?: string }} rangeOrMonth - month key or { range, month }
 */
export function financeFetchReport(rangeOrMonth) {
  const opts =
    typeof rangeOrMonth === 'string'
      ? { range: 'month', month: rangeOrMonth }
      : { range: 'month', ...rangeOrMonth };
  const window = resolveReportWindow(opts.range, opts.month);

  if (isFinanceDemo) {
    // Rebuild spending totals from mutable demoCategorized so recategorize updates the report.
    const inWindow = (date) => {
      const d = String(date).slice(0, 10);
      return d >= window.start && d <= window.end;
    };
    const spendingMap = new Map();
    const movedMap = new Map();
    const incomeMap = new Map();
    const ignoredMap = new Map();
    for (const txn of demoCategorized) {
      if (!inWindow(txn.date)) continue;
      const cat = DEMO_CATEGORIES.find((c) => c.id === txn.categoryId);
      if (!cat) continue;
      const map =
        cat.excludeFromReports || cat.reportGroup === 'ignore'
          ? ignoredMap
          : cat.reportGroup === 'moved'
            ? movedMap
            : cat.reportGroup === 'income'
              ? incomeMap
              : spendingMap;
      const prev = map.get(cat.id) || {
        categoryId: cat.id,
        label: cat.label,
        total: 0,
        txnCount: 0,
      };
      prev.total += Number(txn.amount) || 0;
      prev.txnCount += 1;
      map.set(cat.id, prev);
    }
    const spending = [...spendingMap.values()].sort((a, b) => b.total - a.total);
    const moved = [...movedMap.values()].sort((a, b) => b.total - a.total);
    const income = [...incomeMap.values()].sort((a, b) => b.total - a.total);
    const ignored = [...ignoredMap.values()].sort((a, b) => b.total - a.total);
    const spendingTotal = spending.reduce((s, r) => s + r.total, 0);
    for (const row of spending) {
      row.pct = spendingTotal > 0 ? Math.round((1000 * row.total) / spendingTotal) / 10 : 0;
    }

    /** Demo spend rule: only report_group === spending (not income / investments / ignore). */
    const isSpendTxn = (txn) => {
      const cat = DEMO_CATEGORIES.find((c) => c.id === txn.categoryId);
      return cat && !cat.excludeFromReports && cat.reportGroup === 'spending';
    };

    // Store chips only count spend (same as production report).
    const vendorMap = new Map();
    for (const txn of demoCategorized) {
      if (!inWindow(txn.date) || !txn.vendorTag || !isSpendTxn(txn)) continue;
      const tag = DEMO_VENDOR_TAGS.find((t) => t.slug === txn.vendorTag);
      const prev = vendorMap.get(txn.vendorTag) || {
        slug: txn.vendorTag,
        label: tag?.label || txn.vendorTag,
        total: 0,
        txnCount: 0,
      };
      prev.total += Number(txn.amount) || 0;
      prev.txnCount += 1;
      vendorMap.set(txn.vendorTag, prev);
    }
    const vendors = [...vendorMap.values()].sort((a, b) => b.total - a.total);

    const buildMonthly = (start, end) => {
      const keys = monthKeysBetween(start, end);
      const byMonth = Object.fromEntries(keys.map((k) => [k, 0]));
      for (const txn of demoCategorized) {
        const d = String(txn.date).slice(0, 10);
        if (d < start || d > end || !isSpendTxn(txn)) continue;
        const ym = d.slice(0, 7);
        if (byMonth[ym] != null) byMonth[ym] += Number(txn.amount) || 0;
      }
      const monthlySpend = keys.map((ym) => ({
        month: ym,
        label: monthShortLabel(ym),
        total: byMonth[ym] || 0,
      }));
      const sum = monthlySpend.reduce((s, r) => s + r.total, 0);
      const monthBucketCount = Math.max(keys.length, 1);
      return {
        monthlySpend,
        avgMonthlySpend: sum / monthBucketCount,
        monthBucketCount,
      };
    };

    const series = buildMonthly(window.start, window.end);

    const buildMerchants = (start, end) => {
      const map = new Map();
      for (const txn of demoCategorized) {
        const d = String(txn.date).slice(0, 10);
        if (d < start || d > end || !isSpendTxn(txn)) continue;
        const name = txn.merchantName || '';
        if (!name || /mta/i.test(name)) continue;
        const prev = map.get(name) || { merchantName: name, total: 0, txnCount: 0 };
        prev.total += Number(txn.amount) || 0;
        prev.txnCount += 1;
        map.set(name, prev);
      }
      return [...map.values()].sort((a, b) => b.total - a.total).slice(0, 5);
    };

    const buildHot = (start, end) => {
      const map = new Map();
      for (const txn of demoCategorized) {
        const d = String(txn.date).slice(0, 10);
        if (d < start || d > end || !isSpendTxn(txn)) continue;
        const cat = DEMO_CATEGORIES.find((c) => c.id === txn.categoryId);
        if (!cat) continue;
        const prev = map.get(cat.id) || {
          categoryId: cat.id,
          label: cat.label,
          slug: cat.slug,
          txnCount: 0,
          total: 0,
        };
        prev.txnCount += 1;
        prev.total += Number(txn.amount) || 0;
        map.set(cat.id, prev);
      }
      return [...map.values()].sort((a, b) => b.txnCount - a.txnCount || b.total - a.total).slice(0, 3);
    };

    const topMerchants = {};
    for (const n of [1, 6, 12]) {
      const w = lastNMonthsWindow(n);
      topMerchants[String(n)] = buildMerchants(w.start, w.end);
    }
    const hotCategories = {};
    for (const n of [3, 6, 12]) {
      const w = lastNMonthsWindow(n);
      hotCategories[String(n)] = buildHot(w.start, w.end);
    }

    return demoDelay({
      success: true,
      range: window.range,
      month: window.month,
      start: window.start,
      end: window.end,
      label: window.label,
      spending,
      moved,
      income,
      ignored,
      vendors,
      spendingTotal,
      incomeTotal: income.reduce((s, r) => s + r.total, 0),
      ignoredTotal: ignored.reduce((s, r) => s + r.total, 0),
      monthlySpend: series.monthlySpend,
      avgMonthlySpend: series.avgMonthlySpend,
      monthBucketCount: series.monthBucketCount,
      topMerchants,
      hotCategories,
    });
  }

  const query = { range: window.range };
  if (window.month) query.month = window.month;
  return financeRequest(financeApiUrl('reports', { query }));
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
