const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const RANKS = [
  { id: 'cantor', label: 'Cantor', minPP: 0 },
  { id: 'seminarian', label: 'Seminarian', minPP: 120 },
  { id: 'deacon', label: 'Deacon', minPP: 620 },
  { id: 'priest', label: 'Priest', minPP: 1150 },
  { id: 'pope', label: 'Pope', minPP: 3000 },
];

const POPE_MIN_PP = 3000;
const POPE_INACTIVITY_MONTHS = 3;

function rankFromPoints(pp) {
  let current = RANKS[0];
  for (const rank of RANKS) {
    if (pp >= rank.minPP) current = rank;
  }
  return current;
}

function effectiveRank(pp, accountId, reigningPope) {
  const base = rankFromPoints(pp);
  if (base.id !== 'pope') return base;
  if (!accountId) return RANKS.find((r) => r.id === 'priest');
  if (!reigningPope) return RANKS.find((r) => r.id === 'priest');
  if (reigningPope.accountId === accountId) return RANKS.find((r) => r.id === 'pope');
  return RANKS.find((r) => r.id === 'priest');
}

async function touchAccountActivity(connection, accountId) {
  await connection.execute('UPDATE cec_accounts SET last_active_at = NOW() WHERE id = ?', [
    accountId,
  ]);
}

async function getReigningPope(connection) {
  const [rows] = await connection.execute(
    `SELECT id, display_name, pontifex_points
     FROM cec_accounts
     WHERE email IS NOT NULL
       AND pontifex_points >= ?
       AND last_active_at >= DATE_SUB(NOW(), INTERVAL ? MONTH)
     ORDER BY pontifex_points DESC, id ASC
     LIMIT 1`,
    [POPE_MIN_PP, POPE_INACTIVITY_MONTHS]
  );
  if (!rows[0]) return null;
  return {
    accountId: Number(rows[0].id),
    displayName: rows[0].display_name,
    pontifexPoints: Number(rows[0].pontifex_points) || 0,
  };
}

function accountSessionId(accountId) {
  return `cec-acc-${accountId}`;
}

function worshiperFromRow(row, reigningPope = null) {
  let completedActions = row.completed_actions;
  let actionLastDone = row.action_last_done;
  if (typeof completedActions === 'string') {
    try {
      completedActions = JSON.parse(completedActions);
    } catch {
      completedActions = [];
    }
  }
  if (typeof actionLastDone === 'string') {
    try {
      actionLastDone = JSON.parse(actionLastDone);
    } catch {
      actionLastDone = {};
    }
  }
  const pp = Number(row.pontifex_points) || 0;
  return {
    accountId: Number(row.id),
    sessionId: accountSessionId(row.id),
    displayName: row.display_name,
    avatarId: row.avatar_id,
    pontifexPoints: pp,
    rank: effectiveRank(pp, Number(row.id), reigningPope),
    completedActions: Array.isArray(completedActions) ? completedActions : [],
    actionLastDone: actionLastDone && typeof actionLastDone === 'object' ? actionLastDone : {},
    lastSpinDate: row.last_spin_date || null,
  };
}

let tablesReady = false;

function isLocalDevCec() {
  return process.env.NODE_ENV !== 'production';
}

const DEV_LOGIN_USERNAME = 'citlali';
const DEV_LOGIN_EMAIL = 'citlali@localhost.dev';

async function ensureDevCitlaliAccount(connection) {
  if (!isLocalDevCec()) return null;
  const [rows] = await connection.execute(
    `SELECT * FROM cec_accounts WHERE display_name = ? AND email IS NOT NULL LIMIT 1`,
    [DEV_LOGIN_USERNAME]
  );
  if (rows[0]) {
    await touchAccountActivity(connection, rows[0].id);
    return fetchAccountById(connection, rows[0].id);
  }

  const passwordHash = await bcrypt.hash('dev-local-only', 10);
  const [result] = await connection.execute(
    `INSERT INTO cec_accounts (email, password_hash, display_name, avatar_id, pontifex_points, completed_actions, action_last_done, last_active_at)
     VALUES (?, ?, ?, 'frog', 0, '[]', '{}', NOW())`,
    [DEV_LOGIN_EMAIL, passwordHash, DEV_LOGIN_USERNAME]
  );
  return fetchAccountById(connection, result.insertId);
}

function normalizeLoginId(raw) {
  return String(raw || '').trim().toLowerCase();
}

async function ensureCecAccountTables(connection) {
  if (tablesReady) return;
  const schemaPath = path.join(__dirname, 'schema-cec-accounts.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith('--'));
  for (const stmt of statements) {
    await connection.query(stmt);
  }
  try {
    await connection.query('ALTER TABLE cec_accounts MODIFY email VARCHAR(255) NULL');
    await connection.query('ALTER TABLE cec_accounts MODIFY password_hash VARCHAR(255) NULL');
  } catch {
    /* already migrated */
  }
  try {
    await connection.query(
      'ALTER TABLE cec_accounts ADD UNIQUE KEY uk_cec_display_name (display_name)'
    );
  } catch {
    /* already exists */
  }
  try {
    await connection.query(
      'ALTER TABLE cec_accounts ADD COLUMN last_active_at DATETIME NULL AFTER last_spin_date'
    );
  } catch {
    /* already migrated */
  }
  try {
    await connection.query(
      'UPDATE cec_accounts SET last_active_at = COALESCE(updated_at, created_at) WHERE last_active_at IS NULL'
    );
  } catch {
    /* ignore */
  }
  tablesReady = true;
  if (isLocalDevCec()) {
    await ensureDevCitlaliAccount(connection);
  }
}

function normalizeDisplayName(displayName) {
  return String(displayName || '')
    .trim()
    .slice(0, 24);
}

async function displayNameTaken(connection, displayName, exceptAccountId = null) {
  const name = normalizeDisplayName(displayName);
  if (!name) return false;
  if (exceptAccountId) {
    const [rows] = await connection.execute(
      'SELECT id FROM cec_accounts WHERE display_name = ? AND email IS NOT NULL AND id != ? LIMIT 1',
      [name, exceptAccountId]
    );
    return rows.length > 0;
  }
  const [rows] = await connection.execute(
    'SELECT id FROM cec_accounts WHERE display_name = ? AND email IS NOT NULL LIMIT 1',
    [name]
  );
  return rows.length > 0;
}

function jsonOk(res, data = {}) {
  res.json({ success: true, ...data });
}

function jsonError(res, message, status = 400) {
  res.status(status).json({ success: false, error: message });
}

function normalizeEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  return typeof password === 'string' && password.length >= 8;
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function issueSessionToken(connection, accountId) {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expires = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  await connection.execute(
    'INSERT INTO cec_account_sessions (account_id, token_hash, expires_at) VALUES (?, ?, ?)',
    [accountId, tokenHash, expires]
  );
  return token;
}

async function authenticateRequest(connection, req) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(\S+)$/i);
  if (!match) return null;
  const tokenHash = hashToken(match[1]);
  const now = new Date();
  const [rows] = await connection.execute(
    `SELECT a.* FROM cec_account_sessions s
     JOIN cec_accounts a ON a.id = s.account_id
     WHERE s.token_hash = ? AND s.expires_at > ?
     LIMIT 1`,
    [tokenHash, now]
  );
  return rows[0] || null;
}

async function fetchAccountById(connection, accountId) {
  const [rows] = await connection.execute('SELECT * FROM cec_accounts WHERE id = ? LIMIT 1', [
    accountId,
  ]);
  if (!rows[0]) {
    const err = new Error('Account not found');
    err.status = 404;
    throw err;
  }
  return rows[0];
}

function registerCecAccountRoutes(app, getConnection) {
  const router = express.Router();

  router.use(async (req, res, next) => {
    let connection;
    try {
      connection = await getConnection();
      await ensureCecAccountTables(connection);
      req.cecDb = connection;
      res.on('finish', () => {
        connection.end().catch(() => {});
      });
      next();
    } catch (error) {
      if (connection) await connection.end().catch(() => {});
      jsonError(res, error.message || 'Database error', 500);
    }
  });

  router.get('/pope', async (req, res) => {
    try {
      const reigningPope = await getReigningPope(req.cecDb);
      jsonOk(res, { reigningPope });
    } catch (error) {
      jsonError(res, error.message || 'Failed to load pope', 500);
    }
  });

  router.get('/names/check', async (req, res) => {
    try {
      const name = normalizeDisplayName(req.query.username || req.query.displayName || '');
      if (!name) return jsonError(res, 'Name is required');
      if (isLocalDevCec() && normalizeLoginId(name) === DEV_LOGIN_USERNAME) {
        jsonOk(res, { available: true, taken: false });
        return;
      }
      const taken = await displayNameTaken(req.cecDb, name);
      jsonOk(res, { available: !taken, taken });
    } catch (error) {
      jsonError(res, error.message || 'Name check failed', 500);
    }
  });

  router.post('/auth/register', async (req, res) => {
    try {
      const email = normalizeEmail(req.body.email);
      const password = req.body.password || '';
      let displayName = normalizeDisplayName(req.body.username || req.body.displayName || '');
      const avatarId = String(req.body.avatarId || 'frog').trim();

      if (!validateEmail(email)) return jsonError(res, 'Valid email is required');
      if (!validatePassword(password)) {
        return jsonError(res, 'Password must be at least 8 characters');
      }
      if (!displayName) return jsonError(res, 'Username is required');
      if (await displayNameTaken(req.cecDb, displayName)) {
        return jsonError(res, 'That username is already taken — try another', 409);
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const [result] = await req.cecDb.execute(
        `INSERT INTO cec_accounts (email, password_hash, display_name, avatar_id, pontifex_points, completed_actions, action_last_done)
         VALUES (?, ?, ?, ?, 0, '[]', '{}')`,
        [email, passwordHash, displayName, avatarId]
      );
      const accountId = result.insertId;
      await touchAccountActivity(req.cecDb, accountId);
      const row = await fetchAccountById(req.cecDb, accountId);
      const token = await issueSessionToken(req.cecDb, accountId);
      const reigningPope = await getReigningPope(req.cecDb);
      jsonOk(res, { token, worshiper: worshiperFromRow(row, reigningPope), reigningPope });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return jsonError(res, 'Email or username is already in use', 409);
      }
      jsonError(res, error.message || 'Registration failed', error.status || 500);
    }
  });

  router.post('/auth/login', async (req, res) => {
    try {
      const loginId = normalizeLoginId(req.body.email || req.body.username);
      const password = req.body.password || '';

      if (isLocalDevCec() && loginId === DEV_LOGIN_USERNAME) {
        const row = await ensureDevCitlaliAccount(req.cecDb);
        if (!row) return jsonError(res, 'Dev account setup failed', 500);
        const token = await issueSessionToken(req.cecDb, row.id);
        const fresh = await fetchAccountById(req.cecDb, row.id);
        const reigningPope = await getReigningPope(req.cecDb);
        jsonOk(res, { token, worshiper: worshiperFromRow(fresh, reigningPope), reigningPope });
        return;
      }

      const email = normalizeEmail(req.body.email);
      if (!validateEmail(email)) return jsonError(res, 'Valid email is required');
      if (!password) return jsonError(res, 'Password is required');

      const [rows] = await req.cecDb.execute('SELECT * FROM cec_accounts WHERE email = ? LIMIT 1', [
        email,
      ]);
      const row = rows[0];
      if (!row || !row.password_hash || !(await bcrypt.compare(password, row.password_hash))) {
        return jsonError(res, 'Invalid email or password', 401);
      }
      await touchAccountActivity(req.cecDb, row.id);
      const fresh = await fetchAccountById(req.cecDb, row.id);
      const token = await issueSessionToken(req.cecDb, row.id);
      const reigningPope = await getReigningPope(req.cecDb);
      jsonOk(res, { token, worshiper: worshiperFromRow(fresh, reigningPope), reigningPope });
    } catch (error) {
      jsonError(res, error.message || 'Login failed', 500);
    }
  });

  router.get('/me', async (req, res) => {
    try {
      const row = await authenticateRequest(req.cecDb, req);
      if (!row) return jsonError(res, 'Not authenticated', 401);
      await touchAccountActivity(req.cecDb, row.id);
      const fresh = await fetchAccountById(req.cecDb, row.id);
      const reigningPope = await getReigningPope(req.cecDb);
      jsonOk(res, { worshiper: worshiperFromRow(fresh, reigningPope), reigningPope });
    } catch (error) {
      jsonError(res, error.message || 'Failed to load account', 500);
    }
  });

  router.patch('/me', async (req, res) => {
    try {
      const row = await authenticateRequest(req.cecDb, req);
      if (!row) return jsonError(res, 'Not authenticated', 401);

      const body = req.body || {};
      const displayName = (
        body.displayName != null ? String(body.displayName).trim() : row.display_name
      ).slice(0, 24);
      const avatarId = body.avatarId != null ? String(body.avatarId).trim() : row.avatar_id;
      const pontifexPoints = Math.max(
        Number(row.pontifex_points) || 0,
        body.pontifexPoints != null ? parseInt(body.pontifexPoints, 10) || 0 : Number(row.pontifex_points) || 0
      );
      const completedActions = JSON.stringify(
        body.completedActions != null ? body.completedActions : JSON.parse(row.completed_actions || '[]')
      );
      const actionLastDone = JSON.stringify(
        body.actionLastDone != null ? body.actionLastDone : JSON.parse(row.action_last_done || '{}')
      );
      const lastSpinDate = body.lastSpinDate !== undefined ? body.lastSpinDate || null : row.last_spin_date;

      await req.cecDb.execute(
        `UPDATE cec_accounts
         SET display_name = ?, avatar_id = ?, pontifex_points = ?,
             completed_actions = ?, action_last_done = ?, last_spin_date = ?,
             last_active_at = NOW()
         WHERE id = ?`,
        [
          displayName,
          avatarId,
          pontifexPoints,
          completedActions,
          actionLastDone,
          lastSpinDate,
          row.id,
        ]
      );
      const updated = await fetchAccountById(req.cecDb, row.id);
      const reigningPope = await getReigningPope(req.cecDb);
      jsonOk(res, { worshiper: worshiperFromRow(updated, reigningPope), reigningPope });
    } catch (error) {
      jsonError(res, error.message || 'Failed to save account', 500);
    }
  });

  app.use('/api/cec', router);
}

module.exports = { registerCecAccountRoutes, rankFromPoints, effectiveRank, worshiperFromRow };
