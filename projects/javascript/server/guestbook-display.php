<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://citla.li');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

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
    }
} else {
    error_log(".env file not found at: " . $envFile);
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
        error_log("Database connection error: " . $conn->connect_error);
        throw new Exception('Database connection failed: ' . $conn->connect_error);
    }

    // Get only moderated guestbook entries
    $result = $conn->query("
        SELECT name, location, message, created_at 
        FROM guestbook 
        WHERE is_moderated = 1
        ORDER BY created_at DESC
    ");

    if (!$result) {
        error_log("Query error: " . $conn->error);
        throw new Exception('Failed to fetch guestbook entries');
    }

    $entries = [];
    while ($row = $result->fetch_assoc()) {
        $entries[] = [
            'name' => htmlspecialchars($row['name']),
            'location' => htmlspecialchars($row['location']),
            'message' => htmlspecialchars($row['message']),
            'date' => date('F j, Y', strtotime($row['created_at']))
        ];
    }

    // Close connection
    $conn->close();

    // Return success response with entries
    $response = [
        'success' => true,
        'entries' => $entries
    ];
    echo json_encode($response);

} catch (Exception $e) {
    error_log("Error in guestbook-display.php: " . $e->getMessage());
    http_response_code(500);
    $response = [
        'success' => false,
        'error' => $e->getMessage()
    ];
    echo json_encode($response);
}
?> 