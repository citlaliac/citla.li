<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Access-Control-Max-Age: 86400'); // Cache preflight for 24 hours

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
    // Get POST data
    $rawData = file_get_contents('php://input');
    error_log("Received data: " . $rawData);
    
    if (empty($rawData)) {
        throw new Exception('No data received');
    }
    
    $data = json_decode($rawData, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid data format: ' . json_last_error_msg());
    }

    if (!$data) {
        throw new Exception('Invalid input data');
    }

    $name = isset($data['name']) ? trim($data['name']) : '';
    $location = isset($data['location']) ? trim($data['location']) : '';
    $message = isset($data['message']) ? trim($data['message']) : '';

    // Validate required fields
    if (empty($name)) {
        throw new Exception('Name is required');
    }
    if (empty($location)) {
        throw new Exception('Location is required');
    }

    // Validate field lengths
    if (strlen($name) > 50) {
        throw new Exception('Name must be less than 50 characters');
    }
    if (strlen($location) > 50) {
        throw new Exception('Location must be less than 50 characters');
    }
    if (strlen($message) > 500) {
        throw new Exception('Message must be less than 500 characters');
    }

    // Get API key
    $apiKey = $envVars['PERSPECTIVE_API_KEY'] ?? '';

    if (empty($apiKey)) {
        error_log("Missing Perspective API key in .env file");
        throw new Exception('Content moderation service not configured');
    }

    // Combine name and message for moderation
    $textToModerate = $name . " " . $message;
    error_log("Text to moderate: " . $textToModerate);
    
    // Call Perspective API
    $perspectiveUrl = "https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=" . urlencode($apiKey);
    $perspectiveData = [
        'comment' => ['text' => $textToModerate],
        'requestedAttributes' => [
            'TOXICITY' => ['scoreType' => 'PROBABILITY'],
            'SEVERE_TOXICITY' => ['scoreType' => 'PROBABILITY'],
            'IDENTITY_ATTACK' => ['scoreType' => 'PROBABILITY'],
            'INSULT' => ['scoreType' => 'PROBABILITY'],
            'PROFANITY' => ['scoreType' => 'PROBABILITY'],
            'THREAT' => ['scoreType' => 'PROBABILITY']
        ],
        'languages' => ['en'],
        'doNotStore' => true
    ];

    $ch = curl_init($perspectiveUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($perspectiveData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10); // 10 second timeout
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5); // 5 second connect timeout
    
    $perspectiveResponse = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        error_log("CURL Error: " . $curlError);
        throw new Exception('Content moderation service temporarily unavailable');
    }

    error_log("Perspective API Response: " . $perspectiveResponse);
    error_log("Perspective API HTTP Code: " . $httpCode);

    if ($httpCode !== 200) {
        error_log("Perspective API error: " . $perspectiveResponse);
        throw new Exception('Content moderation service temporarily unavailable');
    }

    $perspectiveResult = json_decode($perspectiveResponse, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Content moderation service error');
    }
    
    // Check if any attribute exceeds threshold (0.7 = 70% confidence)
    $threshold = 0.7;
    $isToxic = false;
    $toxicAttributes = [];
    
    foreach ($perspectiveResult['attributeScores'] as $attribute => $score) {
        $value = $score['summaryScore']['value'];
        error_log("Attribute: " . $attribute . " Score: " . $value);
        if ($value > $threshold) {
            $isToxic = true;
            $toxicAttributes[] = $attribute;
        }
    }

    error_log("Is Toxic: " . ($isToxic ? "Yes" : "No"));
    if ($isToxic) {
        error_log("Toxic Attributes: " . implode(", ", $toxicAttributes));
    }

    // Create database connection
    $conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
    $conn->set_charset($db_charset);

    if ($conn->connect_error) {
        error_log("Database connection error: " . $conn->connect_error);
        throw new Exception('Database connection failed');
    }

    // Check if table exists and has required columns
    $tableCheck = $conn->query("SHOW TABLES LIKE 'guestbook'");
    if ($tableCheck->num_rows == 0) {
        error_log("Guestbook table does not exist");
        throw new Exception('Database error');
    }

    // Check for required columns
    $columnsCheck = $conn->query("SHOW COLUMNS FROM guestbook");
    $hasModerationColumns = false;
    while ($column = $columnsCheck->fetch_assoc()) {
        if ($column['Field'] === 'is_moderated') {
            $hasModerationColumns = true;
            break;
        }
    }

    if (!$hasModerationColumns) {
        error_log("Adding moderation columns to guestbook table");
        $conn->query("ALTER TABLE guestbook ADD COLUMN is_moderated TINYINT(1) DEFAULT 0, ADD COLUMN moderation_status VARCHAR(255)");
    }

    // Prepare and execute the insert statement
    $stmt = $conn->prepare("INSERT INTO guestbook (name, location, message, created_at, is_moderated, moderation_status) VALUES (?, ?, ?, NOW(), ?, ?)");
    if (!$stmt) {
        error_log("Prepare statement error: " . $conn->error);
        throw new Exception('Database error');
    }

    $is_moderated = $isToxic ? 0 : 1;
    $moderation_status = $isToxic ? implode(", ", $toxicAttributes) : "approved";
    
    $stmt->bind_param("sssis", $name, $location, $message, $is_moderated, $moderation_status);
    
    if (!$stmt->execute()) {
        error_log("Execute error: " . $stmt->error);
        throw new Exception('Failed to save entry');
    }

    $insertId = $stmt->insert_id;
    error_log("Successfully inserted guestbook entry with ID: " . $insertId);

    // Close connections
    $stmt->close();
    $conn->close();

    // Return success response
    $response = [
        'success' => true,
        'message' => 'Guestbook entry submitted successfully',
        'moderated' => !$isToxic
    ];
    echo json_encode($response);

} catch (Exception $e) {
    error_log("Error in submit-guestbook.php: " . $e->getMessage());
    http_response_code(500);
    $response = [
        'success' => false,
        'error' => $e->getMessage()
    ];
    echo json_encode($response);
}
?> 