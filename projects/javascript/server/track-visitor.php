<?php
// Set timezone to Eastern Time
date_default_timezone_set('America/New_York');

// Log that the script was accessed
error_log("Track visitor script accessed at " . date('Y-m-d H:i:s'));

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://citla.li');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Log the request method
error_log("Request method: " . $_SERVER['REQUEST_METHOD']);


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

    // Get raw POST data
    $rawData = file_get_contents('php://input');
    if ($rawData === false) {
        throw new Exception('Failed to read POST data');
    }

    // Log the raw data for debugging
    error_log("Raw POST data: " . $rawData);

    // Decode JSON data
    $data = json_decode($rawData, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON data: ' . json_last_error_msg());
    }

    // Get page URL from data
    $page_url = $data['page_url'] ?? '';

    // Get visitor information
    $ip_address = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'];
    $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
    $referrer = $_SERVER['HTTP_REFERER'] ?? '';

    // Get location data using IP
    $geoUrl = "http://ip-api.com/json/{$ip_address}";
    $geoData = @file_get_contents($geoUrl);
    if ($geoData === false) {
        $country = null;
        $city = null;
    } else {
        $geo = json_decode($geoData, true);
        $country = $geo['countryCode'] ?? null;
        $city = $geo['city'] ?? null;
    }

    // Create database connection
    $conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
    if ($conn->connect_error) {
        throw new Exception('Database connection failed: ' . $conn->connect_error);
    }
    $conn->set_charset($db_charset);

    // Get current time in ET
    $current_time = date('Y-m-d H:i:s');

    // Prepare and execute the insert statement
    $stmt = $conn->prepare("
        INSERT INTO visitors (
            ip_address, 
            user_agent, 
            referrer, 
            page_url, 
            country, 
            city,
            created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ");

    if (!$stmt) {
        throw new Exception('Failed to prepare statement: ' . $conn->error);
    }

    $stmt->bind_param("sssssss", $ip_address, $user_agent, $referrer, $page_url, $country, $city, $current_time);
    
    if (!$stmt->execute()) {
        throw new Exception('Failed to insert data: ' . $stmt->error);
    }

    // Close connections
    $stmt->close();
    $conn->close();

    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'Visitor tracked successfully',
        'timestamp' => $current_time . ' ET'
    ]);

} catch (Exception $e) {
    error_log("Error in track-visitor.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?> 