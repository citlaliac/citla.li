const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { google } = require('googleapis');
const { FINANCE_CATEGORIES, FINANCE_VENDOR_TAGS, FINANCE_CATEGORY_SLUGS_REMOVED } = require('./finance-categories');
const { encryptSecret, decryptSecret } = require('./finance-crypto');
const { createLinkToken, exchangePublicToken, syncTransactions } = require('./finance-plaid');

let tablesReady = false;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function jsonOk(res, data = {}) {
  res.json({ success: true, ...data });
}

function jsonError(res, message, status = 400) {
  res.status(status).json({ success: false, error: message });
}

function isDevFinance() {
  return process.env.NODE_ENV !== 'production';
}

async function verifyAdminPassword(password) {
  const hash = process.env.FINANCE_ADMIN_PASSWORD_HASH;
  const plain = process.env.FINANCE_ADMIN_PASSWORD;
  if (hash) {
    return bcrypt.compare(password, hash);
  }
  if (isDevFinance() && plain) {
    return password === plain;
  }
  return false;
}

async function ensureFinanceTables(connection) {
  if (tablesReady) return;
  const schemaPath = path.join(__dirname, 'schema-finance.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith('--'));
  for (const stmt of statements) {
    await connection.query(stmt);
  }
  // Existing installs: add amount_manual so Venmo sign flips survive Plaid sync.
  const [cols] = await connection.execute(
    "SHOW COLUMNS FROM finance_transactions LIKE 'amount_manual'"
  );
  if (!cols.length) {
    await connection.query(
      'ALTER TABLE finance_transactions ADD COLUMN amount_manual TINYINT(1) NOT NULL DEFAULT 0 AFTER amount'
    );
  }
  const [vendorCols] = await connection.execute(
    "SHOW COLUMNS FROM finance_transactions LIKE 'vendor_tag'"
  );
  if (!vendorCols.length) {
    await connection.query(
      'ALTER TABLE finance_transactions ADD COLUMN vendor_tag VARCHAR(32) NULL AFTER merchant_name'
    );
  }
  // Widen label for emoji prefixes on existing installs.
  await connection.query('ALTER TABLE finance_categories MODIFY label VARCHAR(96) NOT NULL');
  await connection.execute(
    `UPDATE finance_transactions t
     JOIN finance_categories c ON c.id = t.category_id
     SET t.vendor_tag = 'amazon'
     WHERE c.slug = 'amazon' AND (t.vendor_tag IS NULL OR t.vendor_tag = '')`
  );
  const [rows] = await connection.execute('SELECT COUNT(*) AS c FROM finance_categories');
  if (Number(rows[0].c) === 0) {
    for (const cat of FINANCE_CATEGORIES) {
      await connection.execute(
        `INSERT INTO finance_categories (slug, label, sort_order, is_pinned, exclude_from_reports, report_group)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          cat.slug,
          cat.label,
          cat.sortOrder,
          cat.isPinned ? 1 : 0,
          cat.excludeFromReports ? 1 : 0,
          cat.reportGroup,
        ]
      );
    }
  } else {
    // Upsert seed so existing DBs pick up reorders, emojis, and new categories.
    for (const cat of FINANCE_CATEGORIES) {
      await connection.execute(
        `INSERT INTO finance_categories (slug, label, sort_order, is_pinned, exclude_from_reports, report_group)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           label = VALUES(label),
           sort_order = VALUES(sort_order),
           is_pinned = VALUES(is_pinned),
           exclude_from_reports = VALUES(exclude_from_reports),
           report_group = VALUES(report_group)`,
        [
          cat.slug,
          cat.label,
          cat.sortOrder,
          cat.isPinned ? 1 : 0,
          cat.excludeFromReports ? 1 : 0,
          cat.reportGroup,
        ]
      );
    }
  }

  // Drop retired categories (cash/savings); FK sets orphan category_id to NULL.
  for (const slug of FINANCE_CATEGORY_SLUGS_REMOVED) {
    await connection.execute('DELETE FROM finance_categories WHERE slug = ?', [slug]);
  }
  tablesReady = true;
}

/**
 * Issue a finance session. remember-me defaults to 30 days; short session = 1 day.
 * @returns {{ token: string, expiresAt: Date, days: number }}
 */
async function issueSessionToken(connection, days = 30) {
  let sessionDays = Number(days);
  if (!Number.isFinite(sessionDays) || sessionDays < 1) sessionDays = 1;
  if (sessionDays > 90) sessionDays = 90;
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expires = new Date(Date.now() + sessionDays * 24 * 60 * 60 * 1000);
  await connection.execute(
    'INSERT INTO finance_sessions (token_hash, expires_at) VALUES (?, ?)',
    [tokenHash, expires]
  );
  return { token, expiresAt: expires, days: sessionDays };
}

async function authenticateFinance(connection, req) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(\S+)$/i);
  if (!match) return false;
  const tokenHash = hashToken(match[1]);
  const [rows] = await connection.execute(
    'SELECT id FROM finance_sessions WHERE token_hash = ? AND expires_at > NOW() LIMIT 1',
    [tokenHash]
  );
  return rows.length > 0;
}

function categoryFromRow(row) {
  return {
    id: Number(row.id),
    slug: row.slug,
    label: row.label,
    sortOrder: Number(row.sort_order),
    isPinned: !!row.is_pinned,
    excludeFromReports: !!row.exclude_from_reports,
    reportGroup: row.report_group,
  };
}

function transactionFromRow(row) {
  return {
    id: Number(row.id),
    plaidTransactionId: row.plaid_transaction_id,
    date: row.txn_date instanceof Date ? row.txn_date.toISOString().slice(0, 10) : String(row.txn_date),
    amount: Number(row.amount),
    amountManual: !!row.amount_manual,
    merchantName: row.merchant_name,
    vendorTag: row.vendor_tag || null,
    pending: !!row.pending,
    categoryId: row.category_id != null ? Number(row.category_id) : null,
    categorizedAt: row.categorized_at,
    exportedAt: row.exported_at,
  };
}

/** Resolve report / drill-down window: month | last6 | last12 | ytd. */
function resolveDateWindow(range, month) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const toIso = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const end = toIso(today);
  const r = String(range || '').trim() || 'month';

  if (r === 'last6') {
    const start = new Date(today);
    start.setMonth(start.getMonth() - 6);
    return { start: toIso(start), end, range: 'last6', month: null, label: 'Last 6 months' };
  }
  if (r === 'last12') {
    const start = new Date(today);
    start.setMonth(start.getMonth() - 12);
    return { start: toIso(start), end, range: 'last12', month: null, label: 'Last 12 months' };
  }
  if (r === 'ytd') {
    const start = new Date(today.getFullYear(), 0, 1);
    return { start: toIso(start), end, range: 'ytd', month: null, label: 'Year to date' };
  }

  let monthKey = String(month || '').trim();
  if (!monthKey) {
    monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  }
  if (!/^\d{4}-\d{2}$/.test(monthKey)) {
    throw new Error('month must be YYYY-MM');
  }
  const [y, m] = monthKey.split('-').map(Number);
  const startDate = new Date(y, m - 1, 1);
  const endDate = new Date(y, m, 0);
  return {
    start: toIso(startDate),
    end: toIso(endDate),
    range: 'month',
    month: monthKey,
    label: monthKey,
  };
}

/** Rolling window ending today (for merchants / hot categories). */
function lastNMonthsWindow(n) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setMonth(start.getMonth() - Number(n));
  const toIso = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  return { start: toIso(start), end: toIso(today) };
}

function monthKeysBetween(startIso, endIso) {
  const keys = [];
  const cur = new Date(`${String(startIso).slice(0, 7)}-01T00:00:00`);
  const end = new Date(`${String(endIso).slice(0, 7)}-01T00:00:00`);
  while (cur <= end) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    keys.push(`${y}-${m}`);
    cur.setMonth(cur.getMonth() + 1);
  }
  return keys;
}

function monthShortLabel(ym) {
  const d = new Date(`${ym}-01T00:00:00`);
  return d.toLocaleString('en-US', { month: 'short' });
}

/** Costs only — income, investments (moved), and ignore are excluded from spend metrics. */
const SPENDING_JOIN = `
  FROM finance_transactions t
  JOIN finance_categories c ON c.id = t.category_id
  WHERE t.category_id IS NOT NULL
    AND c.exclude_from_reports = 0
    AND c.report_group = 'spending'`;

async function monthlySpendSeries(db, start, end) {
  const [rows] = await db.execute(
    `SELECT DATE_FORMAT(t.txn_date, '%Y-%m') AS ym, SUM(t.amount) AS total
     ${SPENDING_JOIN}
       AND t.txn_date >= ? AND t.txn_date <= ?
     GROUP BY ym
     ORDER BY ym ASC`,
    [start, end]
  );
  const byMonth = Object.fromEntries(rows.map((r) => [r.ym, Number(r.total)]));
  const keys = monthKeysBetween(start, end);
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
}

/** Day-of-month → spend total map for costs-only transactions. */
async function dailySpendMap(db, start, end) {
  const [rows] = await db.execute(
    `SELECT DAY(t.txn_date) AS day_num, SUM(t.amount) AS total
     ${SPENDING_JOIN}
       AND t.txn_date >= ? AND t.txn_date <= ?
     GROUP BY DAY(t.txn_date)
     ORDER BY day_num ASC`,
    [start, end]
  );
  return Object.fromEntries(rows.map((r) => [Number(r.day_num), Number(r.total)]));
}

function buildCumulativeDays(map, days) {
  const out = [];
  let cum = 0;
  for (let d = 1; d <= days; d += 1) {
    const dayTotal = map[d] || 0;
    cum += dayTotal;
    out.push({
      day: d,
      label: String(d),
      total: dayTotal,
      cumulative: cum,
    });
  }
  return out;
}

/**
 * Cumulative daily spend for monthKey vs the prior month through the same day.
 */
async function monthSpendPace(db, monthKey) {
  if (!/^\d{4}-\d{2}$/.test(monthKey)) return null;
  const [y, m] = monthKey.split('-').map(Number);
  const thisStart = `${monthKey}-01`;
  const lastDayOfMonth = new Date(y, m, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isCurrentMonth = today.getFullYear() === y && today.getMonth() + 1 === m;
  const throughDay = isCurrentMonth
    ? Math.min(today.getDate(), lastDayOfMonth)
    : lastDayOfMonth;
  const thisEnd = `${monthKey}-${String(throughDay).padStart(2, '0')}`;

  const priorAnchor = new Date(y, m - 2, 1);
  const py = priorAnchor.getFullYear();
  const pm = priorAnchor.getMonth() + 1;
  const priorLast = new Date(py, pm, 0).getDate();
  const priorThrough = Math.min(throughDay, priorLast);
  const priorMonthKey = `${py}-${String(pm).padStart(2, '0')}`;
  const priorStart = `${priorMonthKey}-01`;
  const priorEnd = `${priorMonthKey}-${String(priorThrough).padStart(2, '0')}`;

  const [thisMap, priorMap] = await Promise.all([
    dailySpendMap(db, thisStart, thisEnd),
    dailySpendMap(db, priorStart, priorEnd),
  ]);

  const dailySpend = buildCumulativeDays(thisMap, throughDay);
  const priorDailySpend = buildCumulativeDays(priorMap, priorThrough);
  const thisTotal = throughDay > 0 ? dailySpend[throughDay - 1].cumulative : 0;
  const priorTotal = priorThrough > 0 ? priorDailySpend[priorThrough - 1].cumulative : 0;
  const delta = thisTotal - priorTotal;
  const pctVsPrior = priorTotal > 0 ? Math.round((1000 * delta) / priorTotal) / 10 : null;

  return {
    dailySpend,
    priorDailySpend,
    pace: {
      throughDay,
      thisMonthTotal: thisTotal,
      priorMonthTotal: priorTotal,
      priorMonthLabel: priorAnchor.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
      delta,
      pctVsPrior,
    },
  };
}

/** Spend / invest as % of income (absolute totals so signs don't break ratios). */
function allocationSummary(spendingTotal, incomeTotal, investedTotal) {
  const spend = Math.abs(Number(spendingTotal) || 0);
  const income = Math.abs(Number(incomeTotal) || 0);
  const invested = Math.abs(Number(investedTotal) || 0);
  const pct = (part, whole) => (whole > 0 ? Math.round((1000 * part) / whole) / 10 : null);
  return {
    spendingAbs: spend,
    incomeAbs: income,
    investedAbs: invested,
    pctSpentOfIncome: pct(spend, income),
    pctInvestedOfIncome: pct(invested, income),
    pctAllocatedOfIncome: pct(spend + invested, income),
  };
}

async function topMerchants(db, start, end, limit = 5) {
  const safeLimit = Math.max(1, Math.min(20, Number(limit) || 5));
  const [rows] = await db.execute(
    `SELECT t.merchant_name AS merchantName, SUM(t.amount) AS total, COUNT(*) AS txnCount
     ${SPENDING_JOIN}
       AND t.txn_date >= ? AND t.txn_date <= ?
       AND t.merchant_name IS NOT NULL AND TRIM(t.merchant_name) <> ''
       AND UPPER(t.merchant_name) NOT LIKE '%MTA%'
     GROUP BY t.merchant_name
     ORDER BY total DESC
     LIMIT ${safeLimit}`,
    [start, end]
  );
  return rows.map((r) => ({
    merchantName: r.merchantName,
    total: Number(r.total),
    txnCount: Number(r.txnCount),
  }));
}

async function hotCategories(db, start, end, limit = 3) {
  const safeLimit = Math.max(1, Math.min(20, Number(limit) || 3));
  const [rows] = await db.execute(
    `SELECT c.id, c.label, c.slug, COUNT(*) AS txnCount, SUM(t.amount) AS total
     ${SPENDING_JOIN}
       AND t.txn_date >= ? AND t.txn_date <= ?
     GROUP BY c.id, c.label, c.slug
     ORDER BY txnCount DESC, total DESC
     LIMIT ${safeLimit}`,
    [start, end]
  );
  return rows.map((r) => ({
    categoryId: Number(r.id),
    label: r.label,
    slug: r.slug,
    txnCount: Number(r.txnCount),
    total: Number(r.total),
  }));
}

async function upsertPlaidTransaction(connection, plaidItemDbId, txn) {
  const merchant = (txn.merchant_name || txn.name || 'Unknown').slice(0, 255);
  const amount = Number(txn.amount) || 0;
  const date = txn.date;
  const pending = txn.pending ? 1 : 0;
  // Preserve user-flipped amounts (amount_manual=1) so Plaid sync does not undo Venmo sign fixes.
  await connection.execute(
    `INSERT INTO finance_transactions
      (plaid_transaction_id, plaid_item_id, txn_date, amount, merchant_name, pending)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       txn_date = VALUES(txn_date),
       amount = IF(amount_manual = 1, amount, VALUES(amount)),
       merchant_name = VALUES(merchant_name),
       pending = VALUES(pending)`,
    [txn.transaction_id, plaidItemDbId, date, amount, merchant, pending]
  );
}

async function syncAllPlaidItems(connection) {
  const [items] = await connection.execute('SELECT * FROM finance_plaid_items');
  let added = 0;
  let modified = 0;
  for (const item of items) {
    let accessToken;
    try {
      accessToken = decryptSecret(item.access_token_enc);
    } catch {
      continue;
    }
    let cursor = item.transactions_cursor || undefined;
    let hasMore = true;
    while (hasMore) {
      const data = await syncTransactions(accessToken, cursor);
      for (const txn of data.added || []) {
        await upsertPlaidTransaction(connection, item.id, txn);
        added += 1;
      }
      for (const txn of data.modified || []) {
        await upsertPlaidTransaction(connection, item.id, txn);
        modified += 1;
      }
      cursor = data.next_cursor;
      hasMore = data.has_more === true;
    }
    await connection.execute(
      'UPDATE finance_plaid_items SET transactions_cursor = ?, last_synced_at = NOW() WHERE id = ?',
      [cursor || null, item.id]
    );
  }
  return { added, modified, items: items.length };
}

function buildCsv(rows) {
  const header = 'date,merchant,amount,category';
  const lines = rows.map((r) => {
    const merchant = String(r.merchant_name || '').replace(/"/g, '""');
    const category = String(r.category_label || '').replace(/"/g, '""');
    return `${r.txn_date},"${merchant}",${r.amount},"${category}"`;
  });
  return `${header}\n${lines.join('\n')}\n`;
}

async function uploadCsvToDrive(filename, csv) {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;
  const folderId = process.env.FINANCE_GDRIVE_FOLDER_ID;
  if (!email || !key || !folderId) {
    throw new Error('Google Drive export is not configured');
  }
  const auth = new google.auth.JWT(
    email,
    null,
    key.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/drive.file']
  );
  const drive = google.drive({ version: 'v3', auth });
  const list = await drive.files.list({
    q: `'${folderId}' in parents and name='${filename}' and trashed=false`,
    fields: 'files(id)',
    pageSize: 1,
  });
  const media = { mimeType: 'text/csv', body: csv };
  if (list.data.files?.[0]?.id) {
    await drive.files.update({
      fileId: list.data.files[0].id,
      media,
    });
    return list.data.files[0].id;
  }
  const created = await drive.files.create({
    requestBody: { name: filename, parents: [folderId] },
    media,
    fields: 'id',
  });
  return created.data.id;
}

function registerFinanceRoutes(app, getConnection) {
  const router = express.Router();

  router.use(async (req, res, next) => {
    let connection;
    try {
      connection = await getConnection();
      await ensureFinanceTables(connection);
      req.financeDb = connection;
      res.on('finish', () => {
        connection.end().catch(() => {});
      });
      next();
    } catch (err) {
      if (connection) await connection.end().catch(() => {});
      jsonError(res, err.message || 'Finance DB error', 500);
    }
  });

  router.post('/auth/login', async (req, res) => {
    try {
      const password = req.body?.password || '';
      if (!password) return jsonError(res, 'Password is required');
      const ok = await verifyAdminPassword(password);
      if (!ok) return jsonError(res, 'Invalid password', 401);
      // rememberMe → 30 days; otherwise 1-day server session.
      const rememberMe = Boolean(req.body?.rememberMe);
      const requestedDays = req.body?.rememberDays != null
        ? Number(req.body.rememberDays)
        : rememberMe
          ? 30
          : 1;
      const session = await issueSessionToken(req.financeDb, requestedDays);
      jsonOk(res, {
        token: session.token,
        expiresAt: session.expiresAt,
        days: session.days,
      });
    } catch (err) {
      jsonError(res, err.message || 'Login failed', 500);
    }
  });

  router.use(async (req, res, next) => {
    if (req.path === '/auth/login' && req.method === 'POST') {
      return next();
    }
    const ok = await authenticateFinance(req.financeDb, req);
    if (!ok) return jsonError(res, 'Not authenticated', 401);
    return next();
  });

  router.get('/categories', async (req, res) => {
    try {
      const [rows] = await req.financeDb.execute(
        'SELECT * FROM finance_categories ORDER BY is_pinned DESC, sort_order ASC, id ASC'
      );
      // Amazon is a vendor tag now — hide legacy slug from the category picker.
      const categories = rows.filter((r) => r.slug !== 'amazon').map(categoryFromRow);
      jsonOk(res, {
        categories,
        vendorTags: FINANCE_VENDOR_TAGS.map((t) => ({ slug: t.slug, label: t.label })),
      });
    } catch (err) {
      jsonError(res, err.message || 'Failed to load categories', 500);
    }
  });

  // Create a user-defined category (label required; slug auto from label if omitted).
  router.post('/categories', async (req, res) => {
    try {
      const label = String(req.body?.label || '').trim().slice(0, 96);
      if (!label) return jsonError(res, 'label is required');
      let slug = String(req.body?.slug || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48);
      if (!slug) {
        slug = label
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 48) || 'custom';
      }
      const reportGroup = ['spending', 'income', 'moved', 'ignore'].includes(req.body?.reportGroup)
        ? req.body.reportGroup
        : 'spending';
      const exclude = reportGroup === 'ignore' ? 1 : 0;

      // Avoid colliding with reserved / existing slugs.
      let unique = slug;
      let n = 2;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const [existing] = await req.financeDb.execute(
          'SELECT id FROM finance_categories WHERE slug = ? LIMIT 1',
          [unique]
        );
        if (!existing.length) break;
        unique = `${slug.slice(0, 40)}-${n}`;
        n += 1;
        if (n > 50) return jsonError(res, 'Could not allocate a unique slug', 409);
      }

      const [maxRows] = await req.financeDb.execute(
        'SELECT COALESCE(MAX(sort_order), 0) AS m FROM finance_categories'
      );
      const sortOrder = Number(maxRows[0]?.m || 0) + 1;

      const [result] = await req.financeDb.execute(
        `INSERT INTO finance_categories (slug, label, sort_order, is_pinned, exclude_from_reports, report_group)
         VALUES (?, ?, ?, 0, ?, ?)`,
        [unique, label, sortOrder, exclude, reportGroup]
      );
      const [rows] = await req.financeDb.execute(
        'SELECT * FROM finance_categories WHERE id = ? LIMIT 1',
        [result.insertId]
      );
      jsonOk(res, { category: categoryFromRow(rows[0]) });
    } catch (err) {
      jsonError(res, err.message || 'Failed to create category', 500);
    }
  });

  router.post('/plaid/link-token', async (req, res) => {
    try {
      const data = await createLinkToken({ clientUserId: 'citlali-finance-admin' });
      jsonOk(res, { linkToken: data.link_token, expiration: data.expiration });
    } catch (err) {
      jsonError(res, err.message || 'Could not create link token', 500);
    }
  });

  router.post('/plaid/exchange', async (req, res) => {
    try {
      const publicToken = req.body?.publicToken;
      const institutionName = String(req.body?.institutionName || 'Linked account').slice(0, 128);
      if (!publicToken) return jsonError(res, 'publicToken is required');
      const data = await exchangePublicToken(publicToken);
      const enc = encryptSecret(data.access_token);
      await req.financeDb.execute(
        `INSERT INTO finance_plaid_items (item_id, institution_name, access_token_enc)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE institution_name = VALUES(institution_name), access_token_enc = VALUES(access_token_enc)`,
        [data.item_id, institutionName, enc]
      );
      jsonOk(res, { itemId: data.item_id });
    } catch (err) {
      jsonError(res, err.message || 'Could not link account', 500);
    }
  });

  router.get('/plaid/items', async (req, res) => {
    try {
      const [rows] = await req.financeDb.execute(
        'SELECT id, item_id, institution_name, last_synced_at, created_at FROM finance_plaid_items ORDER BY id ASC'
      );
      jsonOk(res, {
        items: rows.map((r) => ({
          id: Number(r.id),
          itemId: r.item_id,
          institutionName: r.institution_name,
          lastSyncedAt: r.last_synced_at,
          createdAt: r.created_at,
        })),
      });
    } catch (err) {
      jsonError(res, err.message || 'Failed to load accounts', 500);
    }
  });

  router.post('/sync', async (req, res) => {
    try {
      const result = await syncAllPlaidItems(req.financeDb);
      jsonOk(res, result);
    } catch (err) {
      jsonError(res, err.message || 'Sync failed', 500);
    }
  });

  router.get('/transactions', async (req, res) => {
    try {
      // Optional filters: status, range/month, categoryId, vendorTag — for report drill-down.
      const status = req.query.status || 'all';
      const range = String(req.query.range || '').trim();
      const month = String(req.query.month || '').trim();
      const categoryId = parseInt(req.query.categoryId, 10) || 0;
      const vendorTag = String(req.query.vendorTag || '').trim();
      let sql = 'SELECT t.* FROM finance_transactions t';
      const where = [];
      const params = [];

      if (status === 'uncategorized') {
        where.push('t.category_id IS NULL');
      } else if (status === 'categorized') {
        where.push('t.category_id IS NOT NULL');
      }
      if (range || month) {
        let window;
        try {
          window = resolveDateWindow(range, month);
        } catch (err) {
          return jsonError(res, err.message || 'Invalid date range');
        }
        where.push('t.txn_date >= ? AND t.txn_date <= ?');
        params.push(window.start, window.end);
      }
      if (categoryId > 0) {
        where.push('t.category_id = ?');
        params.push(categoryId);
      }
      if (vendorTag) {
        where.push('t.vendor_tag = ?');
        params.push(vendorTag);
      }
      if (where.length > 0) {
        sql += ` WHERE ${where.join(' AND ')}`;
      }
      sql += ' ORDER BY t.txn_date DESC, t.id DESC LIMIT 2000';
      const [rows] = await req.financeDb.execute(sql, params);
      jsonOk(res, { transactions: rows.map(transactionFromRow) });
    } catch (err) {
      jsonError(res, err.message || 'Failed to load transactions', 500);
    }
  });

  router.patch('/transactions/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (!id) return jsonError(res, 'Invalid transaction');

      const sets = [];
      const params = [];
      const body = req.body || {};

      if (body.flipAmount) {
        sets.push('amount = -amount', 'amount_manual = 1');
      } else if (body.amount != null && Number.isFinite(Number(body.amount))) {
        sets.push('amount = ?', 'amount_manual = 1');
        params.push(Number(body.amount));
      }

      // categoryId: number assigns; null clears (undo / restore to inbox).
      if (Object.prototype.hasOwnProperty.call(body, 'categoryId')) {
        if (body.categoryId === null || body.categoryId === '') {
          sets.push('category_id = NULL', 'categorized_at = NULL');
        } else {
          const categoryId = parseInt(body.categoryId, 10);
          if (!categoryId) return jsonError(res, 'Invalid category');
          const [cats] = await req.financeDb.execute(
            'SELECT id FROM finance_categories WHERE id = ? LIMIT 1',
            [categoryId]
          );
          if (!cats[0]) return jsonError(res, 'Category not found', 404);
          sets.push('category_id = ?', 'categorized_at = NOW()');
          params.push(categoryId);
        }
      }

      if (Object.prototype.hasOwnProperty.call(body, 'vendorTag')) {
        const vendorTag = String(body.vendorTag || '').trim();
        const allowed = FINANCE_VENDOR_TAGS.map((t) => t.slug);
        if (vendorTag === '') {
          sets.push('vendor_tag = NULL');
        } else if (!allowed.includes(vendorTag)) {
          return jsonError(res, 'Invalid vendorTag');
        } else {
          sets.push('vendor_tag = ?');
          params.push(vendorTag);
        }
      }

      if (sets.length === 0) return jsonError(res, 'Nothing to update');

      params.push(id);
      const [result] = await req.financeDb.execute(
        `UPDATE finance_transactions SET ${sets.join(', ')} WHERE id = ?`,
        params
      );
      if (result.affectedRows === 0) {
        const [existing] = await req.financeDb.execute(
          'SELECT id FROM finance_transactions WHERE id = ? LIMIT 1',
          [id]
        );
        if (!existing[0]) return jsonError(res, 'Transaction not found', 404);
      }
      const [rows] = await req.financeDb.execute('SELECT * FROM finance_transactions WHERE id = ?', [
        id,
      ]);
      jsonOk(res, { transaction: transactionFromRow(rows[0]) });
    } catch (err) {
      jsonError(res, err.message || 'Failed to update transaction', 500);
    }
  });

  router.get('/reports', async (req, res) => {
    try {
      const range = String(req.query.range || '').trim();
      const month = String(req.query.month || '').trim();
      let window;
      try {
        window = resolveDateWindow(range, month);
      } catch (err) {
        return jsonError(res, err.message || 'Invalid date range');
      }
      const [rows] = await req.financeDb.execute(
        `SELECT c.id, c.label, c.slug, c.report_group, c.exclude_from_reports,
                SUM(t.amount) AS total, COUNT(*) AS txn_count
         FROM finance_transactions t
         JOIN finance_categories c ON c.id = t.category_id
         WHERE t.category_id IS NOT NULL
           AND t.txn_date >= ? AND t.txn_date <= ?
         GROUP BY c.id, c.label, c.slug, c.report_group, c.exclude_from_reports
         ORDER BY c.report_group ASC, total DESC`,
        [window.start, window.end]
      );
      const spending = [];
      const moved = [];
      const income = [];
      const ignoredRows = [];
      let ignored = 0;
      for (const row of rows) {
        const entry = {
          categoryId: Number(row.id),
          label: row.label,
          slug: row.slug,
          total: Number(row.total),
          txnCount: Number(row.txn_count),
        };
        // Listed for review; not counted in spending totals.
        if (row.exclude_from_reports || row.report_group === 'ignore') {
          ignoredRows.push(entry);
          ignored += entry.total;
        } else if (row.report_group === 'moved') {
          // Investments — not counted as spend.
          moved.push(entry);
        } else if (row.report_group === 'income') {
          income.push(entry);
        } else {
          // Actual costs (groceries, rent, etc.).
          spending.push(entry);
        }
      }
      const spendingTotal = spending.reduce((s, r) => s + r.total, 0);
      const incomeTotal = income.reduce((s, r) => s + r.total, 0);
      const investedTotal = moved.reduce((s, r) => s + r.total, 0);
      for (const row of spending) {
        row.pct = spendingTotal > 0 ? Math.round((1000 * row.total) / spendingTotal) / 10 : 0;
      }

      // Vendor totals use spending categories only (not income / investments).
      const [vendorRows] = await req.financeDb.execute(
        `SELECT t.vendor_tag AS slug, SUM(t.amount) AS total, COUNT(*) AS txn_count
         ${SPENDING_JOIN}
           AND t.vendor_tag IS NOT NULL AND t.vendor_tag <> ''
           AND t.txn_date >= ? AND t.txn_date <= ?
         GROUP BY t.vendor_tag
         ORDER BY total DESC`,
        [window.start, window.end]
      );
      const labelBySlug = Object.fromEntries(FINANCE_VENDOR_TAGS.map((t) => [t.slug, t.label]));
      const vendors = vendorRows.map((row) => ({
        slug: row.slug,
        label: labelBySlug[row.slug] || row.slug,
        total: Number(row.total),
        txnCount: Number(row.txn_count),
      }));

      const series = await monthlySpendSeries(req.financeDb, window.start, window.end);

      let dailySpend = [];
      let priorDailySpend = [];
      let pace = null;
      if (window.range === 'month' && window.month) {
        const pacePack = await monthSpendPace(req.financeDb, window.month);
        if (pacePack) {
          dailySpend = pacePack.dailySpend;
          priorDailySpend = pacePack.priorDailySpend;
          pace = pacePack.pace;
        }
      }

      const topMerchantsByWindow = {};
      for (const n of [1, 6, 12]) {
        const w = lastNMonthsWindow(n);
        topMerchantsByWindow[String(n)] = await topMerchants(req.financeDb, w.start, w.end, 5);
      }
      const hotCategoriesByWindow = {};
      for (const n of [3, 6, 12]) {
        const w = lastNMonthsWindow(n);
        hotCategoriesByWindow[String(n)] = await hotCategories(req.financeDb, w.start, w.end, 3);
      }

      jsonOk(res, {
        range: window.range,
        month: window.month,
        start: window.start,
        end: window.end,
        label: window.label,
        spending,
        moved,
        income,
        ignored: ignoredRows,
        vendors,
        spendingTotal,
        incomeTotal,
        investedTotal,
        ignoredTotal: ignored,
        allocation: allocationSummary(spendingTotal, incomeTotal, investedTotal),
        monthlySpend: series.monthlySpend,
        avgMonthlySpend: series.avgMonthlySpend,
        monthBucketCount: series.monthBucketCount,
        dailySpend,
        priorDailySpend,
        pace,
        topMerchants: topMerchantsByWindow,
        hotCategories: hotCategoriesByWindow,
      });
    } catch (err) {
      jsonError(res, err.message || 'Failed to load report', 500);
    }
  });

  router.post('/export', async (req, res) => {
    try {
      const month = String(req.query.month || req.body?.month || '').trim();
      if (!/^\d{4}-\d{2}$/.test(month)) {
        return jsonError(res, 'month must be YYYY-MM');
      }
      const [rows] = await req.financeDb.execute(
        `SELECT t.id, t.txn_date, t.merchant_name, t.amount, c.label AS category_label
         FROM finance_transactions t
         JOIN finance_categories c ON c.id = t.category_id
         WHERE t.category_id IS NOT NULL
           AND t.exported_at IS NULL
           AND DATE_FORMAT(t.txn_date, '%Y-%m') = ?
         ORDER BY t.txn_date ASC, t.id ASC`,
        [month]
      );
      if (rows.length === 0) {
        return jsonError(res, 'No categorized transactions to export for that month', 404);
      }
      const csv = buildCsv(rows);
      const filename = `finance-${month}.csv`;
      let driveFileId = null;
      try {
        driveFileId = await uploadCsvToDrive(filename, csv);
      } catch (driveErr) {
        if (req.query.download !== '1') {
          return jsonError(res, driveErr.message || 'Drive upload failed', 500);
        }
      }
      const ids = rows.map((r) => r.id);
      await req.financeDb.query(
        `UPDATE finance_transactions SET exported_at = NOW() WHERE id IN (${ids.map(() => '?').join(',')})`,
        ids
      );
      if (req.query.download === '1' || !driveFileId) {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
        return undefined;
      }
      jsonOk(res, { filename, driveFileId, exported: rows.length });
    } catch (err) {
      jsonError(res, err.message || 'Export failed', 500);
    }
  });

  app.use('/api/finance', router);
}

module.exports = { registerFinanceRoutes };
