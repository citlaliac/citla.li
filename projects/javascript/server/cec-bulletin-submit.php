<?php
require_once __DIR__ . '/perspective-helper.php';
require_once __DIR__ . '/cec-accounts-db.php';

cec_send_json_cors('POST, OPTIONS');
cec_handle_options();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

try {
    $envVars = cec_load_env();
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) {
        throw new Exception('Invalid JSON body');
    }

    $sessionId = trim($data['sessionId'] ?? '');
    $displayName = trim($data['displayName'] ?? '');
    $rankLabel = trim($data['rankLabel'] ?? '');
    $body = trim($data['body'] ?? '');

    if ($sessionId === '' || strlen($sessionId) > 36) {
        throw new Exception('Invalid session');
    }
    if ($displayName === '' || mb_strlen($displayName) > 24) {
        throw new Exception('Name required (max 24 characters)');
    }
    if ($rankLabel === '' || mb_strlen($rankLabel) > 32) {
        throw new Exception('Invalid rank');
    }
    if ($body === '' || mb_strlen($body) > 280) {
        throw new Exception('Message required (max 280 characters)');
    }

    $apiKey = $envVars['PERSPECTIVE_API_KEY'] ?? '';
    $mod = cec_moderate_text($displayName . ' ' . $body, $apiKey);

    $conn = cec_db_connect($envVars);
    cec_ensure_tables($conn);
    cec_accounts_ensure_tables($conn);

    if (cec_guest_session_name_blocked($conn, $displayName)) {
        $account = cec_authenticate_request($conn);
        if (
            !$account
            || strcasecmp((string) $account['display_name'], $displayName) !== 0
        ) {
            throw new Exception('That name is reserved for a registered worshiper');
        }
    }

    $stmt = $conn->prepare(
        'INSERT INTO cec_bulletin (session_id, display_name, rank_label, body, is_moderated, moderation_status)
         VALUES (?, ?, ?, ?, ?, ?)'
    );
    $stmt->bind_param(
        'ssssis',
        $sessionId,
        $displayName,
        $rankLabel,
        $body,
        $mod['is_moderated'],
        $mod['moderation_status']
    );
    if (!$stmt->execute()) {
        throw new Exception('Failed to save bulletin post');
    }

    $stmt->close();
    $conn->close();

    echo json_encode([
        'success' => true,
        'approved' => (bool) $mod['is_moderated'],
        'message' => $mod['is_moderated']
            ? 'Posted to the Parish Bulletin.'
            : 'Held for incense review.',
    ]);
} catch (Exception $e) {
    error_log('cec-bulletin-submit: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
