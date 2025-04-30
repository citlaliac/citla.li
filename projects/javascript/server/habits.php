<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Access-Control-Max-Age: 86400');

// Enable error logging
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors to the client
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/habits_error.log');

// Set PHP timezone to NYC
date_default_timezone_set('America/New_York');

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
    
    if ($conn->connect_error) {
        throw new Exception('Database connection failed: ' . $conn->connect_error);
    }

    // Verify database connection
    if (!$conn->ping()) {
        throw new Exception('Database connection lost');
    }

    $conn->set_charset($db_charset);

    // Get the request method and data
    $method = $_SERVER['REQUEST_METHOD'];
    $data = json_decode(file_get_contents('php://input'), true);
    $date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');
    
    error_log("Request method: " . $method);
    error_log("Date parameter: " . $date);
    error_log("Request data: " . json_encode($data));

    // Verify required tables exist
    $tables = ['habits', 'habit_logs'];
    foreach ($tables as $table) {
        $result = $conn->query("SHOW TABLES LIKE '$table'");
        if ($result->num_rows == 0) {
            throw new Exception("Required table '$table' does not exist");
        }
    }

    switch ($method) {
        case 'GET':
            if (isset($_GET['get_completed_dates'])) {
                // Get all completed dates for the current year
                $currentYear = date('Y');
                $stmt = $conn->prepare("
                    SELECT DISTINCT date 
                    FROM habit_logs 
                    WHERE completed = 1 
                    AND YEAR(date) = ?
                    ORDER BY date ASC
                ");

                if (!$stmt) {
                    throw new Exception('Failed to prepare completed dates statement: ' . $conn->error);
                }

                $stmt->bind_param("s", $currentYear);
                if (!$stmt->execute()) {
                    throw new Exception('Failed to execute completed dates statement: ' . $stmt->error);
                }

                $result = $stmt->get_result();
                $dates = [];
                while ($row = $result->fetch_assoc()) {
                    $dates[] = $row['date'];
                }

                echo json_encode(['success' => true, 'dates' => $dates]);
                break;
            }

            // Get all habits and their status for the given date
            $stmt = $conn->prepare("
                SELECT 
                    h.id, 
                    h.name, 
                    h.description,
                    COALESCE(hl.completed, 0) as completed,
                    (SELECT COUNT(*) FROM habit_logs WHERE habit_id = h.id AND completed = 1) as days_completed,
                    (
                        SELECT ROUND(
                            (COUNT(*) * 100.0) / 
                            (DATEDIFF(CURDATE(), '2024-04-25') + 1)
                        )
                        FROM habit_logs 
                        WHERE habit_id = h.id 
                        AND completed = 1 
                        AND date >= '2024-04-25'
                    ) as completion_percentage
                FROM habits h
                LEFT JOIN habit_logs hl ON h.id = hl.habit_id AND hl.date = ?
                ORDER BY h.created_at ASC
            ");

            if (!$stmt) {
                throw new Exception('Failed to prepare GET statement: ' . $conn->error);
            }

            $stmt->bind_param("s", $date);
            if (!$stmt->execute()) {
                throw new Exception('Failed to execute GET statement: ' . $stmt->error);
            }

            $result = $stmt->get_result();
            $habits = [];
            while ($row = $result->fetch_assoc()) {
                $habits[] = $row;
            }
            error_log("Retrieved " . count($habits) . " habits for date " . $date);
            echo json_encode(['success' => true, 'habits' => $habits]);
            break;

        case 'POST':
            // Get POST data
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['habit_id']) || !isset($data['completed'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Missing required fields']);
                exit();
            }

            $habit_id = $data['habit_id'];
            $completed = $data['completed'] ? 1 : 0;
            $date = isset($data['date']) ? $data['date'] : date('Y-m-d');

            // First check if a log entry exists for this date
            $check_sql = "SELECT id FROM habit_logs WHERE habit_id = ? AND date = ?";
            $check_stmt = $conn->prepare($check_sql);
            $check_stmt->bind_param("is", $habit_id, $date);
            $check_stmt->execute();
            $result = $check_stmt->get_result();
            
            if ($result->num_rows > 0) {
                // Update existing log
                $update_sql = "UPDATE habit_logs SET completed = ? WHERE habit_id = ? AND date = ?";
                $update_stmt = $conn->prepare($update_sql);
                $update_stmt->bind_param("iis", $completed, $habit_id, $date);
                $update_stmt->execute();
            } else {
                // Insert new log
                $insert_sql = "INSERT INTO habit_logs (habit_id, completed, date) VALUES (?, ?, ?)";
                $insert_stmt = $conn->prepare($insert_sql);
                $insert_stmt->bind_param("iis", $habit_id, $completed, $date);
                $insert_stmt->execute();
            }

            // Get updated habit status
            $habit_sql = "SELECT h.*, 
                COALESCE(hl.completed, 0) as completed,
                (SELECT COUNT(*) FROM habit_logs WHERE habit_id = h.id AND completed = 1) as days_completed,
                (
                    SELECT ROUND(
                        (COUNT(*) * 100.0) / 
                        (DATEDIFF(CURDATE(), '2024-04-25') + 1)
                    )
                    FROM habit_logs 
                    WHERE habit_id = h.id 
                    AND completed = 1 
                    AND date >= '2024-04-25'
                ) as completion_percentage
                FROM habits h
                LEFT JOIN habit_logs hl ON h.id = hl.habit_id AND hl.date = ?
                WHERE h.id = ?";
            
            $habit_stmt = $conn->prepare($habit_sql);
            $habit_stmt->bind_param("si", $date, $habit_id);
            $habit_stmt->execute();
            $habit_result = $habit_stmt->get_result();
            $habit = $habit_result->fetch_assoc();

            echo json_encode(['success' => true, 'habit' => $habit]);
            break;

        default:
            error_log("Invalid request method: " . $method);
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
            break;
    }

    $conn->close();

} catch (Exception $e) {
    error_log("Error in habits.php: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?> 