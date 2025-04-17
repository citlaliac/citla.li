<?php
function getDbConnection() {
    // Check if we're in development mode (SQLite) or production (MySQL)
    if (file_exists('visitors.db')) {
        // Development mode - use SQLite
        return new PDO('sqlite:visitors.db');
    } else {
        // Production mode - use MySQL
        $host = getenv('DB_HOST');
        $dbname = getenv('DB_NAME');
        $username = getenv('DB_USER');
        $password = getenv('DB_PASS');
        
        return new PDO(
            "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
            $username,
            $password,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
    }
} 