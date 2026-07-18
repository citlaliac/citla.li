<?php
require_once __DIR__ . '/cec-accounts-db.php';
require_once __DIR__ . '/cec-factions.php';

cec_accounts_send_json_cors('GET, POST, PATCH, OPTIONS');
cec_handle_options();

$method = $_SERVER['REQUEST_METHOD'];
$resource = isset($_GET['resource']) ? trim($_GET['resource']) : '';
$action = isset($_GET['action']) ? trim($_GET['action']) : '';

try {
    $envVars = cec_load_env();
    $conn = cec_db_connect($envVars);
    cec_accounts_ensure_tables($conn);

    if ($resource === 'auth' && $method === 'POST') {
        if ($action === 'register') {
            cec_handle_auth_register($conn);
        } elseif ($action === 'login') {
            cec_handle_auth_login($conn);
        } else {
            cec_accounts_json_error('Use action=register or action=login', 404);
        }
    } elseif ($resource === 'names' && $method === 'GET' && $action === 'check') {
        cec_handle_names_check($conn);
    } elseif ($resource === 'me') {
        if ($method === 'GET') {
            cec_handle_me_get($conn);
        } elseif ($method === 'PATCH') {
            cec_handle_me_patch($conn);
        } else {
            cec_accounts_json_error('Method not allowed', 405);
        }
    } elseif ($resource === 'pope' && $method === 'GET') {
        cec_handle_pope_get($conn);
    } elseif ($resource === 'faction') {
        cec_handle_faction($conn, $method, $action);
    } elseif ($resource === 'reward' && $method === 'POST') {
        cec_handle_reward($conn);
    } else {
        cec_accounts_json_error('Unknown resource. Use resource=auth|names|me|pope|faction|reward', 404);
    }

    $conn->close();
} catch (Exception $e) {
    error_log('cec-accounts-api: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

function cec_handle_names_check($conn) {
    $name = cec_normalize_display_name($_GET['username'] ?? $_GET['displayName'] ?? '');
    if ($name === '') {
        cec_accounts_json_error('Name is required');
    }
    $taken = cec_guest_session_name_blocked($conn, $name);
    cec_accounts_json_ok(['available' => !$taken, 'taken' => $taken]);
}

function cec_handle_auth_register($conn) {
    $body = cec_accounts_read_json_body();
    $email = cec_normalize_email($body['email'] ?? '');
    $password = $body['password'] ?? '';
    $displayName = cec_normalize_display_name($body['username'] ?? $body['displayName'] ?? '');
    $avatarId = trim((string) ($body['avatarId'] ?? 'frog'));

    if (!cec_validate_email($email)) {
        cec_accounts_json_error('Valid email is required');
    }
    if (!cec_validate_password($password)) {
        cec_accounts_json_error('Password must be at least 8 characters');
    }
    if ($displayName === '') {
        cec_accounts_json_error('Username is required');
    }
    if (cec_display_name_taken($conn, $displayName)) {
        cec_accounts_json_error('That username is already taken — try another', 409);
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $emptyJson = '["register"]';
    $nowMs = (int) round(microtime(true) * 1000);
    $emptyObj = json_encode(['register' => $nowMs]);
    $registerPP = 28;

    $stmt = $conn->prepare(
        'INSERT INTO cec_accounts (email, password_hash, display_name, avatar_id, pontifex_points, completed_actions, action_last_done)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->bind_param('ssssiss', $email, $hash, $displayName, $avatarId, $registerPP, $emptyJson, $emptyObj);
    if (!$stmt->execute()) {
        if ($conn->errno === 1062) {
            cec_accounts_json_error('Email or username is already in use', 409);
        }
        throw new Exception('Registration failed');
    }
    $accountId = (int) $stmt->insert_id;
    $stmt->close();

    $row = cec_fetch_account_by_id($conn, $accountId);
    cec_touch_account_activity($conn, $accountId);
    $row = cec_fetch_account_by_id($conn, $accountId);
    $token = cec_issue_session_token($conn, $accountId);
    $reigningPope = cec_get_reigning_pope($conn);
    $eventKey = 'register:' . $accountId;
    $eventType = 'register';
    $stmt = $conn->prepare(
        'INSERT IGNORE INTO cec_pp_events
           (event_key, actor_account_id, beneficiary_account_id, event_type, base_pp, awarded_pp)
         VALUES (?, ?, ?, ?, ?, ?)'
    );
    $stmt->bind_param(
        'siisii',
        $eventKey,
        $accountId,
        $accountId,
        $eventType,
        $registerPP,
        $registerPP
    );
    $stmt->execute();
    $stmt->close();
    cec_accounts_json_ok([
        'token' => $token,
        'worshiper' => cec_worshiper_from_row($row, $reigningPope),
        'reigningPope' => $reigningPope,
        'faction' => cec_faction_summary($conn, $accountId),
    ]);
}

function cec_handle_auth_login($conn) {
    $body = cec_accounts_read_json_body();
    $email = cec_normalize_email($body['email'] ?? '');
    $password = $body['password'] ?? '';

    if (!cec_validate_email($email)) {
        cec_accounts_json_error('Valid email is required');
    }
    if ($password === '') {
        cec_accounts_json_error('Password is required');
    }

    $stmt = $conn->prepare('SELECT * FROM cec_accounts WHERE email = ? LIMIT 1');
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$row || !password_verify($password, $row['password_hash'])) {
        cec_accounts_json_error('Invalid email or password', 401);
    }

    $smite = cec_resolve_due_smite($conn, (int) $row['id']);
    cec_touch_account_activity($conn, (int) $row['id']);
    $row = cec_fetch_account_by_id($conn, (int) $row['id']);
    $token = cec_issue_session_token($conn, (int) $row['id']);
    $reigningPope = cec_get_reigning_pope($conn);
    cec_accounts_json_ok([
        'token' => $token,
        'worshiper' => cec_worshiper_from_row($row, $reigningPope),
        'reigningPope' => $reigningPope,
        'faction' => cec_faction_summary($conn, (int) $row['id']),
        'smite' => $smite,
    ]);
}

function cec_handle_pope_get($conn) {
    cec_accounts_json_ok(['reigningPope' => cec_get_reigning_pope($conn)]);
}

function cec_handle_me_get($conn) {
    $row = cec_authenticate_request($conn);
    if (!$row) {
        cec_accounts_json_error('Not authenticated', 401);
    }
    $smite = cec_resolve_due_smite($conn, (int) $row['id']);
    cec_touch_account_activity($conn, (int) $row['id']);
    $row = cec_fetch_account_by_id($conn, (int) $row['id']);
    $reigningPope = cec_get_reigning_pope($conn);
    cec_accounts_json_ok([
        'worshiper' => cec_worshiper_from_row($row, $reigningPope),
        'reigningPope' => $reigningPope,
        'faction' => cec_faction_summary($conn, (int) $row['id']),
        'smite' => $smite,
    ]);
}

function cec_handle_me_patch($conn) {
    $row = cec_authenticate_request($conn);
    if (!$row) {
        cec_accounts_json_error('Not authenticated', 401);
    }

    $body = cec_accounts_read_json_body();
    $accountId = (int) $row['id'];

    $displayName = array_key_exists('displayName', $body)
        ? mb_substr(trim((string) $body['displayName']), 0, 24)
        : $row['display_name'];
    $avatarId = array_key_exists('avatarId', $body)
        ? trim((string) $body['avatarId'])
        : $row['avatar_id'];
    // Progress is server-owned; PATCH /me remains a narrow profile update.
    $stmt = $conn->prepare(
        'UPDATE cec_accounts
         SET display_name = ?, avatar_id = ?, last_active_at = NOW()
         WHERE id = ?'
    );
    $stmt->bind_param('ssi', $displayName, $avatarId, $accountId);
    $stmt->execute();
    $stmt->close();

    $updated = cec_fetch_account_by_id($conn, $accountId);
    $reigningPope = cec_get_reigning_pope($conn);
    cec_accounts_json_ok([
        'worshiper' => cec_worshiper_from_row($updated, $reigningPope),
        'reigningPope' => $reigningPope,
        'faction' => cec_faction_summary($conn, $accountId),
    ]);
}

function cec_handle_faction($conn, $method, $action) {
    $row = cec_authenticate_request($conn);
    if (!$row) {
        cec_accounts_json_error('Not authenticated', 401);
    }
    $accountId = (int) $row['id'];
    if ($method === 'GET' && $action === 'preview') {
        try {
            $preview = cec_preview_sponsor($conn, $_GET['code'] ?? '');
            if (!$preview) {
                cec_accounts_json_error('No worshiper has that character name', 404);
            }
            cec_accounts_json_ok(['preview' => $preview]);
        } catch (Exception $e) {
            cec_accounts_json_error($e->getMessage(), 409);
        }
    }
    if ($method === 'GET') {
        cec_accounts_json_ok(['faction' => cec_faction_summary($conn, $accountId)]);
    }
    if ($method === 'POST' && $action === 'found') {
        try {
            cec_accounts_json_ok(['faction' => cec_found_faction($conn, $accountId)]);
        } catch (Exception $e) {
            cec_accounts_json_error($e->getMessage(), 409);
        }
    }
    if ($method === 'POST' && $action === 'join') {
        $body = cec_accounts_read_json_body();
        try {
            cec_accounts_json_ok([
                'faction' => cec_join_faction($conn, $accountId, $body['code'] ?? ''),
            ]);
        } catch (Exception $e) {
            cec_accounts_json_error($e->getMessage(), 409);
        }
    }
    cec_accounts_json_error('Unknown faction action', 404);
}

function cec_handle_reward($conn) {
    $row = cec_authenticate_request($conn);
    if (!$row) {
        cec_accounts_json_error('Not authenticated', 401);
    }
    $body = cec_accounts_read_json_body();
    try {
        $reward = cec_claim_reward(
            $conn,
            (int) $row['id'],
            $body['rewardType'] ?? '',
            $body['actionId'] ?? ''
        );
        $updated = cec_fetch_account_by_id($conn, (int) $row['id']);
        $reigningPope = cec_get_reigning_pope($conn);
        cec_accounts_json_ok([
            'reward' => $reward,
            'worshiper' => cec_worshiper_from_row($updated, $reigningPope),
            'reigningPope' => $reigningPope,
            'faction' => cec_faction_summary($conn, (int) $row['id']),
        ]);
    } catch (Exception $e) {
        cec_accounts_json_error($e->getMessage(), 400);
    }
}

function cec_fetch_account_by_id($conn, $accountId) {
    $stmt = $conn->prepare('SELECT * FROM cec_accounts WHERE id = ? LIMIT 1');
    $stmt->bind_param('i', $accountId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if (!$row) {
        throw new Exception('Account not found');
    }
    return $row;
}
