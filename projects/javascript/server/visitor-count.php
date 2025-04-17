<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'db.php';

try {
    $conn = getDbConnection();
    
    // Get total count of unique visitors
    $stmt = $conn->query("SELECT COUNT(DISTINCT ip_address) as count FROM visitors");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'count' => $result['count']
    ]);
} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'error' => 'Database error occurred'
    ]);
}
?> 