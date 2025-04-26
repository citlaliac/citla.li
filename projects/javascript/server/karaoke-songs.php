<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Initialize logging
$logFile = __DIR__ . '/karaoke-logs.txt';
function logMessage($message) {
    global $logFile;
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] $message\n";
    file_put_contents($logFile, $logEntry, FILE_APPEND);
}

logMessage("Script started");

// Load environment variables
$envFile = __DIR__ . '/.env';
if (!file_exists($envFile)) {
    logMessage("Error: .env file not found at " . $envFile);
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Configuration error: .env file not found']);
    exit;
}

$envVars = parse_ini_file($envFile);
if (!$envVars) {
    logMessage("Error: Failed to parse .env file");
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Configuration error: Failed to parse .env']);
    exit;
}

if (!isset($envVars['MYSQL_PASSWORD'])) {
    logMessage("Error: MYSQL_PASSWORD not set in .env");
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Configuration error: MYSQL_PASSWORD not set']);
    exit;
}

// Database configuration
$db_host = '127.0.0.1';
$db_user = 'citlwqfk_submissions';
$db_pass = $envVars['MYSQL_PASSWORD'];
$db_name = 'citlwqfk_submissions';
$db_charset = 'latin1';

logMessage("Attempting database connection with host: $db_host, user: $db_user, db: $db_name");

try {
    // Create database connection
    $dsn = "mysql:host=$db_host;dbname=$db_name;charset=$db_charset";
    $pdo = new PDO($dsn, $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Set the timezone offset for Eastern Time (UTC-4)
    $pdo->exec("SET time_zone = '-04:00'");
    
    logMessage("Database connection established successfully");

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        logMessage("Processing GET request");
        // Fetch all songs with their played status
        $query = "SELECT id, song_title, artist, last_played,
                  CASE 
                    WHEN last_played IS NOT NULL 
                    AND last_played >= DATE_SUB(NOW(), INTERVAL 24 HOUR) 
                    THEN 1 
                    ELSE 0 
                  END as recently_played 
                  FROM karaoke_songs 
                  ORDER BY id ASC";
        
        logMessage("Executing query: " . $query);
        $stmt = $pdo->prepare($query);
        $stmt->execute();
        $songs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Log the first few songs to debug
        logMessage("Sample song data:");
        foreach (array_slice($songs, 0, 3) as $song) {
            logMessage("Song ID: " . $song['id'] . 
                      ", Title: " . $song['song_title'] . 
                      ", Last Played: " . ($song['last_played'] ?? 'NULL') . 
                      ", Recently Played: " . $song['recently_played']);
        }
        
        logMessage("Successfully fetched " . count($songs) . " songs");
        echo json_encode(['success' => true, 'songs' => $songs]);

    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        logMessage("Processing POST request");
        // Get POST data
        $data = json_decode(file_get_contents('php://input'), true);
        logMessage("Received POST data: " . json_encode($data));

        if (!isset($data['songId']) || !is_numeric($data['songId'])) {
            logMessage("Error: Invalid song ID provided");
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid song ID']);
            exit;
        }

        // Check if songId is negative (reset last_played)
        if ($data['songId'] < 0) {
            $query = "UPDATE karaoke_songs SET last_played = NULL WHERE id = ?";
            logMessage("Resetting last_played for song ID: " . abs($data['songId']));
            $stmt = $pdo->prepare($query);
            $result = $stmt->execute([abs($data['songId'])]);
        } else {
            // Update last_played timestamp - NOW() will now use Eastern Time
            $query = "UPDATE karaoke_songs SET last_played = NOW() WHERE id = ?";
            logMessage("Setting last_played to current time for song ID: " . $data['songId']);
            $stmt = $pdo->prepare($query);
            $result = $stmt->execute([$data['songId']]);
        }

        if ($result && $stmt->rowCount() > 0) {
            logMessage("Successfully updated song ID: " . abs($data['songId']));
            echo json_encode(['success' => true]);
        } else {
            logMessage("Error: Song ID not found: " . abs($data['songId']));
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Song not found']);
        }
    }

} catch (PDOException $e) {
    logMessage("Database error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error occurred: ' . $e->getMessage()]);
} catch (Exception $e) {
    logMessage("General error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'An error occurred: ' . $e->getMessage()]);
} 