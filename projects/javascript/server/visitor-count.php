<?php
// Set timezone to Eastern Time
date_default_timezone_set('America/New_York');

// Log that the script was accessed
error_log("Visitor count script accessed at " . date('Y-m-d H:i:s'));

// Set headers
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

try {
    // Database configuration
    $db_host = '127.0.0.1';
    $db_user = 'citlwqfk_submissions';
    $db_pass = $envVars['MYSQL_PASSWORD'];
    $db_name = 'citlwqfk_visitors';
    $db_charset = 'latin1';

    // Log database config (excluding password)
    error_log("Database config - Host: $db_host, User: $db_user, DB: $db_name, Charset: $db_charset");

    // Create database connection
    $conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
    if ($conn->connect_error) {
        throw new Exception('Database connection failed: ' . $conn->connect_error);
    }
    $conn->set_charset($db_charset);

    // Get total count of all visitors
    $result = $conn->query("SELECT COUNT(*) as count FROM visitors");
    if (!$result) {
        throw new Exception('Failed to execute query: ' . $conn->error);
    }

    $row = $result->fetch_assoc();
    $count = $row['count'];

    // Log the count
    error_log("Total visitor count: " . $count);

    // Close connection
    $conn->close();

    // Return success response
    echo json_encode([
        'success' => true,
        'count' => $count
    ]);

} catch (Exception $e) {
    error_log("Error in visitor-count.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?> 