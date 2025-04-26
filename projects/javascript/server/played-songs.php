<?php
header('Content-Type: application/json');
require_once 'database/db_connect.php';

$response = ['success' => false, 'message' => ''];

try {
    // Database configuration
    $db_host = '127.0.0.1';
    $db_user = 'citlwqfk_submissions';
    $db_pass = $envVars['MYSQL_PASSWORD'];
    $db_name = 'citlwqfk_played_songs';
    $db_charset = 'latin1';

    // Create database connection
    $db = new PDO(
        "mysql:host=$db_host;dbname=$db_name;charset=$db_charset",
        $db_user,
        $db_pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (isset($data['action'])) {
            switch ($data['action']) {
                case 'mark_played':
                    if (empty($data['song_title'])) {
                        throw new Exception('Song title is required');
                    }
                    
                    $stmt = $db->prepare("INSERT INTO played_songs (song_title) VALUES (?)");
                    $stmt->execute([$data['song_title']]);
                    $response['success'] = true;
                    $response['message'] = 'Song marked as played';
                    break;
                    
                case 'get_played_songs':
                    $stmt = $db->query("SELECT song_title, play_date FROM played_songs ORDER BY play_date DESC");
                    $response['songs'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    $response['success'] = true;
                    break;
            }
        }
    }
} catch (Exception $e) {
    $response['message'] = $e->getMessage();
    error_log("Error in played-songs.php: " . $e->getMessage());
}

echo json_encode($response); 