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
    ['id' => 'francis', 'label' => 'St. Francis of Assisi', 'weight' => 10, 'ppMin' => 8, 'ppMax' => 15, 'blurb' => 'Patron of animals, nature, and poverty. Birds and simple living.'],
    ['id' => 'anthony', 'label' => 'St. Anthony of Padua', 'weight' => 10, 'ppMin' => 10, 'ppMax' => 15, 'blurb' => 'Known for helping find lost things.'],
    ['id' => 'joan', 'label' => 'St. Joan of Arc', 'weight' => 10, 'ppMin' => 18, 'ppMax' => 26, 'blurb' => 'French warrior saint with visions and armor.'],
    ['id' => 'peter', 'label' => 'St. Peter', 'weight' => 10, 'ppMin' => 14, 'ppMax' => 20, 'blurb' => 'Apostle with the keys of heaven and the first pope.'],
    ['id' => 'therese', 'label' => 'St. Thérèse of Lisieux', 'weight' => 10, 'ppMin' => 8, 'ppMax' => 14, 'blurb' => 'The Little Flower. Roses and small acts of holiness.'],
    ['id' => 'drogo', 'label' => 'St. Drogo', 'weight' => 10, 'ppMin' => 12, 'ppMax' => 18, 'blurb' => 'Patron of unattractive people and coffeehouse owners, somehow.'],
    ['id' => 'bibiana', 'label' => 'St. Bibiana', 'weight' => 10, 'ppMin' => 10, 'ppMax' => 16, 'blurb' => 'Patron saint of hangovers.'],
    ['id' => 'genesius', 'label' => 'St. Genesius', 'weight' => 10, 'ppMin' => 14, 'ppMax' => 22, 'blurb' => 'Patron of actors and comedians — converted mid-performance.'],
    ['id' => 'vitus', 'label' => 'St. Vitus', 'weight' => 10, 'ppMin' => 16, 'ppMax' => 24, 'blurb' => 'Saint Vitus Dance sounds like a medieval indie band.'],
    ['id' => 'fiacre', 'label' => 'St. Fiacre', 'weight' => 10, 'ppMin' => 12, 'ppMax' => 20, 'blurb' => 'Patron of gardeners, cab drivers, and hemorrhoid sufferers.'],
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
        'blurb' => $saint['blurb'] ?? '',
        'points' => $points,
    ]);
} catch (Exception $e) {
    error_log('cec-wheel-spin: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
