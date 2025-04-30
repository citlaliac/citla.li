<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Access-Control-Max-Age: 86400');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Load environment variables
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $envVars = parse_ini_file($envFile);
    if ($envVars === false) {
        error_log("Failed to parse .env file");
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Server configuration error']);
        exit();
    }
} else {
    error_log(".env file not found at: " . $envFile);
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server configuration error']);
    exit();
}

// Database configuration
$db_host = '127.0.0.1';
$db_user = 'citlwqfk_submissions';
$db_pass = $envVars['MYSQL_PASSWORD'];
$db_name = 'citlwqfk_submissions';
$db_charset = 'latin1';

try {
    // Create database connection
    $conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
    $conn->set_charset($db_charset);

    if ($conn->connect_error) {
        throw new Exception('Database connection failed');
    }

    // Get the request method and data
    $method = $_SERVER['REQUEST_METHOD'];
    $data = json_decode(file_get_contents('php://input'), true);

    switch ($method) {
        case 'GET':
            // Get all habits
            $result = $conn->query("SELECT * FROM habits ORDER BY created_at ASC");
            $habits = [];
            while ($row = $result->fetch_assoc()) {
                $habits[] = $row;
            }
            echo json_encode(['success' => true, 'habits' => $habits]);
            break;

        case 'POST':
            if (!isset($data['name'])) {
                throw new Exception('Name is required');
            }

            $name = trim($data['name']);
            $description = isset($data['description']) ? trim($data['description']) : '';

            if (strlen($name) > 100) {
                throw new Exception('Name must be less than 100 characters');
            }

            if (strlen($description) > 500) {
                throw new Exception('Description must be less than 500 characters');
            }

            $stmt = $conn->prepare("INSERT INTO habits (name, description) VALUES (?, ?)");
            $stmt->bind_param("ss", $name, $description);

            if (!$stmt->execute()) {
                throw new Exception('Failed to create habit');
            }

            $habitId = $stmt->insert_id;
            echo json_encode(['success' => true, 'habit_id' => $habitId]);
            break;

        case 'PUT':
            if (!isset($data['id']) || !isset($data['name'])) {
                throw new Exception('ID and name are required');
            }

            $id = (int)$data['id'];
            $name = trim($data['name']);
            $description = isset($data['description']) ? trim($data['description']) : '';

            if (strlen($name) > 100) {
                throw new Exception('Name must be less than 100 characters');
            }

            if (strlen($description) > 500) {
                throw new Exception('Description must be less than 500 characters');
            }

            $stmt = $conn->prepare("UPDATE habits SET name = ?, description = ? WHERE id = ?");
            $stmt->bind_param("ssi", $name, $description, $id);

            if (!$stmt->execute()) {
                throw new Exception('Failed to update habit');
            }

            echo json_encode(['success' => true]);
            break;

        case 'DELETE':
            if (!isset($data['id'])) {
                throw new Exception('ID is required');
            }

            $id = (int)$data['id'];
            $stmt = $conn->prepare("DELETE FROM habits WHERE id = ?");
            $stmt->bind_param("i", $id);

            if (!$stmt->execute()) {
                throw new Exception('Failed to delete habit');
            }

            echo json_encode(['success' => true]);
            break;

        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
            break;
    }

    $conn->close();

} catch (Exception $e) {
    error_log("Error in manage-habits.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?> 