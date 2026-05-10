<?php
/**
 * GET — returns approved kudos entries for public hall of fame.
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://citla.li');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$envFile = __DIR__ . '/.env';
if (!file_exists($envFile)) {
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
    $conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
    if ($conn->connect_error) {
        throw new Exception('Database connection failed');
    }
    $conn->set_charset('utf8mb4');

    $tableExists = $conn->query("SHOW TABLES LIKE 'kudos'");
    if (!$tableExists || $tableExists->num_rows === 0) {
        $conn->close();
        echo json_encode(['success' => true, 'entries' => []]);
        exit();
    }

    $result = $conn->query(
        "SELECT id, honoree_name, reason, created_at FROM kudos WHERE is_moderated = 1 ORDER BY created_at DESC"
    );

    if (!$result) {
        throw new Exception('Query failed: ' . $conn->error);
    }

    $entries = [];
    while ($row = $result->fetch_assoc()) {
        $entries[] = [
            'id' => (int) $row['id'],
            'name' => htmlspecialchars($row['honoree_name'], ENT_QUOTES, 'UTF-8'),
            'reason' => htmlspecialchars($row['reason'], ENT_QUOTES, 'UTF-8'),
            'date' => date('F j, Y', strtotime($row['created_at'])),
        ];
    }

    $conn->close();

    echo json_encode(['success' => true, 'entries' => $entries]);
} catch (Exception $e) {
    error_log('kudos-display.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
