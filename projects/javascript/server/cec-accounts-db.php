<?php
/**
 * Catholic e Cloud — account DB helpers.
 */

require_once __DIR__ . '/perspective-helper.php';

function cec_accounts_send_json_cors($methods = 'GET, POST, PATCH, OPTIONS') {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowed = ['https://citla.li', 'http://localhost:3000'];
    if (in_array($origin, $allowed, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
    } else {
        header('Access-Control-Allow-Origin: https://citla.li');
    }
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Methods: ' . $methods);
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
}

function cec_accounts_read_json_body() {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function cec_accounts_json_ok($data = []) {
    echo json_encode(array_merge(['success' => true], $data));
    exit();
}

function cec_accounts_json_error($message, $status = 400) {
    http_response_code($status);
    echo json_encode(['success' => false, 'error' => $message]);
    exit();
}

function cec_accounts_ensure_tables($conn) {
    cec_ensure_tables($conn);

    $conn->query("CREATE TABLE IF NOT EXISTS cec_accounts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NULL,
        password_hash VARCHAR(255) NULL,
        display_name VARCHAR(24) NOT NULL,
        avatar_id VARCHAR(32) NOT NULL DEFAULT 'frog',
        pontifex_points INT NOT NULL DEFAULT 0,
        completed_actions JSON NULL,
        action_last_done JSON NULL,
        last_spin_date DATE NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_cec_account_email (email),
        UNIQUE KEY uk_cec_display_name (display_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    cec_accounts_migrate_schema($conn);

    $conn->query("CREATE TABLE IF NOT EXISTS cec_account_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        account_id INT NOT NULL,
        token_hash CHAR(64) NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_cec_session_token (token_hash),
        INDEX idx_cec_session_account (account_id),
        INDEX idx_cec_session_expires (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
}

function cec_rank_from_points($pp) {
    $ranks = [
        ['id' => 'cantor', 'label' => 'Cantor', 'minPP' => 0],
        ['id' => 'seminarian', 'label' => 'Seminarian', 'minPP' => 90],
        ['id' => 'deacon', 'label' => 'Deacon', 'minPP' => 220],
        ['id' => 'priest', 'label' => 'Priest', 'minPP' => 500],
        ['id' => 'pope', 'label' => 'Pope', 'minPP' => 2000],
    ];
    $current = $ranks[0];
    foreach ($ranks as $rank) {
        if ($pp >= $rank['minPP']) {
            $current = $rank;
        }
    }
    return $current;
}

function cec_account_session_id($accountId) {
    return 'cec-acc-' . (int) $accountId;
}

function cec_worshiper_from_row($row) {
    $pp = (int) $row['pontifex_points'];
    $completed = $row['completed_actions'] ?? '[]';
    $actionLast = $row['action_last_done'] ?? '{}';
    if (is_string($completed)) {
        $completed = json_decode($completed, true);
    }
    if (is_string($actionLast)) {
        $actionLast = json_decode($actionLast, true);
    }
    if (!is_array($completed)) {
        $completed = [];
    }
    if (!is_array($actionLast)) {
        $actionLast = [];
    }

    return [
        'accountId' => (int) $row['id'],
        'sessionId' => cec_account_session_id($row['id']),
        'displayName' => $row['display_name'],
        'avatarId' => $row['avatar_id'],
        'pontifexPoints' => $pp,
        'rank' => cec_rank_from_points($pp),
        'completedActions' => $completed,
        'actionLastDone' => $actionLast,
        'lastSpinDate' => $row['last_spin_date'] ?: null,
    ];
}

function cec_issue_session_token($conn, $accountId) {
    $token = bin2hex(random_bytes(32));
    $hash = hash('sha256', $token);
    $expires = date('Y-m-d H:i:s', time() + 90 * 24 * 60 * 60);

    $stmt = $conn->prepare(
        'INSERT INTO cec_account_sessions (account_id, token_hash, expires_at) VALUES (?, ?, ?)'
    );
    $stmt->bind_param('iss', $accountId, $hash, $expires);
    $stmt->execute();
    $stmt->close();

    return $token;
}

function cec_authenticate_request($conn) {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/^Bearer\s+(\S+)$/i', $header, $matches)) {
        return null;
    }
    $hash = hash('sha256', $matches[1]);
    $now = date('Y-m-d H:i:s');

    $stmt = $conn->prepare(
        'SELECT a.* FROM cec_account_sessions s
         JOIN cec_accounts a ON a.id = s.account_id
         WHERE s.token_hash = ? AND s.expires_at > ?
         LIMIT 1'
    );
    $stmt->bind_param('ss', $hash, $now);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    return $row ?: null;
}

function cec_normalize_email($email) {
    return strtolower(trim((string) $email));
}

function cec_validate_email($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

function cec_validate_password($password) {
    return is_string($password) && strlen($password) >= 8;
}

function cec_accounts_migrate_schema($conn) {
    @$conn->query('ALTER TABLE cec_accounts MODIFY email VARCHAR(255) NULL');
    @$conn->query('ALTER TABLE cec_accounts MODIFY password_hash VARCHAR(255) NULL');
    $idx = $conn->query("SHOW INDEX FROM cec_accounts WHERE Key_name = 'uk_cec_display_name'");
    if ($idx && $idx->num_rows === 0) {
        @$conn->query('ALTER TABLE cec_accounts ADD UNIQUE KEY uk_cec_display_name (display_name)');
    }
}

function cec_normalize_display_name($displayName) {
    return mb_substr(trim((string) $displayName), 0, 24);
}

function cec_display_name_taken($conn, $displayName, $exceptAccountId = null) {
    $name = cec_normalize_display_name($displayName);
    if ($name === '') {
        return false;
    }
    if ($exceptAccountId) {
        $stmt = $conn->prepare(
            'SELECT id FROM cec_accounts WHERE display_name = ? AND email IS NOT NULL AND id != ? LIMIT 1'
        );
        $stmt->bind_param('si', $name, $exceptAccountId);
    } else {
        $stmt = $conn->prepare(
            'SELECT id FROM cec_accounts WHERE display_name = ? AND email IS NOT NULL LIMIT 1'
        );
        $stmt->bind_param('s', $name);
    }
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    return (bool) $row;
}
