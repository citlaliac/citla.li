<?php
/**
 * Shared Perspective API moderation (guestbook + Catholic e Cloud bulletin).
 */

function cec_moderate_text($text, $apiKey, $threshold = 0.7) {
    if (empty($apiKey)) {
        throw new Exception('Content moderation service not configured: Missing API key');
    }

    $perspectiveUrl = 'https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=' . urlencode($apiKey);
    $perspectiveData = [
        'comment' => ['text' => $text],
        'requestedAttributes' => [
            'TOXICITY' => ['scoreType' => 'PROBABILITY'],
            'SEVERE_TOXICITY' => ['scoreType' => 'PROBABILITY'],
            'IDENTITY_ATTACK' => ['scoreType' => 'PROBABILITY'],
            'INSULT' => ['scoreType' => 'PROBABILITY'],
            'PROFANITY' => ['scoreType' => 'PROBABILITY'],
            'THREAT' => ['scoreType' => 'PROBABILITY'],
        ],
        'languages' => ['en'],
        'doNotStore' => true,
    ];

    $ch = curl_init($perspectiveUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($perspectiveData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

    $perspectiveResponse = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        error_log('Perspective API error: ' . $perspectiveResponse);
        throw new Exception('Content moderation service error');
    }

    $perspectiveResult = json_decode($perspectiveResponse, true);
    $isToxic = false;
    $toxicAttributes = [];

    foreach ($perspectiveResult['attributeScores'] as $attribute => $score) {
        $value = $score['summaryScore']['value'];
        if ($value > $threshold) {
            $isToxic = true;
            $toxicAttributes[] = $attribute;
        }
    }

    return [
        'isToxic' => $isToxic,
        'toxicAttributes' => $toxicAttributes,
        'moderation_status' => $isToxic ? implode(', ', $toxicAttributes) : 'approved',
        'is_moderated' => $isToxic ? 0 : 1,
    ];
}

function cec_send_json_cors($methods = 'GET, POST, OPTIONS') {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowed = ['https://citla.li', 'http://localhost:3000'];
    if (in_array($origin, $allowed, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
    } else {
        header('Access-Control-Allow-Origin: https://citla.li');
    }
    header('Content-Type: application/json');
    header('Access-Control-Allow-Methods: ' . $methods);
    header('Access-Control-Allow-Headers: Content-Type');
}

function cec_handle_options() {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

function cec_load_env() {
    $envFile = __DIR__ . '/.env';
    if (!file_exists($envFile)) {
        throw new Exception('.env file not found');
    }
    $envVars = parse_ini_file($envFile);
    if ($envVars === false) {
        throw new Exception('Failed to parse .env file');
    }
    return $envVars;
}

function cec_db_connect($envVars) {
    $conn = new mysqli(
        '127.0.0.1',
        'citlwqfk_submissions',
        $envVars['MYSQL_PASSWORD'] ?? '',
        'citlwqfk_submissions'
    );
    if ($conn->connect_error) {
        throw new Exception('Database connection failed');
    }
    $conn->set_charset('utf8mb4');
    return $conn;
}

function cec_ensure_tables($conn) {
    $conn->query("CREATE TABLE IF NOT EXISTS cec_bulletin (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(36) NOT NULL,
        display_name VARCHAR(24) NOT NULL,
        rank_label VARCHAR(32) NOT NULL,
        body VARCHAR(280) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_moderated TINYINT(1) DEFAULT 0,
        moderation_status VARCHAR(255) NULL,
        INDEX idx_bulletin_visible (is_moderated, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $conn->query("CREATE TABLE IF NOT EXISTS cec_wheel_spins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(36) NOT NULL,
        spin_date DATE NOT NULL,
        saint_id VARCHAR(32) NOT NULL,
        saint_label VARCHAR(64) NOT NULL,
        points_awarded INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY one_spin_per_day (session_id, spin_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
}
