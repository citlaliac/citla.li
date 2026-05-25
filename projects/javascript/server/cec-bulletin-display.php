<?php
require_once __DIR__ . '/perspective-helper.php';

cec_send_json_cors('GET, OPTIONS');
cec_handle_options();

try {
    $envVars = cec_load_env();
    $conn = cec_db_connect($envVars);
    cec_ensure_tables($conn);

    $result = $conn->query(
        "SELECT display_name, rank_label, body, created_at
         FROM cec_bulletin
         WHERE is_moderated = 1
         ORDER BY created_at DESC
         LIMIT 50"
    );

    if (!$result) {
        throw new Exception('Failed to fetch bulletin');
    }

    $entries = [];
    while ($row = $result->fetch_assoc()) {
        $entries[] = [
            'name' => htmlspecialchars($row['display_name'], ENT_QUOTES, 'UTF-8'),
            'rank' => htmlspecialchars($row['rank_label'], ENT_QUOTES, 'UTF-8'),
            'body' => htmlspecialchars($row['body'], ENT_QUOTES, 'UTF-8'),
            'date' => date('F j, Y g:i A', strtotime($row['created_at'])),
        ];
    }

    $conn->close();
    echo json_encode(['success' => true, 'entries' => $entries]);
} catch (Exception $e) {
    error_log('cec-bulletin-display: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
