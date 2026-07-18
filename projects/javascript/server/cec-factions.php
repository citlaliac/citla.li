<?php
/**
 * Catholic e Cloud congregations, authoritative PP rewards, and lazy smiting.
 *
 * All mutations are additive and account-ID based. Existing account rows and
 * Pontifex Points are never recreated by this module.
 */

const CEC_FACTION_MIN_PP = 3000;
const CEC_FACTION_SWITCH_HOURS = 48;
const CEC_FACTION_FREEZE_DAYS = 5;
const CEC_SMITE_DEBUFF_HOURS = 48;
const CEC_REWARD_COOLDOWN_SECONDS = 3600;

function cec_reward_rules() {
    return [
        'incense' => 32,
        'fish_fry' => 36,
        'rosary' => 48,
        'vatican' => 42,
        'aspergillum' => 30,
        'st_jude' => 34,
        'candle' => 32,
        'bulletin_post' => 46,
    ];
}

function cec_faction_membership($conn, $accountId) {
    $stmt = $conn->prepare(
        'SELECT m.*, a.display_name AS sponsor_name, f.display_name AS founder_name,
                cf.status AS faction_status, cf.frozen_at
         FROM cec_faction_memberships m
         LEFT JOIN cec_accounts a ON a.id = m.sponsor_account_id
         JOIN cec_accounts f ON f.id = m.faction_founder_id
         JOIN cec_factions cf ON cf.founder_account_id = m.faction_founder_id
         WHERE m.account_id = ? LIMIT 1'
    );
    $id = (int) $accountId;
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    return $row ?: null;
}

function cec_collect_subtree_ids($conn, $accountId) {
    $seen = [(int) $accountId => true];
    $queue = [(int) $accountId];
    while (!empty($queue)) {
        $parent = array_shift($queue);
        $stmt = $conn->prepare(
            'SELECT account_id FROM cec_faction_memberships WHERE sponsor_account_id = ?'
        );
        $stmt->bind_param('i', $parent);
        $stmt->execute();
        $result = $stmt->get_result();
        while ($row = $result->fetch_assoc()) {
            $child = (int) $row['account_id'];
            if (!isset($seen[$child])) {
                $seen[$child] = true;
                $queue[] = $child;
            }
        }
        $stmt->close();
    }
    return array_map('intval', array_keys($seen));
}

function cec_update_membership_roots($conn, $ids, $founderId) {
    $stmt = $conn->prepare(
        'UPDATE cec_faction_memberships SET faction_founder_id = ? WHERE account_id = ?'
    );
    $root = (int) $founderId;
    foreach ($ids as $id) {
        $memberId = (int) $id;
        $stmt->bind_param('ii', $root, $memberId);
        $stmt->execute();
    }
    $stmt->close();
}

/** Freeze, recover, succeed, or dissolve a faction based on its founder PP. */
function cec_reconcile_faction($conn, $founderId) {
    $root = (int) $founderId;
    $stmt = $conn->prepare(
        'SELECT cf.*, a.pontifex_points
         FROM cec_factions cf
         JOIN cec_accounts a ON a.id = cf.founder_account_id
         WHERE cf.founder_account_id = ? LIMIT 1'
    );
    $stmt->bind_param('i', $root);
    $stmt->execute();
    $faction = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if (!$faction) {
        return null;
    }

    $pp = (int) $faction['pontifex_points'];
    if ($pp >= CEC_FACTION_MIN_PP) {
        if ($faction['status'] !== 'active') {
            $stmt = $conn->prepare(
                "UPDATE cec_factions SET status = 'active', frozen_at = NULL WHERE founder_account_id = ?"
            );
            $stmt->bind_param('i', $root);
            $stmt->execute();
            $stmt->close();
        }
        return ['status' => 'active', 'founderAccountId' => $root];
    }

    if ($faction['status'] === 'active' || !$faction['frozen_at']) {
        $stmt = $conn->prepare(
            "UPDATE cec_factions SET status = 'frozen', frozen_at = NOW() WHERE founder_account_id = ?"
        );
        $stmt->bind_param('i', $root);
        $stmt->execute();
        $stmt->close();
        return ['status' => 'frozen', 'founderAccountId' => $root];
    }

    $frozenAt = strtotime($faction['frozen_at']);
    if ($frozenAt && time() < $frozenAt + CEC_FACTION_FREEZE_DAYS * 86400) {
        return ['status' => 'frozen', 'founderAccountId' => $root];
    }

    // Grace expired: promote the strongest eligible direct follower.
    $stmt = $conn->prepare(
        'SELECT a.id
         FROM cec_faction_memberships m
         JOIN cec_accounts a ON a.id = m.account_id
         WHERE m.sponsor_account_id = ? AND a.pontifex_points >= ?
         ORDER BY a.pontifex_points DESC, a.id ASC
         LIMIT 1'
    );
    $min = CEC_FACTION_MIN_PP;
    $stmt->bind_param('ii', $root, $min);
    $stmt->execute();
    $successor = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if ($successor) {
        $nextRoot = (int) $successor['id'];
        $conn->begin_transaction();
        try {
            $stmt = $conn->prepare(
                "INSERT INTO cec_factions (founder_account_id, status, frozen_at)
                 VALUES (?, 'active', NULL)
                 ON DUPLICATE KEY UPDATE status = 'active', frozen_at = NULL"
            );
            $stmt->bind_param('i', $nextRoot);
            $stmt->execute();
            $stmt->close();

            $stmt = $conn->prepare(
                'UPDATE cec_faction_memberships SET sponsor_account_id = NULL WHERE account_id = ?'
            );
            $stmt->bind_param('i', $nextRoot);
            $stmt->execute();
            $stmt->close();

            $stmt = $conn->prepare(
                'UPDATE cec_faction_memberships SET sponsor_account_id = ? WHERE account_id = ?'
            );
            $stmt->bind_param('ii', $nextRoot, $root);
            $stmt->execute();
            $stmt->close();

            $stmt = $conn->prepare(
                'UPDATE cec_faction_memberships SET faction_founder_id = ?
                 WHERE faction_founder_id = ?'
            );
            $stmt->bind_param('ii', $nextRoot, $root);
            $stmt->execute();
            $stmt->close();

            $stmt = $conn->prepare('DELETE FROM cec_factions WHERE founder_account_id = ?');
            $stmt->bind_param('i', $root);
            $stmt->execute();
            $stmt->close();
            $conn->commit();
            return [
                'status' => 'active',
                'founderAccountId' => $nextRoot,
                'succeededFounderAccountId' => $root,
            ];
        } catch (Exception $e) {
            $conn->rollback();
            throw $e;
        }
    }

    // No eligible successor: dissolve without touching accounts or PP.
    $conn->begin_transaction();
    try {
        $stmt = $conn->prepare(
            'DELETE FROM cec_faction_memberships WHERE faction_founder_id = ?'
        );
        $stmt->bind_param('i', $root);
        $stmt->execute();
        $stmt->close();
        $stmt = $conn->prepare('DELETE FROM cec_factions WHERE founder_account_id = ?');
        $stmt->bind_param('i', $root);
        $stmt->execute();
        $stmt->close();
        $conn->commit();
    } catch (Exception $e) {
        $conn->rollback();
        throw $e;
    }
    return ['status' => 'dissolved', 'founderAccountId' => $root];
}

function cec_faction_summary($conn, $accountId) {
    $membership = cec_faction_membership($conn, $accountId);
    if (!$membership) {
        $stmt = $conn->prepare(
            'SELECT display_name, pontifex_points FROM cec_accounts WHERE id = ? LIMIT 1'
        );
        $id = (int) $accountId;
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $account = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return [
            'joined' => false,
            'canFound' => (int) ($account['pontifex_points'] ?? 0) >= CEC_FACTION_MIN_PP,
            'recruitmentCode' => $account['display_name'] ?? '',
        ];
    }

    $lifecycle = cec_reconcile_faction($conn, (int) $membership['faction_founder_id']);
    if ($lifecycle && $lifecycle['status'] === 'dissolved') {
        return cec_faction_summary($conn, $accountId);
    }
    // Succession may have changed the root; reload.
    $membership = cec_faction_membership($conn, $accountId);
    if (!$membership) {
        return cec_faction_summary($conn, $accountId);
    }

    $id = (int) $accountId;
    $root = (int) $membership['faction_founder_id'];
    $stmt = $conn->prepare(
        'SELECT COUNT(*) AS c FROM cec_faction_memberships WHERE sponsor_account_id = ?'
    );
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $direct = (int) $stmt->get_result()->fetch_assoc()['c'];
    $stmt->close();

    $stmt = $conn->prepare(
        'SELECT COUNT(*) AS c FROM cec_faction_memberships WHERE faction_founder_id = ?'
    );
    $stmt->bind_param('i', $root);
    $stmt->execute();
    $factionSize = (int) $stmt->get_result()->fetch_assoc()['c'];
    $stmt->close();

    $subtreeSize = max(0, count(cec_collect_subtree_ids($conn, $id)) - 1);
    $lastSwitch = $membership['switched_at'] ?: $membership['joined_at'];
    $nextSwitchTs = strtotime($lastSwitch) + CEC_FACTION_SWITCH_HOURS * 3600;
    $status = $membership['faction_status'];
    $protectedSize = $status === 'active' ? max(1, $factionSize) : 1;
    $smiteChance = max(5, (int) round(30 / sqrt($protectedSize)));
    $frozenEndsAt = $membership['frozen_at']
        ? date('c', strtotime($membership['frozen_at']) + CEC_FACTION_FREEZE_DAYS * 86400)
        : null;

    $stmt = $conn->prepare(
        'SELECT display_name, pontifex_points FROM cec_accounts WHERE id = ? LIMIT 1'
    );
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $self = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    return [
        'joined' => true,
        'isFounder' => $id === $root,
        'canFound' => $id !== $root
            && (int) ($self['pontifex_points'] ?? 0) >= CEC_FACTION_MIN_PP
            && time() >= $nextSwitchTs,
        'status' => $status,
        'sponsor' => $membership['sponsor_account_id'] ? [
            'accountId' => (int) $membership['sponsor_account_id'],
            'displayName' => $membership['sponsor_name'],
        ] : null,
        'founder' => [
            'accountId' => $root,
            'displayName' => $membership['founder_name'],
        ],
        'directFollowers' => $direct,
        'descendantFollowers' => $subtreeSize,
        'factionSize' => $factionSize,
        'smiteChancePercent' => $smiteChance,
        'canSwitchAt' => date('c', $nextSwitchTs),
        'canSwitch' => time() >= $nextSwitchTs && $id !== $root,
        'frozenUntil' => $frozenEndsAt,
        'recruitmentCode' => $self['display_name'] ?? '',
    ];
}

function cec_preview_sponsor($conn, $code) {
    $name = cec_normalize_display_name($code);
    $stmt = $conn->prepare(
        "SELECT a.id, a.display_name, m.faction_founder_id, f.display_name AS founder_name,
                cf.status
         FROM cec_accounts a
         JOIN cec_faction_memberships m ON m.account_id = a.id
         JOIN cec_accounts f ON f.id = m.faction_founder_id
         JOIN cec_factions cf ON cf.founder_account_id = m.faction_founder_id
         WHERE LOWER(a.display_name) = LOWER(?) AND a.email IS NOT NULL
         LIMIT 1"
    );
    $stmt->bind_param('s', $name);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if ($row) {
        return [
            'accountId' => (int) $row['id'],
            'displayName' => $row['display_name'],
            'founderAccountId' => (int) $row['faction_founder_id'],
            'founderName' => $row['founder_name'],
            'status' => $row['status'],
            'willAutoFound' => false,
        ];
    }

    // Eligible leaders do not need to tap Found — the first follower opens their congregation.
    $stmt = $conn->prepare(
        'SELECT id, display_name, pontifex_points
         FROM cec_accounts
         WHERE LOWER(display_name) = LOWER(?) AND email IS NOT NULL
         LIMIT 1'
    );
    $stmt->bind_param('s', $name);
    $stmt->execute();
    $account = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if (!$account) {
        return null;
    }
    if ((int) $account['pontifex_points'] >= CEC_FACTION_MIN_PP) {
        return [
            'accountId' => (int) $account['id'],
            'displayName' => $account['display_name'],
            'founderAccountId' => (int) $account['id'],
            'founderName' => $account['display_name'],
            'status' => 'active',
            'willAutoFound' => true,
        ];
    }
    throw new Exception(
        $account['display_name']
        . ' needs 3,000 PP (or must already be in a congregation) before anyone can follow them.'
    );
}

/**
 * Create a root congregation for an eligible account that does not have one yet.
 * Used when their first follower joins — no manual Found step required.
 */
function cec_bootstrap_congregation_if_needed($conn, $accountId) {
    $id = (int) $accountId;
    if (cec_faction_membership($conn, $id)) {
        return;
    }
    $stmt = $conn->prepare(
        'SELECT pontifex_points FROM cec_accounts WHERE id = ? LIMIT 1'
    );
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if (!$row || (int) $row['pontifex_points'] < CEC_FACTION_MIN_PP) {
        throw new Exception('That worshiper cannot lead a congregation yet.');
    }
    $stmt = $conn->prepare(
        "INSERT INTO cec_factions (founder_account_id, status) VALUES (?, 'active')"
    );
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $stmt->close();
    $stmt = $conn->prepare(
        'INSERT INTO cec_faction_memberships
           (account_id, sponsor_account_id, faction_founder_id, joined_at, switched_at)
         VALUES (?, NULL, ?, NOW(), NOW())'
    );
    $stmt->bind_param('ii', $id, $id);
    $stmt->execute();
    $stmt->close();
}

function cec_found_faction($conn, $accountId) {
    $id = (int) $accountId;
    $stmt = $conn->prepare('SELECT pontifex_points FROM cec_accounts WHERE id = ? LIMIT 1');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if (!$row || (int) $row['pontifex_points'] < CEC_FACTION_MIN_PP) {
        throw new Exception('You need 3,000 PP to found a congregation.');
    }
    $current = cec_faction_membership($conn, $id);
    if ($current && (int) $current['faction_founder_id'] === $id) {
        throw new Exception('You already lead a congregation.');
    }
    if ($current) {
        $lastSwitch = $current['switched_at'] ?: $current['joined_at'];
        if (time() < strtotime($lastSwitch) + CEC_FACTION_SWITCH_HOURS * 3600) {
            throw new Exception('You can branch into a new congregation after the 48-hour switch wait.');
        }
    }
    $subtree = $current ? cec_collect_subtree_ids($conn, $id) : [$id];
    $conn->begin_transaction();
    try {
        $stmt = $conn->prepare(
            'SELECT pontifex_points FROM cec_accounts WHERE id = ? FOR UPDATE'
        );
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $lockedAccount = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        if (!$lockedAccount || (int) $lockedAccount['pontifex_points'] < CEC_FACTION_MIN_PP) {
            throw new Exception('You need 3,000 PP to found a congregation.');
        }
        $stmt = $conn->prepare(
            "INSERT INTO cec_factions (founder_account_id, status) VALUES (?, 'active')"
        );
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $stmt->close();
        if ($current) {
            $stmt = $conn->prepare(
                'UPDATE cec_faction_memberships
                 SET sponsor_account_id = NULL, faction_founder_id = ?, switched_at = NOW()
                 WHERE account_id = ?'
            );
            $stmt->bind_param('ii', $id, $id);
            $stmt->execute();
            $stmt->close();
            cec_update_membership_roots($conn, $subtree, $id);
        } else {
            $stmt = $conn->prepare(
                'INSERT INTO cec_faction_memberships
                   (account_id, sponsor_account_id, faction_founder_id, joined_at, switched_at)
                 VALUES (?, NULL, ?, NOW(), NOW())'
            );
            $stmt->bind_param('ii', $id, $id);
            $stmt->execute();
            $stmt->close();
        }
        $conn->commit();
    } catch (Exception $e) {
        $conn->rollback();
        throw $e;
    }
    return cec_faction_summary($conn, $id);
}

function cec_join_faction($conn, $accountId, $code) {
    $id = (int) $accountId;
    $target = cec_preview_sponsor($conn, $code);
    if (!$target) {
        throw new Exception('No worshiper has that character name.');
    }
    if ($target['status'] !== 'active') {
        throw new Exception('That congregation is frozen and cannot accept members.');
    }
    if ((int) $target['accountId'] === $id) {
        throw new Exception('You cannot sponsor yourself.');
    }

    // First follower of a 3,000+ PP worshiper opens their congregation automatically.
    if (!empty($target['willAutoFound'])) {
        cec_bootstrap_congregation_if_needed($conn, (int) $target['accountId']);
        $target = cec_preview_sponsor($conn, $code);
        if (!$target || !empty($target['willAutoFound'])) {
            throw new Exception('Could not open that congregation. Try again.');
        }
    }

    $current = cec_faction_membership($conn, $id);
    if ($current && (int) $current['faction_founder_id'] === $id) {
        throw new Exception('A congregation founder cannot join another congregation.');
    }
    if ($current) {
        $lastSwitch = $current['switched_at'] ?: $current['joined_at'];
        if (time() < strtotime($lastSwitch) + CEC_FACTION_SWITCH_HOURS * 3600) {
            throw new Exception('You can change congregations once every 48 hours.');
        }
    }

    $subtree = $current ? cec_collect_subtree_ids($conn, $id) : [$id];
    if (in_array((int) $target['accountId'], $subtree, true)) {
        throw new Exception('You cannot join one of your own followers.');
    }

    $newRoot = (int) $target['founderAccountId'];
    $sponsorId = (int) $target['accountId'];
    $conn->begin_transaction();
    try {
        // Recheck the switch window under lock to serialize competing move requests.
        $stmt = $conn->prepare(
            'SELECT faction_founder_id, joined_at, switched_at
             FROM cec_faction_memberships WHERE account_id = ? FOR UPDATE'
        );
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $lockedCurrent = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        if ($lockedCurrent) {
            $lockedLast = $lockedCurrent['switched_at'] ?: $lockedCurrent['joined_at'];
            if (time() < strtotime($lockedLast) + CEC_FACTION_SWITCH_HOURS * 3600) {
                throw new Exception('You can change congregations once every 48 hours.');
            }
        }
        if ($current) {
            $stmt = $conn->prepare(
                'UPDATE cec_faction_memberships
                 SET sponsor_account_id = ?, faction_founder_id = ?, switched_at = NOW()
                 WHERE account_id = ?'
            );
            $stmt->bind_param('iii', $sponsorId, $newRoot, $id);
            $stmt->execute();
            $stmt->close();
            cec_update_membership_roots($conn, $subtree, $newRoot);
        } else {
            $stmt = $conn->prepare(
                'INSERT INTO cec_faction_memberships
                   (account_id, sponsor_account_id, faction_founder_id, joined_at, switched_at)
                 VALUES (?, ?, ?, NOW(), NOW())'
            );
            $stmt->bind_param('iii', $id, $sponsorId, $newRoot);
            $stmt->execute();
            $stmt->close();
        }
        $conn->commit();
    } catch (Exception $e) {
        $conn->rollback();
        throw $e;
    }
    return cec_faction_summary($conn, $id);
}

function cec_credit_milli_pp($conn, $eventKey, $actorId, $beneficiaryId, $milli, $type) {
    if ($milli <= 0) {
        return 0;
    }
    $beneficiary = (int) $beneficiaryId;
    $stmt = $conn->prepare(
        'SELECT pp_milli_remainder FROM cec_accounts WHERE id = ? FOR UPDATE'
    );
    $stmt->bind_param('i', $beneficiary);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if (!$row) {
        return 0;
    }
    $totalMilli = (int) $row['pp_milli_remainder'] + (int) $milli;
    $whole = intdiv($totalMilli, 1000);
    $remainder = $totalMilli % 1000;
    $stmt = $conn->prepare(
        'UPDATE cec_accounts
         SET pontifex_points = pontifex_points + ?, pp_milli_remainder = ?
         WHERE id = ?'
    );
    $stmt->bind_param('iii', $whole, $remainder, $beneficiary);
    $stmt->execute();
    $stmt->close();

    $meta = json_encode(['milliPP' => (int) $milli]);
    $zero = 0;
    $stmt = $conn->prepare(
        'INSERT IGNORE INTO cec_pp_events
           (event_key, actor_account_id, beneficiary_account_id, event_type, base_pp, awarded_pp, metadata_json)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    $actor = (int) $actorId;
    $stmt->bind_param('siisiis', $eventKey, $actor, $beneficiary, $type, $zero, $whole, $meta);
    $stmt->execute();
    $stmt->close();
    return $whole;
}

/** Distribute a 10% fractional tithe pool through sponsors to the founder. */
function cec_apply_trickle($conn, $actorId, $awarded, $eventKey) {
    $membership = cec_faction_membership($conn, $actorId);
    if (!$membership || $membership['faction_status'] !== 'active' || !$membership['sponsor_account_id']) {
        return [];
    }
    $root = (int) $membership['faction_founder_id'];
    $current = (int) $membership['sponsor_account_id'];
    $remaining = max(0, (int) $awarded * 100);
    $seen = [(int) $actorId => true];
    $payouts = [];
    $depth = 0;
    while ($current && $current !== $root && $remaining > 0 && !isset($seen[$current]) && $depth < 50) {
        $seen[$current] = true;
        $share = (int) ceil($remaining / 2);
        $remaining -= $share;
        $whole = cec_credit_milli_pp(
            $conn,
            $eventKey . ':trickle:' . $current,
            $actorId,
            $current,
            $share,
            'trickle'
        );
        $payouts[] = ['accountId' => $current, 'milliPP' => $share, 'awardedPP' => $whole];
        $stmt = $conn->prepare(
            'SELECT sponsor_account_id FROM cec_faction_memberships WHERE account_id = ? LIMIT 1'
        );
        $stmt->bind_param('i', $current);
        $stmt->execute();
        $parent = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        $current = $parent && $parent['sponsor_account_id']
            ? (int) $parent['sponsor_account_id']
            : $root;
        $depth++;
    }
    if ($remaining > 0 && !isset($seen[$root])) {
        $whole = cec_credit_milli_pp(
            $conn,
            $eventKey . ':trickle:' . $root,
            $actorId,
            $root,
            $remaining,
            'trickle'
        );
        $payouts[] = ['accountId' => $root, 'milliPP' => $remaining, 'awardedPP' => $whole];
    }
    return $payouts;
}

function cec_schedule_next_smite($conn, $accountId) {
    $days = random_int(3, 7);
    $stmt = $conn->prepare(
        'UPDATE cec_accounts SET next_smite_at = DATE_ADD(NOW(), INTERVAL ? DAY) WHERE id = ?'
    );
    $id = (int) $accountId;
    $stmt->bind_param('ii', $days, $id);
    $stmt->execute();
    $stmt->close();
}

/** Resolve a due smite during normal authenticated traffic (no cron required). */
function cec_resolve_due_smite($conn, $accountId) {
    $id = (int) $accountId;
    $conn->begin_transaction();
    try {
        // The account lock prevents simultaneous page loads from applying two smites.
        $stmt = $conn->prepare(
            'SELECT pontifex_points, next_smite_at FROM cec_accounts WHERE id = ? FOR UPDATE'
        );
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $account = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        if (!$account) {
            $conn->rollback();
            return null;
        }
        if (!$account['next_smite_at']) {
            cec_schedule_next_smite($conn, $id);
            $conn->commit();
            return null;
        }
        if (strtotime($account['next_smite_at']) > time()) {
            $conn->commit();
            return null;
        }

        $chance = 30;
        $stmt = $conn->prepare(
            'SELECT m.faction_founder_id, f.status
             FROM cec_faction_memberships m
             JOIN cec_factions f ON f.founder_account_id = m.faction_founder_id
             WHERE m.account_id = ? LIMIT 1'
        );
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $membership = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        if ($membership && $membership['status'] === 'active') {
            $root = (int) $membership['faction_founder_id'];
            $stmt = $conn->prepare(
                'SELECT COUNT(*) AS c FROM cec_faction_memberships WHERE faction_founder_id = ?'
            );
            $stmt->bind_param('i', $root);
            $stmt->execute();
            $size = max(1, (int) $stmt->get_result()->fetch_assoc()['c']);
            $stmt->close();
            $chance = max(5, (int) round(30 / sqrt($size)));
        }
        $roll = random_int(1, 100);
        cec_schedule_next_smite($conn, $id);
        if ($roll > $chance) {
            $conn->commit();
            return ['smote' => false, 'chancePercent' => $chance];
        }

        $pp = (int) $account['pontifex_points'];
        $loss = min($pp, min(150, max(10, (int) round($pp * 0.05))));
        $eventKey = 'smite:' . $id . ':' . date('Y-m-d-H');
        $stmt = $conn->prepare(
            'UPDATE cec_accounts
             SET pontifex_points = GREATEST(0, pontifex_points - ?),
                 debuff_until = DATE_ADD(NOW(), INTERVAL ? HOUR)
             WHERE id = ?'
        );
        $hours = CEC_SMITE_DEBUFF_HOURS;
        $stmt->bind_param('iii', $loss, $hours, $id);
        $stmt->execute();
        $stmt->close();
        $negative = -$loss;
        $meta = json_encode(['chancePercent' => $chance, 'roll' => $roll]);
        $stmt = $conn->prepare(
            'INSERT IGNORE INTO cec_pp_events
               (event_key, actor_account_id, beneficiary_account_id, event_type, base_pp, awarded_pp, metadata_json)
             VALUES (?, ?, ?, \'smite\', 0, ?, ?)'
        );
        $stmt->bind_param('siiis', $eventKey, $id, $id, $negative, $meta);
        $stmt->execute();
        $stmt->close();
        $conn->commit();
    } catch (Exception $e) {
        $conn->rollback();
        throw $e;
    }
    $postMembership = cec_faction_membership($conn, $id);
    if ($postMembership && (int) $postMembership['faction_founder_id'] === $id) {
        cec_reconcile_faction($conn, $id);
    }
    return [
        'smote' => true,
        'lostPP' => $loss,
        'chancePercent' => $chance,
        'debuffUntil' => date('c', time() + CEC_SMITE_DEBUFF_HOURS * 3600),
    ];
}

function cec_claim_reward($conn, $accountId, $rewardType, $actionId = '') {
    $id = (int) $accountId;
    $rules = cec_reward_rules();
    $type = trim((string) $rewardType);
    $action = trim((string) $actionId);
    $key = '';
    $base = 0;

    if ($type === 'action' && isset($rules[$action])) {
        $key = $action;
        $base = (int) $rules[$action];
    } elseif ($type === 'amen' && isset($rules[$action]) && $action !== 'bulletin_post') {
        $key = 'amen_' . $action;
        $base = 31;
    } elseif ($type === 'communion') {
        $key = 'portrait_communion_cycle';
    } else {
        throw new Exception('Unknown reward.');
    }

    $conn->begin_transaction();
    try {
        $stmt = $conn->prepare(
            'SELECT * FROM cec_accounts WHERE id = ? FOR UPDATE'
        );
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $account = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        if (!$account) {
            throw new Exception('Account not found.');
        }
        $lastDone = json_decode($account['action_last_done'] ?: '{}', true);
        if (!is_array($lastDone)) {
            $lastDone = [];
        }
        $nowMs = (int) round(microtime(true) * 1000);

        if ($type === 'communion') {
            $cycleStart = isset($lastDone['portrait_communion_cycle'])
                ? (int) $lastDone['portrait_communion_cycle']
                : 0;
            $expired = !$cycleStart || $nowMs - $cycleStart >= CEC_REWARD_COOLDOWN_SECONDS * 1000;
            $step = $expired ? 0 : (int) ($lastDone['portrait_communion_step'] ?? 0);
            if ($step >= 2) {
                $conn->rollback();
                return [
                    'awarded' => 0,
                    'rewardKind' => 'stuffed',
                    'trickle' => [],
                ];
            }
            $base = $step === 0 ? 24 : 28;
            $lastDone['portrait_communion_cycle'] = $expired ? $nowMs : $cycleStart;
            $lastDone['portrait_communion_step'] = $step + 1;
            $rewardKind = $step === 0 ? 'blood' : 'body';
        } else {
            $last = isset($lastDone[$key]) ? (int) $lastDone[$key] : 0;
            if ($last && $nowMs - $last < CEC_REWARD_COOLDOWN_SECONDS * 1000) {
                $conn->rollback();
                return ['awarded' => 0, 'rewardKind' => $type, 'trickle' => []];
            }
            $lastDone[$key] = $nowMs;
            $rewardKind = $type;
        }

        $debuffed = $account['debuff_until'] && strtotime($account['debuff_until']) > time();
        $awarded = $debuffed ? max(1, (int) floor($base * 0.8)) : $base;
        $eventKey = 'reward:' . $id . ':' . $key . ':' . $nowMs;
        $actionJson = json_encode($lastDone);
        $stmt = $conn->prepare(
            'UPDATE cec_accounts
             SET pontifex_points = pontifex_points + ?, action_last_done = ?, last_active_at = NOW()
             WHERE id = ?'
        );
        $stmt->bind_param('isi', $awarded, $actionJson, $id);
        $stmt->execute();
        $stmt->close();

        $meta = json_encode(['debuffed' => $debuffed, 'actionId' => $action]);
        // bind signature: string, int, int, string, int, int, string.
        $stmt = $conn->prepare(
            'INSERT INTO cec_pp_events
               (event_key, actor_account_id, beneficiary_account_id, event_type, base_pp, awarded_pp, metadata_json)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->bind_param('siisiis', $eventKey, $id, $id, $type, $base, $awarded, $meta);
        $stmt->execute();
        $stmt->close();

        $trickle = cec_apply_trickle($conn, $id, $awarded, $eventKey);
        $conn->commit();
        return [
            'awarded' => $awarded,
            'basePP' => $base,
            'debuffed' => $debuffed,
            'rewardKind' => $rewardKind,
            'trickle' => $trickle,
        ];
    } catch (Exception $e) {
        $conn->rollback();
        throw $e;
    }
}

