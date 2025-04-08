<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://citla.li');
header('Access-Control-Allow-Methods: POST, OPTIONS');
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
    // Get POST data
    $rawData = file_get_contents('php://input');
    error_log("Received data: " . $rawData);
    
    $data = json_decode($rawData, true);
    
    if (!$data) {
        error_log("JSON decode error: " . json_last_error_msg());
        throw new Exception('Invalid input data: ' . json_last_error_msg());
    }

    $name = $data['name'] ?? '';
    $email = $data['email'] ?? '';
    $message = $data['message'] ?? '';

    // Validate required fields
    if (empty($name) || empty($email)) {
        throw new Exception('Name and email are required');
    }

    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email format');
    }

    // Create database connection
    $conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
    $conn->set_charset($db_charset);

    if ($conn->connect_error) {
        error_log("Database connection error: " . $conn->connect_error);
        throw new Exception('Database connection failed: ' . $conn->connect_error);
    }

    // Prepare and execute the insert statement
    $stmt = $conn->prepare("INSERT INTO contacts (name, email, message, created_at) VALUES (?, ?, ?, NOW())");
    if (!$stmt) {
        error_log("Prepare statement error: " . $conn->error);
        throw new Exception('Failed to prepare statement: ' . $conn->error);
    }

    $stmt->bind_param("sss", $name, $email, $message);
    
    if (!$stmt->execute()) {
        error_log("Execute error: " . $stmt->error);
        throw new Exception('Failed to insert data: ' . $stmt->error);
    }

    // Close connections
    $stmt->close();
    $conn->close();

    // Return success response
    $response = [
        'success' => true,
        'message' => 'Contact form submitted successfully'
    ];
    echo json_encode($response);

} catch (Exception $e) {
    error_log("Error in submit-contact.php: " . $e->getMessage());
    http_response_code(500);
    $response = [
        'success' => false,
        'error' => $e->getMessage()
    ];
    echo json_encode($response);
}
?> 