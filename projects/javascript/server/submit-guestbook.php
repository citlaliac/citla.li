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
        throw new Exception('Failed to parse .env file');
    }
} else {
    error_log(".env file not found at: " . $envFile);
    throw new Exception('.env file not found');
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
    $location = $data['location'] ?? '';
    $message = $data['message'] ?? '';

    // Validate required fields
    if (empty($name) || empty($location)) {
        throw new Exception('Name and location are required');
    }

    // Get API key
    $apiKey = $envVars['PERSPECTIVE_API_KEY'] ?? '';

    if (empty($apiKey)) {
        error_log("Missing Perspective API key in .env file");
        throw new Exception('Content moderation service not configured: Missing API key');
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
    
    $perspectiveResponse = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    error_log("Perspective API Response: " . $perspectiveResponse);
    error_log("Perspective API HTTP Code: " . $httpCode);

    if ($httpCode !== 200) {
        error_log("Perspective API error: " . $perspectiveResponse);
        throw new Exception('Content moderation service error: ' . $perspectiveResponse);
    }

    $perspectiveResult = json_decode($perspectiveResponse, true);
    
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
        throw new Exception('Database connection failed: ' . $conn->connect_error);
    }

    // Check if table exists and has required columns
    $tableCheck = $conn->query("SHOW TABLES LIKE 'guestbook'");
    if ($tableCheck->num_rows == 0) {
        error_log("Guestbook table does not exist");
        throw new Exception('Guestbook table does not exist');
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
        throw new Exception('Failed to prepare statement: ' . $conn->error);
    }

    $is_moderated = $isToxic ? 0 : 1;
    $moderation_status = $isToxic ? implode(", ", $toxicAttributes) : "approved";
    
    $stmt->bind_param("sssis", $name, $location, $message, $is_moderated, $moderation_status);
    
    if (!$stmt->execute()) {
        error_log("Execute error: " . $stmt->error);
        throw new Exception('Failed to insert data: ' . $stmt->error);
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
        'moderated' => !$isToxic,
        'perspective_response' => $perspectiveResult
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