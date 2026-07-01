const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const RANKS = [
  { id: 'cantor', label: 'Cantor', minPP: 0 },
  { id: 'seminarian', label: 'Seminarian', minPP: 90 },
  { id: 'deacon', label: 'Deacon', minPP: 220 },
  { id: 'priest', label: 'Priest', minPP: 500 },
  { id: 'pope', label: 'Pope', minPP: 2000 },
];

let tablesReady = false;

function rankFromPoints(pp) {
  let current = RANKS[0];
  for (const rank of RANKS) {
    if (pp >= rank.minPP) current = rank;
  }
  return current;
}

function accountSessionId(accountId) {
  return `cec-acc-${accountId}`;
}

function worshiperFromRow(row) {
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
    rank: rankFromPoints(pp),
    completedActions: Array.isArray(completedActions) ? completedActions : [],
    actionLastDone: actionLastDone && typeof actionLastDone === 'object' ? actionLastDone : {},
    lastSpinDate: row.last_spin_date || null,
  };
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
  tablesReady = true;
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

  router.get('/names/check', async (req, res) => {
    try {
      const name = normalizeDisplayName(req.query.username || req.query.displayName || '');
      if (!name) return jsonError(res, 'Name is required');
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
      const row = await fetchAccountById(req.cecDb, accountId);
      const token = await issueSessionToken(req.cecDb, accountId);
      jsonOk(res, { token, worshiper: worshiperFromRow(row) });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return jsonError(res, 'Email or username is already in use', 409);
      }
      jsonError(res, error.message || 'Registration failed', error.status || 500);
    }
  });

  router.post('/auth/login', async (req, res) => {
    try {
      const email = normalizeEmail(req.body.email);
      const password = req.body.password || '';
      if (!validateEmail(email)) return jsonError(res, 'Valid email is required');
      if (!password) return jsonError(res, 'Password is required');

      const [rows] = await req.cecDb.execute('SELECT * FROM cec_accounts WHERE email = ? LIMIT 1', [
        email,
      ]);
      const row = rows[0];
      if (!row || !row.password_hash || !(await bcrypt.compare(password, row.password_hash))) {
        return jsonError(res, 'Invalid email or password', 401);
      }
      const token = await issueSessionToken(req.cecDb, row.id);
      jsonOk(res, { token, worshiper: worshiperFromRow(row) });
    } catch (error) {
      jsonError(res, error.message || 'Login failed', 500);
    }
  });

  router.get('/me', async (req, res) => {
    try {
      const row = await authenticateRequest(req.cecDb, req);
      if (!row) return jsonError(res, 'Not authenticated', 401);
      jsonOk(res, { worshiper: worshiperFromRow(row) });
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
        0,
        body.pontifexPoints != null ? parseInt(body.pontifexPoints, 10) || 0 : row.pontifex_points
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
             completed_actions = ?, action_last_done = ?, last_spin_date = ?
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
      jsonOk(res, { worshiper: worshiperFromRow(updated) });
    } catch (error) {
      jsonError(res, error.message || 'Failed to save account', 500);
    }
  });

  app.use('/api/cec', router);
}

module.exports = { registerCecAccountRoutes, rankFromPoints, worshiperFromRow };
