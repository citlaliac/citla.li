<?php
/**
 * Meal planner — shared DB helpers.
 */

function meals_send_json_cors($methods = 'GET, POST, PUT, PATCH, DELETE, OPTIONS') {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowed = ['https://citla.li', 'http://localhost:3000'];
    if (in_array($origin, $allowed, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
    } else {
        header('Access-Control-Allow-Origin: https://citla.li');
    }
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Methods: ' . $methods);
    header('Access-Control-Allow-Headers: Content-Type');
}

function meals_handle_options() {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

function meals_load_env() {
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

function meals_db_connect($envVars) {
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

function meals_ensure_tables($conn) {
    $conn->query("CREATE TABLE IF NOT EXISTS meal_ingredients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        default_unit VARCHAR(32) NOT NULL DEFAULT 'each',
        category ENUM(
            'Protein', 'Legume', 'Vegetable', 'Fruit', 'Grain',
            'Herb', 'Dairy', 'Condiment', 'Other'
        ) NOT NULL DEFAULT 'Other',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_meal_ingredient_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $conn->query("CREATE TABLE IF NOT EXISTS meal_recipes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        category ENUM('Protein', 'Legume', 'Salad', 'Vegetable', 'Full Meal') NOT NULL DEFAULT 'Full Meal',
        servings INT NOT NULL DEFAULT 4,
        notes TEXT NULL,
        instructions TEXT NULL,
        tags JSON NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $conn->query("CREATE TABLE IF NOT EXISTS meal_recipe_ingredients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        recipe_id INT NOT NULL,
        ingredient_id INT NOT NULL,
        quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
        unit VARCHAR(32) NOT NULL DEFAULT 'each',
        FOREIGN KEY (recipe_id) REFERENCES meal_recipes(id) ON DELETE CASCADE,
        FOREIGN KEY (ingredient_id) REFERENCES meal_ingredients(id) ON DELETE RESTRICT,
        INDEX idx_recipe (recipe_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $conn->query("CREATE TABLE IF NOT EXISTS meal_weekly_plans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        week_start DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $conn->query("CREATE TABLE IF NOT EXISTS meal_weekly_plan_meals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        weekly_plan_id INT NOT NULL,
        day_of_week TINYINT NOT NULL,
        meal_type ENUM('lunch', 'dinner') NOT NULL,
        recipe_id INT NULL,
        FOREIGN KEY (weekly_plan_id) REFERENCES meal_weekly_plans(id) ON DELETE CASCADE,
        FOREIGN KEY (recipe_id) REFERENCES meal_recipes(id) ON DELETE SET NULL,
        UNIQUE KEY uk_plan_slot (weekly_plan_id, day_of_week, meal_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $conn->query("CREATE TABLE IF NOT EXISTS meal_shopping_lists (
        id INT AUTO_INCREMENT PRIMARY KEY,
        weekly_plan_id INT NOT NULL,
        generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (weekly_plan_id) REFERENCES meal_weekly_plans(id) ON DELETE CASCADE,
        UNIQUE KEY uk_plan_list (weekly_plan_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $conn->query("CREATE TABLE IF NOT EXISTS meal_shopping_list_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        shopping_list_id INT NOT NULL,
        ingredient_id INT NOT NULL,
        quantity DECIMAL(10, 2) NOT NULL,
        unit VARCHAR(32) NOT NULL,
        is_checked TINYINT(1) NOT NULL DEFAULT 0,
        FOREIGN KEY (shopping_list_id) REFERENCES meal_shopping_lists(id) ON DELETE CASCADE,
        FOREIGN KEY (ingredient_id) REFERENCES meal_ingredients(id) ON DELETE CASCADE,
        UNIQUE KEY uk_list_ingredient_unit (shopping_list_id, ingredient_id, unit)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
}

function meals_read_json_body() {
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function meals_json_error($message, $code = 400) {
    http_response_code($code);
    echo json_encode(['success' => false, 'error' => $message]);
    exit();
}

function meals_json_ok($payload) {
    echo json_encode(array_merge(['success' => true], $payload));
    exit();
}

function meals_decode_tags($json) {
    if ($json === null || $json === '') {
        return [];
    }
    $tags = json_decode($json, true);
    return is_array($tags) ? $tags : [];
}

function meals_encode_tags($tags) {
    if (!is_array($tags) || count($tags) === 0) {
        return null;
    }
    return json_encode(array_values($tags));
}

function meals_category_order_sql() {
    return "FIELD(category, 'Protein', 'Legume', 'Vegetable', 'Fruit', 'Grain', 'Herb', 'Dairy', 'Condiment', 'Other'), name ASC";
}
