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

logMessage("Request received: " . $_SERVER['REQUEST_METHOD']);

// Load environment variables
$envFile = __DIR__ . '/.env';
$envVars = parse_ini_file($envFile);

if (!$envVars) {
    logMessage("Error: Failed to load .env file");
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Configuration error']);
    exit;
}

// Database configuration
$db_host = '127.0.0.1';
$db_user = 'citlwqfk_submissions';
$db_pass = $envVars['MYSQL_PASSWORD'];
$db_name = 'citlwqfk_submissions';
$db_charset = 'latin1';

try {
    // Create database connection
    $dsn = "mysql:host=$db_host;dbname=$db_name;charset=$db_charset";
    $pdo = new PDO($dsn, $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Set the timezone to Eastern Time
    $pdo->exec("SET time_zone = 'America/New_York'");
    
    logMessage("Database connection established");

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Fetch all songs with their played status
        $query = "SELECT *, 
                  CASE 
                    WHEN last_played IS NOT NULL 
                    AND last_played >= DATE_SUB(NOW(), INTERVAL 24 HOUR) 
                    THEN 1 
                    ELSE 0 
                  END as recently_played 
                  FROM karaoke_songs 
                  ORDER BY id ASC";
        
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
        // Get POST data
        $data = json_decode(file_get_contents('php://input'), true);
        logMessage("Received POST data: " . json_encode($data));

        if (!isset($data['songId']) || !is_numeric($data['songId'])) {
            logMessage("Error: Invalid song ID provided");
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid song ID']);
            exit;
        }

        // Update last_played timestamp - NOW() will now use Eastern Time
        $query = "UPDATE karaoke_songs SET last_played = NOW() WHERE id = ?";
        $stmt = $pdo->prepare($query);
        $result = $stmt->execute([$data['songId']]);

        if ($result && $stmt->rowCount() > 0) {
            logMessage("Successfully updated song ID: " . $data['songId']);
            echo json_encode(['success' => true]);
        } else {
            logMessage("Error: Song ID not found: " . $data['songId']);
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Song not found']);
        }
    }

} catch (PDOException $e) {
    logMessage("Database error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error occurred']);
} catch (Exception $e) {
    logMessage("General error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'An error occurred']);
} 