<?php
/**
 * Visitor Locations API Endpoint
 * 
 * This endpoint retrieves visitor location data from the database and returns it as JSON.
 * It's used by the VisitorMap component to display visitor locations on a map.
 */

// Set headers for CORS and JSON response
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Log request details
error_log("Visitor locations request received at " . date('Y-m-d H:i:s'));
error_log("Request method: " . $_SERVER['REQUEST_METHOD']);
error_log("Request URI: " . $_SERVER['REQUEST_URI']);

// Load environment variables from .env file
$envFile = __DIR__ . '/.env';
if (!file_exists($envFile)) {
    error_log('Error: .env file not found at ' . $envFile);
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Configuration error: .env file not found']);
    exit();
}

$envVars = parse_ini_file($envFile);
if ($envVars === false) {
    error_log('Error: Failed to parse .env file');
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Configuration error: Failed to parse .env file']);
    exit();
}

// Database configuration - using the same credentials as other visitor tracking files
$db_host = '127.0.0.1';
$db_user = 'citlwqfk_submissions';
$db_pass = $envVars['MYSQL_PASSWORD'];
$db_name = 'citlwqfk_visitors';
$db_charset = 'latin1';

// Log database configuration (without password)
error_log("Database config - Host: $db_host, User: $db_user, DB: $db_name, Charset: $db_charset");

// Mapping of country codes to coordinates
$countryCoordinates = [
    'US' => ['latitude' => 37.0902, 'longitude' => -95.7129],  // United States
    'GB' => ['latitude' => 55.3781, 'longitude' => -3.4360],   // United Kingdom
    'CA' => ['latitude' => 56.1304, 'longitude' => -106.3468], // Canada
    'AU' => ['latitude' => -25.2744, 'longitude' => 133.7751], // Australia
    'DE' => ['latitude' => 51.1657, 'longitude' => 10.4515],   // Germany
    'FR' => ['latitude' => 46.2276, 'longitude' => 2.2137],    // France
    'JP' => ['latitude' => 36.2048, 'longitude' => 138.2529],  // Japan
    'IN' => ['latitude' => 20.5937, 'longitude' => 78.9629],   // India
    'BR' => ['latitude' => -14.2350, 'longitude' => -51.9253], // Brazil
    'IT' => ['latitude' => 41.8719, 'longitude' => 12.5674],   // Italy
    'ES' => ['latitude' => 40.4637, 'longitude' => -3.7492],   // Spain
    'NL' => ['latitude' => 52.1326, 'longitude' => 5.2913],    // Netherlands
    'SE' => ['latitude' => 60.1282, 'longitude' => 18.6435],   // Sweden
    'CH' => ['latitude' => 46.8182, 'longitude' => 8.2275],    // Switzerland
    'AT' => ['latitude' => 47.5162, 'longitude' => 14.5501],   // Austria
    'BE' => ['latitude' => 50.5039, 'longitude' => 4.4699],    // Belgium
    'DK' => ['latitude' => 56.2639, 'longitude' => 9.5018],    // Denmark
    'FI' => ['latitude' => 61.9241, 'longitude' => 25.7482],   // Finland
    'IE' => ['latitude' => 53.4129, 'longitude' => -8.2439],   // Ireland
    'NO' => ['latitude' => 60.4720, 'longitude' => 8.4689],    // Norway
    'PT' => ['latitude' => 39.3999, 'longitude' => -8.2245],   // Portugal
    'RU' => ['latitude' => 61.5240, 'longitude' => 105.3188],  // Russia
    'SG' => ['latitude' => 1.3521, 'longitude' => 103.8198],   // Singapore
    'KR' => ['latitude' => 35.9078, 'longitude' => 127.7669],  // South Korea
    'MX' => ['latitude' => 23.6345, 'longitude' => -102.5528], // Mexico
    'NZ' => ['latitude' => -40.9006, 'longitude' => 174.8860], // New Zealand
    'PL' => ['latitude' => 51.9194, 'longitude' => 19.1451],   // Poland
    'TR' => ['latitude' => 38.9637, 'longitude' => 35.2433],   // Turkey
    'ZA' => ['latitude' => -30.5595, 'longitude' => 22.9375],  // South Africa
    'AR' => ['latitude' => -38.4161, 'longitude' => -63.6167], // Argentina
    'CL' => ['latitude' => -35.6751, 'longitude' => -71.5430], // Chile
    'CO' => ['latitude' => 4.5709, 'longitude' => -74.2973],   // Colombia
    'PE' => ['latitude' => -9.1899, 'longitude' => -75.0152],  // Peru
    'VE' => ['latitude' => 6.4238, 'longitude' => -66.5897],   // Venezuela
    'ID' => ['latitude' => -0.7893, 'longitude' => 113.9213],  // Indonesia
    'MY' => ['latitude' => 4.2105, 'longitude' => 101.9758],   // Malaysia
    'PH' => ['latitude' => 12.8797, 'longitude' => 121.7740],  // Philippines
    'TH' => ['latitude' => 15.8700, 'longitude' => 100.9925],  // Thailand
    'VN' => ['latitude' => 14.0583, 'longitude' => 108.2772],  // Vietnam
    'EG' => ['latitude' => 26.8206, 'longitude' => 30.8025],   // Egypt
    'NG' => ['latitude' => 9.0820, 'longitude' => 8.6753],     // Nigeria
    'KE' => ['latitude' => -0.0236, 'longitude' => 37.9062],   // Kenya
    'SA' => ['latitude' => 23.8859, 'longitude' => 45.0792],   // Saudi Arabia
    'AE' => ['latitude' => 23.4241, 'longitude' => 53.8478],   // UAE
    'IL' => ['latitude' => 31.0461, 'longitude' => 34.8516],   // Israel
    'CN' => ['latitude' => 35.8617, 'longitude' => 104.1954],  // China
    'HK' => ['latitude' => 22.3964, 'longitude' => 114.1095],  // Hong Kong
    'TW' => ['latitude' => 23.6978, 'longitude' => 120.9605],  // Taiwan
];

try {
    // Create database connection with error handling
    error_log("Attempting database connection...");
    $dsn = "mysql:host=$db_host;dbname=$db_name;charset=$db_charset";
    error_log("DSN: " . $dsn);
    
    $db = new PDO($dsn, $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    error_log("Database connection successful");

    // Verify table exists
    error_log("Checking if visitors table exists...");
    $tableCheck = $db->query("SHOW TABLES LIKE 'visitors'");
    if ($tableCheck->rowCount() === 0) {
        throw new Exception("Table 'visitors' does not exist in database '$db_name'");
    }
    error_log("Visitors table exists");

    // Get table structure
    error_log("Getting table structure...");
    $columns = $db->query("SHOW COLUMNS FROM visitors")->fetchAll(PDO::FETCH_COLUMN);
    error_log("Table columns: " . implode(', ', $columns));

    // Query to get visitor data grouped by country code
    error_log("Executing visitor locations query...");
    $stmt = $db->query('
        SELECT 
            country,
            COUNT(*) as count,
            MIN(created_at) as first_visit,
            MAX(created_at) as last_visit
        FROM visitors 
        WHERE country IS NOT NULL
        GROUP BY country
        ORDER BY count DESC
    ');
    
    $locations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    error_log("Query successful. Found " . count($locations) . " locations");

    // Format the data for the map component
    $formattedLocations = array_map(function($location) use ($countryCoordinates) {
        $countryCode = $location['country'];
        $coordinates = $countryCoordinates[$countryCode] ?? null;
        
        if (!$coordinates) {
            error_log("Warning: No coordinates found for country code: $countryCode");
            return null; // Skip this location
        }
        
        return [
            'country' => $countryCode,
            'count' => (int)$location['count'],
            'firstVisit' => $location['first_visit'],
            'lastVisit' => $location['last_visit'],
            'latitude' => $coordinates['latitude'],
            'longitude' => $coordinates['longitude']
        ];
    }, $locations);

    // Filter out null values (countries without coordinates)
    $formattedLocations = array_filter($formattedLocations);

    // Return the locations as JSON with success status
    $response = [
        'success' => true,
        'data' => array_values($formattedLocations) // Reindex array after filtering
    ];
    error_log("Sending response with " . count($formattedLocations) . " formatted locations");
    echo json_encode($response);

} catch (PDOException $e) {
    // Handle database-specific errors
    error_log('Database error: ' . $e->getMessage());
    error_log('Error code: ' . $e->getCode());
    error_log('Error trace: ' . $e->getTraceAsString());
    error_log('DSN used: ' . $dsn);
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage(),
        'code' => $e->getCode(),
        'details' => 'Check server logs for more information'
    ]);
} catch (Exception $e) {
    // Handle any other errors
    error_log('General error: ' . $e->getMessage());
    error_log('Error trace: ' . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?> 