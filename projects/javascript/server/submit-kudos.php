<?php
/**
 * POST JSON: { "name": "...", "reason": "..." }
 * Optional env KUDOS_WRITE_KEY — if set, must match JSON field "writeKey" or header X-Kudos-Key.
 * Creates `kudos` table if missing (see schema-kudos.sql).
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://citla.li');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Kudos-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$envFile = __DIR__ . '/.env';
if (!file_exists($envFile)) {
    error_log('.env file not found at: ' . $envFile);
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server configuration missing']);
    exit();
}

$envVars = parse_ini_file($envFile);
if ($envVars === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Invalid server configuration']);
    exit();
}

$db_host = '127.0.0.1';
$db_user = 'citlwqfk_submissions';
$db_pass = $envVars['MYSQL_PASSWORD'] ?? '';
$db_name = 'citlwqfk_submissions';

try {
    $rawData = file_get_contents('php://input');
    $data = json_decode($rawData, true);

    if (!$data) {
        throw new Exception('Invalid JSON body');
    }

    $writeKey = trim($envVars['KUDOS_WRITE_KEY'] ?? '');
    if ($writeKey !== '') {
        $provided = $data['writeKey'] ?? '';
        $headerKey = $_SERVER['HTTP_X_KUDOS_KEY'] ?? '';
        if ($provided !== $writeKey && $headerKey !== $writeKey) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Unauthorized']);
            exit();
        }
    }

    $name = isset($data['name']) ? trim($data['name']) : '';
    $reason = isset($data['reason']) ? trim($data['reason']) : '';

    if ($name === '' || mb_strlen($name) > 255) {
        throw new Exception('Name is required (max 255 characters)');
    }
    if ($reason === '' || mb_strlen($reason) > 16000) {
        throw new Exception('Reason is required (max 16000 characters)');
    }

    $conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
    if ($conn->connect_error) {
        throw new Exception('Database connection failed');
    }
    $conn->set_charset('utf8mb4');

    $conn->query("CREATE TABLE IF NOT EXISTS kudos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        honoree_name VARCHAR(255) NOT NULL,
        reason TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_moderated TINYINT(1) DEFAULT 1,
        moderation_status VARCHAR(255) DEFAULT 'approved'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $stmt = $conn->prepare(
        'INSERT INTO kudos (honoree_name, reason, created_at, is_moderated, moderation_status) VALUES (?, ?, NOW(), 1, ?)'
    );
    if (!$stmt) {
        throw new Exception('Prepare failed: ' . $conn->error);
    }

    $modStatus = 'approved';
    $stmt->bind_param('sss', $name, $reason, $modStatus);

    if (!$stmt->execute()) {
        throw new Exception('Insert failed: ' . $stmt->error);
    }

    $stmt->close();
    $conn->close();

    echo json_encode([
        'success' => true,
        'message' => 'Kudos saved',
    ]);
} catch (Exception $e) {
    error_log('submit-kudos.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
