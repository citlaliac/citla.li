/**
 * Development/Express parity for Catholic e Cloud congregations and rewards.
 * Production uses cec-factions.php; keep constants and behavior aligned.
 */

const FACTION_MIN_PP = 3000;
const SWITCH_MS = 48 * 60 * 60 * 1000;
const FREEZE_MS = 5 * 24 * 60 * 60 * 1000;
const COOLDOWN_MS = 60 * 60 * 1000;
const DEBUFF_MS = 48 * 60 * 60 * 1000;

const REWARDS = {
  incense: 32,
  fish_fry: 36,
  rosary: 48,
  vatican: 42,
  aspergillum: 30,
  st_jude: 34,
  candle: 32,
  bulletin_post: 46,
};

function parseJson(value, fallback) {
  if (value && typeof value === 'object') return value;
  try {
    return JSON.parse(value || '');
  } catch {
    return fallback;
  }
}

/** Active congregation size lowers risk, with a five-percent floor. */
function smiteChancePercent(factionSize, active = true) {
  if (!active) return 30;
  return Math.max(5, Math.round(30 / Math.sqrt(Math.max(1, Number(factionSize) || 1))));
}

/** Smite loss is five percent with a 10 PP minimum and 150 PP cap. */
function smiteLoss(pontifexPoints) {
  const pp = Math.max(0, Number(pontifexPoints) || 0);
  if (pp === 0) return 0;
  return Math.min(pp, Math.min(150, Math.max(10, Math.round(pp * 0.05))));
}

async function getMembership(db, accountId) {
  const [rows] = await db.execute(
    `SELECT m.*, a.display_name AS sponsor_name, f.display_name AS founder_name,
            cf.status AS faction_status, cf.frozen_at
     FROM cec_faction_memberships m
     LEFT JOIN cec_accounts a ON a.id = m.sponsor_account_id
     JOIN cec_accounts f ON f.id = m.faction_founder_id
     JOIN cec_factions cf ON cf.founder_account_id = m.faction_founder_id
     WHERE m.account_id = ? LIMIT 1`,
    [accountId]
  );
  return rows[0] || null;
}

async function collectSubtreeIds(db, accountId) {
  const seen = new Set([Number(accountId)]);
  const queue = [Number(accountId)];
  while (queue.length) {
    const parent = queue.shift();
    const [rows] = await db.execute(
      'SELECT account_id FROM cec_faction_memberships WHERE sponsor_account_id = ?',
      [parent]
    );
    for (const row of rows) {
      const child = Number(row.account_id);
      if (!seen.has(child)) {
        seen.add(child);
        queue.push(child);
      }
    }
  }
  return [...seen];
}

async function reconcileFaction(db, founderId) {
  const [rows] = await db.execute(
    `SELECT cf.*, a.pontifex_points
     FROM cec_factions cf
     JOIN cec_accounts a ON a.id = cf.founder_account_id
     WHERE cf.founder_account_id = ? LIMIT 1`,
    [founderId]
  );
  const faction = rows[0];
  if (!faction) return null;
  const pp = Number(faction.pontifex_points) || 0;
  if (pp >= FACTION_MIN_PP) {
    if (faction.status !== 'active') {
      await db.execute(
        "UPDATE cec_factions SET status = 'active', frozen_at = NULL WHERE founder_account_id = ?",
        [founderId]
      );
    }
    return { status: 'active', founderAccountId: Number(founderId) };
  }

  if (faction.status === 'active' || !faction.frozen_at) {
    await db.execute(
      "UPDATE cec_factions SET status = 'frozen', frozen_at = NOW() WHERE founder_account_id = ?",
      [founderId]
    );
    return { status: 'frozen', founderAccountId: Number(founderId) };
  }
  if (Date.now() < new Date(faction.frozen_at).getTime() + FREEZE_MS) {
    return { status: 'frozen', founderAccountId: Number(founderId) };
  }

  const [successors] = await db.execute(
    `SELECT a.id
     FROM cec_faction_memberships m
     JOIN cec_accounts a ON a.id = m.account_id
     WHERE m.sponsor_account_id = ? AND a.pontifex_points >= ?
     ORDER BY a.pontifex_points DESC, a.id ASC LIMIT 1`,
    [founderId, FACTION_MIN_PP]
  );
  const successor = successors[0] && Number(successors[0].id);
  await db.beginTransaction();
  try {
    if (successor) {
      await db.execute(
        `INSERT INTO cec_factions (founder_account_id, status, frozen_at)
         VALUES (?, 'active', NULL)
         ON DUPLICATE KEY UPDATE status = 'active', frozen_at = NULL`,
        [successor]
      );
      await db.execute(
        'UPDATE cec_faction_memberships SET sponsor_account_id = NULL WHERE account_id = ?',
        [successor]
      );
      await db.execute(
        'UPDATE cec_faction_memberships SET sponsor_account_id = ? WHERE account_id = ?',
        [successor, founderId]
      );
      await db.execute(
        `UPDATE cec_faction_memberships SET faction_founder_id = ?
         WHERE faction_founder_id = ?`,
        [successor, founderId]
      );
      await db.execute('DELETE FROM cec_factions WHERE founder_account_id = ?', [founderId]);
      await db.commit();
      return {
        status: 'active',
        founderAccountId: successor,
        succeededFounderAccountId: Number(founderId),
      };
    }
    await db.execute(
      'DELETE FROM cec_faction_memberships WHERE faction_founder_id = ?',
      [founderId]
    );
    await db.execute('DELETE FROM cec_factions WHERE founder_account_id = ?', [founderId]);
    await db.commit();
    return { status: 'dissolved', founderAccountId: Number(founderId) };
  } catch (error) {
    await db.rollback();
    throw error;
  }
}

async function factionSummary(db, accountId) {
  let membership = await getMembership(db, accountId);
  if (!membership) {
    const [rows] = await db.execute(
      'SELECT display_name, pontifex_points FROM cec_accounts WHERE id = ? LIMIT 1',
      [accountId]
    );
    return {
      joined: false,
      canFound: (Number(rows[0]?.pontifex_points) || 0) >= FACTION_MIN_PP,
      recruitmentCode: rows[0]?.display_name || '',
    };
  }

  const lifecycle = await reconcileFaction(db, Number(membership.faction_founder_id));
  if (lifecycle?.status === 'dissolved') return factionSummary(db, accountId);
  membership = await getMembership(db, accountId);
  if (!membership) return factionSummary(db, accountId);

  const root = Number(membership.faction_founder_id);
  const [[directRow]] = await db.execute(
    'SELECT COUNT(*) AS c FROM cec_faction_memberships WHERE sponsor_account_id = ?',
    [accountId]
  );
  const [[sizeRow]] = await db.execute(
    'SELECT COUNT(*) AS c FROM cec_faction_memberships WHERE faction_founder_id = ?',
    [root]
  );
  const [[self]] = await db.execute(
    'SELECT display_name, pontifex_points FROM cec_accounts WHERE id = ? LIMIT 1',
    [accountId]
  );
  const subtree = await collectSubtreeIds(db, accountId);
  const lastSwitch = membership.switched_at || membership.joined_at;
  const canSwitchAt = new Date(new Date(lastSwitch).getTime() + SWITCH_MS);
  const status = membership.faction_status;
  const factionSize = Number(sizeRow.c) || 1;
  const protectedSize = status === 'active' ? factionSize : 1;
  return {
    joined: true,
    isFounder: Number(accountId) === root,
    canFound:
      Number(accountId) !== root &&
      (Number(self?.pontifex_points) || 0) >= FACTION_MIN_PP &&
      Date.now() >= canSwitchAt.getTime(),
    status,
    sponsor: membership.sponsor_account_id
      ? {
          accountId: Number(membership.sponsor_account_id),
          displayName: membership.sponsor_name,
        }
      : null,
    founder: { accountId: root, displayName: membership.founder_name },
    directFollowers: Number(directRow.c) || 0,
    descendantFollowers: Math.max(0, subtree.length - 1),
    factionSize,
    smiteChancePercent: smiteChancePercent(protectedSize, status === 'active'),
    canSwitchAt: canSwitchAt.toISOString(),
    canSwitch: Date.now() >= canSwitchAt.getTime() && Number(accountId) !== root,
    frozenUntil: membership.frozen_at
      ? new Date(new Date(membership.frozen_at).getTime() + FREEZE_MS).toISOString()
      : null,
    recruitmentCode: self?.display_name || '',
  };
}

async function previewSponsor(db, code) {
  const name = String(code || '').trim().slice(0, 24);
  const [rows] = await db.execute(
    `SELECT a.id, a.display_name, m.faction_founder_id, f.display_name AS founder_name,
            cf.status
     FROM cec_accounts a
     JOIN cec_faction_memberships m ON m.account_id = a.id
     JOIN cec_accounts f ON f.id = m.faction_founder_id
     JOIN cec_factions cf ON cf.founder_account_id = m.faction_founder_id
     WHERE LOWER(a.display_name) = LOWER(?) AND a.email IS NOT NULL LIMIT 1`,
    [name]
  );
  const row = rows[0];
  return row
    ? {
        accountId: Number(row.id),
        displayName: row.display_name,
        founderAccountId: Number(row.faction_founder_id),
        founderName: row.founder_name,
        status: row.status,
      }
    : null;
}

async function foundFaction(db, accountId) {
  const [[account]] = await db.execute(
    'SELECT pontifex_points FROM cec_accounts WHERE id = ? LIMIT 1',
    [accountId]
  );
  if (!account || Number(account.pontifex_points) < FACTION_MIN_PP) {
    throw new Error('You need 3,000 PP to found a congregation.');
  }
  const current = await getMembership(db, accountId);
  if (current && Number(current.faction_founder_id) === Number(accountId)) {
    throw new Error('You already lead a congregation.');
  }
  if (current) {
    const last = current.switched_at || current.joined_at;
    if (Date.now() < new Date(last).getTime() + SWITCH_MS) {
      throw new Error('You can branch into a new congregation after the 48-hour switch wait.');
    }
  }
  const subtree = current ? await collectSubtreeIds(db, accountId) : [Number(accountId)];
  await db.beginTransaction();
  try {
    const [[lockedAccount]] = await db.execute(
      'SELECT pontifex_points FROM cec_accounts WHERE id = ? FOR UPDATE',
      [accountId]
    );
    if (!lockedAccount || Number(lockedAccount.pontifex_points) < FACTION_MIN_PP) {
      throw new Error('You need 3,000 PP to found a congregation.');
    }
    await db.execute(
      "INSERT INTO cec_factions (founder_account_id, status) VALUES (?, 'active')",
      [accountId]
    );
    if (current) {
      await db.execute(
        `UPDATE cec_faction_memberships
         SET sponsor_account_id = NULL, faction_founder_id = ?, switched_at = NOW()
         WHERE account_id = ?`,
        [accountId, accountId]
      );
      for (const id of subtree) {
        await db.execute(
          'UPDATE cec_faction_memberships SET faction_founder_id = ? WHERE account_id = ?',
          [accountId, id]
        );
      }
    } else {
      await db.execute(
        `INSERT INTO cec_faction_memberships
           (account_id, sponsor_account_id, faction_founder_id, joined_at, switched_at)
         VALUES (?, NULL, ?, NOW(), NOW())`,
        [accountId, accountId]
      );
    }
    await db.commit();
  } catch (error) {
    await db.rollback();
    throw error;
  }
  return factionSummary(db, accountId);
}

async function joinFaction(db, accountId, code) {
  const target = await previewSponsor(db, code);
  if (!target) throw new Error('No active congregation member has that character name.');
  if (target.status !== 'active') {
    throw new Error('That congregation is frozen and cannot accept members.');
  }
  if (target.accountId === Number(accountId)) throw new Error('You cannot sponsor yourself.');
  const current = await getMembership(db, accountId);
  if (current && Number(current.faction_founder_id) === Number(accountId)) {
    throw new Error('A congregation founder cannot join another congregation.');
  }
  if (current) {
    const last = current.switched_at || current.joined_at;
    if (Date.now() < new Date(last).getTime() + SWITCH_MS) {
      throw new Error('You can change congregations once every 48 hours.');
    }
  }
  const subtree = current ? await collectSubtreeIds(db, accountId) : [Number(accountId)];
  if (subtree.includes(target.accountId)) {
    throw new Error('You cannot join one of your own followers.');
  }

  await db.beginTransaction();
  try {
    // Recheck under lock so competing move requests cannot bypass the cooldown.
    const [[lockedCurrent]] = await db.execute(
      `SELECT joined_at, switched_at FROM cec_faction_memberships
       WHERE account_id = ? FOR UPDATE`,
      [accountId]
    );
    if (lockedCurrent) {
      const lockedLast = lockedCurrent.switched_at || lockedCurrent.joined_at;
      if (Date.now() < new Date(lockedLast).getTime() + SWITCH_MS) {
        throw new Error('You can change congregations once every 48 hours.');
      }
    }
    if (current) {
      await db.execute(
        `UPDATE cec_faction_memberships
         SET sponsor_account_id = ?, faction_founder_id = ?, switched_at = NOW()
         WHERE account_id = ?`,
        [target.accountId, target.founderAccountId, accountId]
      );
      for (const id of subtree) {
        await db.execute(
          'UPDATE cec_faction_memberships SET faction_founder_id = ? WHERE account_id = ?',
          [target.founderAccountId, id]
        );
      }
    } else {
      await db.execute(
        `INSERT INTO cec_faction_memberships
           (account_id, sponsor_account_id, faction_founder_id, joined_at, switched_at)
         VALUES (?, ?, ?, NOW(), NOW())`,
        [accountId, target.accountId, target.founderAccountId]
      );
    }
    await db.commit();
  } catch (error) {
    await db.rollback();
    throw error;
  }
  return factionSummary(db, accountId);
}

async function creditMilli(db, eventKey, actorId, beneficiaryId, milli) {
  if (milli <= 0) return 0;
  const [[row]] = await db.execute(
    'SELECT pp_milli_remainder FROM cec_accounts WHERE id = ? FOR UPDATE',
    [beneficiaryId]
  );
  if (!row) return 0;
  const total = (Number(row.pp_milli_remainder) || 0) + milli;
  const whole = Math.floor(total / 1000);
  const remainder = total % 1000;
  await db.execute(
    `UPDATE cec_accounts
     SET pontifex_points = pontifex_points + ?, pp_milli_remainder = ?
     WHERE id = ?`,
    [whole, remainder, beneficiaryId]
  );
  await db.execute(
    `INSERT IGNORE INTO cec_pp_events
       (event_key, actor_account_id, beneficiary_account_id, event_type, base_pp, awarded_pp, metadata_json)
     VALUES (?, ?, ?, 'trickle', 0, ?, ?)`,
    [eventKey, actorId, beneficiaryId, whole, JSON.stringify({ milliPP: milli })]
  );
  return whole;
}

async function applyTrickle(db, actorId, awarded, eventKey) {
  const membership = await getMembership(db, actorId);
  if (!membership || membership.faction_status !== 'active' || !membership.sponsor_account_id) {
    return [];
  }
  const root = Number(membership.faction_founder_id);
  let current = Number(membership.sponsor_account_id);
  let remaining = Math.max(0, awarded * 100);
  const seen = new Set([Number(actorId)]);
  const payouts = [];
  let depth = 0;
  while (current && current !== root && remaining > 0 && !seen.has(current) && depth < 50) {
    seen.add(current);
    const share = Math.ceil(remaining / 2);
    remaining -= share;
    const whole = await creditMilli(
      db,
      `${eventKey}:trickle:${current}`,
      actorId,
      current,
      share
    );
    payouts.push({ accountId: current, milliPP: share, awardedPP: whole });
    const [[parent]] = await db.execute(
      'SELECT sponsor_account_id FROM cec_faction_memberships WHERE account_id = ? LIMIT 1',
      [current]
    );
    current = parent?.sponsor_account_id ? Number(parent.sponsor_account_id) : root;
    depth += 1;
  }
  if (remaining > 0 && !seen.has(root)) {
    const whole = await creditMilli(
      db,
      `${eventKey}:trickle:${root}`,
      actorId,
      root,
      remaining
    );
    payouts.push({ accountId: root, milliPP: remaining, awardedPP: whole });
  }
  return payouts;
}

function nextSmiteDate() {
  const days = 3 + Math.floor(Math.random() * 5);
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function resolveDueSmite(db, accountId) {
  await db.beginTransaction();
  let loss = 0;
  let chance = 30;
  let debuffUntil = null;
  try {
    // Serialize by account so simultaneous requests cannot apply the same due smite twice.
    const [[account]] = await db.execute(
      'SELECT pontifex_points, next_smite_at FROM cec_accounts WHERE id = ? FOR UPDATE',
      [accountId]
    );
    if (!account) {
      await db.rollback();
      return null;
    }
    if (!account.next_smite_at) {
      await db.execute('UPDATE cec_accounts SET next_smite_at = ? WHERE id = ?', [
        nextSmiteDate(),
        accountId,
      ]);
      await db.commit();
      return null;
    }
    if (new Date(account.next_smite_at).getTime() > Date.now()) {
      await db.commit();
      return null;
    }

    const [[membership]] = await db.execute(
      `SELECT m.faction_founder_id, f.status
       FROM cec_faction_memberships m
       JOIN cec_factions f ON f.founder_account_id = m.faction_founder_id
       WHERE m.account_id = ? LIMIT 1`,
      [accountId]
    );
    if (membership?.status === 'active') {
      const [[sizeRow]] = await db.execute(
        'SELECT COUNT(*) AS c FROM cec_faction_memberships WHERE faction_founder_id = ?',
        [membership.faction_founder_id]
      );
      chance = smiteChancePercent(sizeRow.c);
    }
    const roll = 1 + Math.floor(Math.random() * 100);
    await db.execute('UPDATE cec_accounts SET next_smite_at = ? WHERE id = ?', [
      nextSmiteDate(),
      accountId,
    ]);
    if (roll > chance) {
      await db.commit();
      return { smote: false, chancePercent: chance };
    }

    const pp = Number(account.pontifex_points) || 0;
    loss = smiteLoss(pp);
    debuffUntil = new Date(Date.now() + DEBUFF_MS);
    const eventKey = `smite:${accountId}:${new Date().toISOString().slice(0, 13)}`;
    await db.execute(
      `UPDATE cec_accounts
       SET pontifex_points = GREATEST(0, pontifex_points - ?), debuff_until = ?
       WHERE id = ?`,
      [loss, debuffUntil, accountId]
    );
    await db.execute(
      `INSERT IGNORE INTO cec_pp_events
         (event_key, actor_account_id, beneficiary_account_id, event_type, base_pp, awarded_pp, metadata_json)
       VALUES (?, ?, ?, 'smite', 0, ?, ?)`,
      [eventKey, accountId, accountId, -loss, JSON.stringify({ chancePercent: chance, roll })]
    );
    await db.commit();
  } catch (error) {
    await db.rollback();
    throw error;
  }
  const membership = await getMembership(db, accountId);
  if (membership && Number(membership.faction_founder_id) === Number(accountId)) {
    await reconcileFaction(db, accountId);
  }
  return {
    smote: true,
    lostPP: loss,
    chancePercent: chance,
    debuffUntil: debuffUntil.toISOString(),
  };
}

async function claimReward(db, accountId, rewardType, actionId = '') {
  let key = '';
  let base = 0;
  if (rewardType === 'action' && REWARDS[actionId] != null) {
    key = actionId;
    base = REWARDS[actionId];
  } else if (
    rewardType === 'amen' &&
    REWARDS[actionId] != null &&
    actionId !== 'bulletin_post'
  ) {
    key = `amen_${actionId}`;
    base = 31;
  } else if (rewardType === 'communion') {
    key = 'portrait_communion_cycle';
  } else {
    throw new Error('Unknown reward.');
  }

  await db.beginTransaction();
  try {
    const [[account]] = await db.execute(
      'SELECT * FROM cec_accounts WHERE id = ? FOR UPDATE',
      [accountId]
    );
    if (!account) throw new Error('Account not found.');
    const lastDone = parseJson(account.action_last_done, {});
    const now = Date.now();
    let rewardKind = rewardType;
    if (rewardType === 'communion') {
      const cycleStart = Number(lastDone.portrait_communion_cycle) || 0;
      const expired = !cycleStart || now - cycleStart >= COOLDOWN_MS;
      const step = expired ? 0 : Number(lastDone.portrait_communion_step) || 0;
      if (step >= 2) {
        await db.rollback();
        return { awarded: 0, rewardKind: 'stuffed', trickle: [] };
      }
      base = step === 0 ? 24 : 28;
      lastDone.portrait_communion_cycle = expired ? now : cycleStart;
      lastDone.portrait_communion_step = step + 1;
      rewardKind = step === 0 ? 'blood' : 'body';
    } else {
      const last = Number(lastDone[key]) || 0;
      if (last && now - last < COOLDOWN_MS) {
        await db.rollback();
        return { awarded: 0, rewardKind: rewardType, trickle: [] };
      }
      lastDone[key] = now;
    }
    const debuffed = account.debuff_until && new Date(account.debuff_until).getTime() > Date.now();
    const awarded = debuffed ? Math.max(1, Math.floor(base * 0.8)) : base;
    const eventKey = `reward:${accountId}:${key}:${now}`;
    await db.execute(
      `UPDATE cec_accounts
       SET pontifex_points = pontifex_points + ?, action_last_done = ?, last_active_at = NOW()
       WHERE id = ?`,
      [awarded, JSON.stringify(lastDone), accountId]
    );
    await db.execute(
      `INSERT INTO cec_pp_events
         (event_key, actor_account_id, beneficiary_account_id, event_type, base_pp, awarded_pp, metadata_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        eventKey,
        accountId,
        accountId,
        rewardType,
        base,
        awarded,
        JSON.stringify({ debuffed: !!debuffed, actionId }),
      ]
    );
    const trickle = await applyTrickle(db, accountId, awarded, eventKey);
    await db.commit();
    return { awarded, basePP: base, debuffed: !!debuffed, rewardKind, trickle };
  } catch (error) {
    await db.rollback();
    throw error;
  }
}

module.exports = {
  FACTION_MIN_PP,
  factionSummary,
  previewSponsor,
  foundFaction,
  joinFaction,
  resolveDueSmite,
  claimReward,
  smiteChancePercent,
  smiteLoss,
};
