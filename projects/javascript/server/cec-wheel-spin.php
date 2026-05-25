<?php
require_once __DIR__ . '/perspective-helper.php';

cec_send_json_cors('POST, OPTIONS');
cec_handle_options();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

/** Server-side saint table (weights must match cecConfig.js WHEEL_SAINTS) */
$SAINTS = [
    ['id' => 'francis', 'label' => 'St. Francis', 'weight' => 12, 'ppMin' => 8, 'ppMax' => 15],
    ['id' => 'therese', 'label' => 'St. Thérèse', 'weight' => 12, 'ppMin' => 8, 'ppMax' => 14],
    ['id' => 'anthony', 'label' => 'St. Anthony', 'weight' => 10, 'ppMin' => 10, 'ppMax' => 15],
    ['id' => 'cecilia', 'label' => 'St. Cecilia', 'weight' => 10, 'ppMin' => 9, 'ppMax' => 16],
    ['id' => 'patrick', 'label' => 'St. Patrick', 'weight' => 8, 'ppMin' => 12, 'ppMax' => 18],
    ['id' => 'michael', 'label' => 'St. Michael', 'weight' => 8, 'ppMin' => 20, 'ppMax' => 26],
    ['id' => 'joan', 'label' => 'St. Joan of Arc', 'weight' => 7, 'ppMin' => 22, 'ppMax' => 28],
    ['id' => 'augustine', 'label' => 'St. Augustine', 'weight' => 7, 'ppMin' => 18, 'ppMax' => 24],
    ['id' => 'joseph', 'label' => 'St. Joseph', 'weight' => 5, 'ppMin' => 35, 'ppMax' => 45],
    ['id' => 'jude_wheel', 'label' => 'St. Jude', 'weight' => 5, 'ppMin' => 38, 'ppMax' => 50],
    ['id' => 'peter', 'label' => 'St. Peter', 'weight' => 8, 'ppMin' => 14, 'ppMax' => 20],
    ['id' => 'maria', 'label' => 'Our Lady', 'weight' => 8, 'ppMin' => 16, 'ppMax' => 22],
];

function pick_weighted_saint($saints) {
    $total = array_sum(array_column($saints, 'weight'));
    $roll = mt_rand(1, $total);
    $acc = 0;
    foreach ($saints as $s) {
        $acc += $s['weight'];
        if ($roll <= $acc) {
            return $s;
        }
    }
    return $saints[0];
}

try {
    $envVars = cec_load_env();
    $data = json_decode(file_get_contents('php://input'), true);
    $sessionId = trim($data['sessionId'] ?? '');

    if ($sessionId === '' || strlen($sessionId) > 36) {
        throw new Exception('Invalid session');
    }

    $conn = cec_db_connect($envVars);
    cec_ensure_tables($conn);

    $today = date('Y-m-d');
    $check = $conn->prepare('SELECT id FROM cec_wheel_spins WHERE session_id = ? AND spin_date = ?');
    $check->bind_param('ss', $sessionId, $today);
    $check->execute();
    $check->store_result();
    if ($check->num_rows > 0) {
        $check->close();
        $conn->close();
        http_response_code(409);
        echo json_encode(['success' => false, 'error' => 'Already spun today for this worshiper.']);
        exit();
    }
    $check->close();

    $saint = pick_weighted_saint($SAINTS);
    $points = mt_rand($saint['ppMin'], $saint['ppMax']);

    $stmt = $conn->prepare(
        'INSERT INTO cec_wheel_spins (session_id, spin_date, saint_id, saint_label, points_awarded)
         VALUES (?, ?, ?, ?, ?)'
    );
    $stmt->bind_param('ssssi', $sessionId, $today, $saint['id'], $saint['label'], $points);
    if (!$stmt->execute()) {
        throw new Exception('Failed to record spin');
    }

    $stmt->close();
    $conn->close();

    echo json_encode([
        'success' => true,
        'saintId' => $saint['id'],
        'saintLabel' => $saint['label'],
        'points' => $points,
    ]);
} catch (Exception $e) {
    error_log('cec-wheel-spin: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
