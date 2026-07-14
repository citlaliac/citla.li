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

async function issueSessionToken(connection) {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expires = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  await connection.execute(
    'INSERT INTO finance_sessions (token_hash, expires_at) VALUES (?, ?)',
    [tokenHash, expires]
  );
  return token;
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
      const token = await issueSessionToken(req.financeDb);
      jsonOk(res, { token });
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

      if (body.categoryId != null) {
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
          moved.push(entry);
        } else if (row.report_group === 'income') {
          income.push(entry);
        } else {
          spending.push(entry);
        }
      }
      const spendingTotal = spending.reduce((s, r) => s + r.total, 0);
      const incomeTotal = income.reduce((s, r) => s + r.total, 0);

      const [vendorRows] = await req.financeDb.execute(
        `SELECT vendor_tag AS slug, SUM(amount) AS total, COUNT(*) AS txn_count
         FROM finance_transactions
         WHERE category_id IS NOT NULL
           AND vendor_tag IS NOT NULL AND vendor_tag <> ''
           AND txn_date >= ? AND txn_date <= ?
         GROUP BY vendor_tag
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
        ignoredTotal: ignored,
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
