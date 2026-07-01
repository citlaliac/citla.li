<?php
require_once __DIR__ . '/meals-db.php';

meals_send_json_cors('GET, POST, PUT, PATCH, DELETE, OPTIONS');
meals_handle_options();

$method = $_SERVER['REQUEST_METHOD'];
$resource = isset($_GET['resource']) ? trim($_GET['resource']) : '';
$id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
$action = isset($_GET['action']) ? trim($_GET['action']) : '';

try {
    $envVars = meals_load_env();
    $conn = meals_db_connect($envVars);
    meals_ensure_tables($conn);

    switch ($resource) {
        case 'ingredients':
            meals_handle_ingredients($conn, $method, $id);
            break;
        case 'recipes':
            meals_handle_recipes($conn, $method, $id);
            break;
        case 'plans':
            meals_handle_plans($conn, $method, $id);
            break;
        case 'shopping':
            meals_handle_shopping($conn, $method, $id, $action);
            break;
        default:
            meals_json_error('Unknown resource. Use resource=ingredients|recipes|plans|shopping', 404);
    }

    $conn->close();
} catch (Exception $e) {
    error_log('meals-api: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

function meals_handle_ingredients($conn, $method, $id) {
    if ($method === 'GET' && $id === 0) {
        $category = isset($_GET['category']) ? trim($_GET['category']) : '';
        $sql = 'SELECT id, name, default_unit AS defaultUnit, category FROM meal_ingredients';
        if ($category !== '') {
            $stmt = $conn->prepare($sql . ' WHERE category = ? ORDER BY ' . meals_category_order_sql());
            $stmt->bind_param('s', $category);
        } else {
            $stmt = $conn->prepare($sql . ' ORDER BY ' . meals_category_order_sql());
        }
        $stmt->execute();
        $result = $stmt->get_result();
        $items = [];
        while ($row = $result->fetch_assoc()) {
            $row['id'] = (int) $row['id'];
            $items[] = $row;
        }
        $stmt->close();
        meals_json_ok(['ingredients' => $items]);
    }

    if ($method === 'GET' && $id > 0) {
        $stmt = $conn->prepare('SELECT id, name, default_unit AS defaultUnit, category FROM meal_ingredients WHERE id = ?');
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        if (!$row) {
            meals_json_error('Ingredient not found', 404);
        }
        $row['id'] = (int) $row['id'];
        meals_json_ok(['ingredient' => $row]);
    }

    if ($method === 'POST') {
        $body = meals_read_json_body();
        $name = trim($body['name'] ?? '');
        $defaultUnit = trim($body['defaultUnit'] ?? 'each');
        $category = trim($body['category'] ?? 'Other');
        if ($name === '') {
            meals_json_error('Name is required');
        }
        $stmt = $conn->prepare('INSERT INTO meal_ingredients (name, default_unit, category) VALUES (?, ?, ?)');
        $stmt->bind_param('sss', $name, $defaultUnit, $category);
        if (!$stmt->execute()) {
            if ($conn->errno === 1062) {
                meals_json_error('An ingredient with that name already exists');
            }
            throw new Exception($stmt->error);
        }
        $newId = (int) $stmt->insert_id;
        $stmt->close();
        meals_json_ok(['id' => $newId]);
    }

    if ($method === 'PUT' && $id > 0) {
        $body = meals_read_json_body();
        $name = trim($body['name'] ?? '');
        $defaultUnit = trim($body['defaultUnit'] ?? 'each');
        $category = trim($body['category'] ?? 'Other');
        if ($name === '') {
            meals_json_error('Name is required');
        }
        $stmt = $conn->prepare('UPDATE meal_ingredients SET name = ?, default_unit = ?, category = ? WHERE id = ?');
        $stmt->bind_param('sssi', $name, $defaultUnit, $category, $id);
        if (!$stmt->execute()) {
            if ($conn->errno === 1062) {
                meals_json_error('An ingredient with that name already exists');
            }
            throw new Exception($stmt->error);
        }
        $stmt->close();
        meals_json_ok([]);
    }

    if ($method === 'DELETE' && $id > 0) {
        $check = $conn->prepare('SELECT COUNT(*) AS c FROM meal_recipe_ingredients WHERE ingredient_id = ?');
        $check->bind_param('i', $id);
        $check->execute();
        $count = (int) $check->get_result()->fetch_assoc()['c'];
        $check->close();
        if ($count > 0) {
            meals_json_error('Ingredient is used in recipes and cannot be deleted');
        }
        $stmt = $conn->prepare('DELETE FROM meal_ingredients WHERE id = ?');
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $stmt->close();
        meals_json_ok([]);
    }

    meals_json_error('Method not allowed', 405);
}

function meals_fetch_recipe_ingredients($conn, $recipeId) {
    $stmt = $conn->prepare(
        'SELECT ri.id, ri.ingredient_id AS ingredientId, ri.quantity, ri.unit,
                i.name AS ingredientName, i.category AS ingredientCategory
         FROM meal_recipe_ingredients ri
         JOIN meal_ingredients i ON i.id = ri.ingredient_id
         WHERE ri.recipe_id = ?
         ORDER BY i.name'
    );
    $stmt->bind_param('i', $recipeId);
    $stmt->execute();
    $result = $stmt->get_result();
    $rows = [];
    while ($row = $result->fetch_assoc()) {
        $row['id'] = (int) $row['id'];
        $row['ingredientId'] = (int) $row['ingredientId'];
        $row['quantity'] = (float) $row['quantity'];
        $rows[] = $row;
    }
    $stmt->close();
    return $rows;
}

function meals_row_to_recipe($row) {
    return [
        'id' => (int) $row['id'],
        'name' => $row['name'],
        'category' => $row['category'],
        'servings' => (int) $row['servings'],
        'notes' => $row['notes'],
        'instructions' => $row['instructions'],
        'tags' => meals_decode_tags($row['tags']),
    ];
}

function meals_handle_recipes($conn, $method, $id) {
    if ($method === 'GET' && $id === 0) {
        $category = isset($_GET['category']) ? trim($_GET['category']) : '';
        $tag = isset($_GET['tag']) ? trim($_GET['tag']) : '';
        $sql = 'SELECT id, name, category, servings, notes, instructions, tags FROM meal_recipes';
        $conditions = [];
        $params = [];
        $types = '';
        if ($category !== '') {
            $conditions[] = 'category = ?';
            $params[] = $category;
            $types .= 's';
        }
        if ($tag !== '') {
            $conditions[] = 'JSON_CONTAINS(tags, ?)';
            $params[] = json_encode($tag);
            $types .= 's';
        }
        if (count($conditions) > 0) {
            $sql .= ' WHERE ' . implode(' AND ', $conditions);
        }
        $sql .= ' ORDER BY name ASC';
        $stmt = $conn->prepare($sql);
        if ($types !== '') {
            $stmt->bind_param($types, ...$params);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        $recipes = [];
        while ($row = $result->fetch_assoc()) {
            $recipes[] = meals_row_to_recipe($row);
        }
        $stmt->close();
        meals_json_ok(['recipes' => $recipes]);
    }

    if ($method === 'GET' && $id > 0) {
        $stmt = $conn->prepare('SELECT id, name, category, servings, notes, instructions, tags FROM meal_recipes WHERE id = ?');
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        if (!$row) {
            meals_json_error('Recipe not found', 404);
        }
        $recipe = meals_row_to_recipe($row);
        $recipe['ingredients'] = meals_fetch_recipe_ingredients($conn, $id);
        meals_json_ok(['recipe' => $recipe]);
    }

    if ($method === 'POST') {
        $body = meals_read_json_body();
        meals_save_recipe($conn, null, $body);
    }

    if ($method === 'PUT' && $id > 0) {
        $body = meals_read_json_body();
        meals_save_recipe($conn, $id, $body);
    }

    if ($method === 'DELETE' && $id > 0) {
        $stmt = $conn->prepare('DELETE FROM meal_recipes WHERE id = ?');
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $stmt->close();
        meals_json_ok([]);
    }

    meals_json_error('Method not allowed', 405);
}

function meals_save_recipe($conn, $id, $body) {
    $name = trim($body['name'] ?? '');
    $category = trim($body['category'] ?? 'Full Meal');
    $servings = (int) ($body['servings'] ?? 4);
    $notes = $body['notes'] ?? null;
    $instructions = $body['instructions'] ?? null;
    $tagsJson = meals_encode_tags($body['tags'] ?? []);
    $ingredients = $body['ingredients'] ?? [];

    if ($name === '') {
        meals_json_error('Recipe name is required');
    }
    if ($servings < 1) {
        $servings = 1;
    }

    $conn->begin_transaction();
    try {
        if ($id === null) {
            $stmt = $conn->prepare(
                'INSERT INTO meal_recipes (name, category, servings, notes, instructions, tags) VALUES (?, ?, ?, ?, ?, ?)'
            );
            $stmt->bind_param('ssisss', $name, $category, $servings, $notes, $instructions, $tagsJson);
            $stmt->execute();
            $recipeId = (int) $stmt->insert_id;
            $stmt->close();
        } else {
            $recipeId = $id;
            $stmt = $conn->prepare(
                'UPDATE meal_recipes SET name = ?, category = ?, servings = ?, notes = ?, instructions = ?, tags = ? WHERE id = ?'
            );
            $stmt->bind_param('ssisssi', $name, $category, $servings, $notes, $instructions, $tagsJson, $recipeId);
            $stmt->execute();
            $stmt->close();
            $del = $conn->prepare('DELETE FROM meal_recipe_ingredients WHERE recipe_id = ?');
            $del->bind_param('i', $recipeId);
            $del->execute();
            $del->close();
        }

        if (is_array($ingredients)) {
            $ins = $conn->prepare(
                'INSERT INTO meal_recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES (?, ?, ?, ?)'
            );
            foreach ($ingredients as $ing) {
                $ingredientId = (int) ($ing['ingredientId'] ?? 0);
                $qty = (float) ($ing['quantity'] ?? 1);
                $unit = trim($ing['unit'] ?? 'each');
                if ($ingredientId <= 0) {
                    continue;
                }
                $ins->bind_param('iids', $recipeId, $ingredientId, $qty, $unit);
                $ins->execute();
            }
            $ins->close();
        }

        $conn->commit();
        meals_json_ok(['id' => $recipeId]);
    } catch (Exception $e) {
        $conn->rollback();
        throw $e;
    }
}

function meals_handle_plans($conn, $method, $id) {
    if ($method === 'GET' && $id === 0) {
        $result = $conn->query('SELECT id, name, week_start AS weekStart FROM meal_weekly_plans ORDER BY week_start DESC, id DESC');
        $plans = [];
        while ($row = $result->fetch_assoc()) {
            $row['id'] = (int) $row['id'];
            $plans[] = $row;
        }
        meals_json_ok(['plans' => $plans]);
    }

    if ($method === 'GET' && $id > 0) {
        $stmt = $conn->prepare('SELECT id, name, week_start AS weekStart FROM meal_weekly_plans WHERE id = ?');
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $plan = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        if (!$plan) {
            meals_json_error('Plan not found', 404);
        }
        $plan['id'] = (int) $plan['id'];
        $plan['meals'] = meals_fetch_plan_meals($conn, $id);
        meals_json_ok(['plan' => $plan]);
    }

    if ($method === 'POST') {
        $body = meals_read_json_body();
        $name = trim($body['name'] ?? 'Weekly plan');
        $weekStart = trim($body['weekStart'] ?? date('Y-m-d'));
        $stmt = $conn->prepare('INSERT INTO meal_weekly_plans (name, week_start) VALUES (?, ?)');
        $stmt->bind_param('ss', $name, $weekStart);
        $stmt->execute();
        $planId = (int) $stmt->insert_id;
        $stmt->close();
        if (!empty($body['meals']) && is_array($body['meals'])) {
            meals_save_plan_meals($conn, $planId, $body['meals']);
        }
        meals_json_ok(['id' => $planId]);
    }

    if ($method === 'PUT' && $id > 0) {
        $body = meals_read_json_body();
        $name = trim($body['name'] ?? 'Weekly plan');
        $weekStart = trim($body['weekStart'] ?? date('Y-m-d'));
        $stmt = $conn->prepare('UPDATE meal_weekly_plans SET name = ?, week_start = ? WHERE id = ?');
        $stmt->bind_param('ssi', $name, $weekStart, $id);
        $stmt->execute();
        $stmt->close();
        if (isset($body['meals']) && is_array($body['meals'])) {
            meals_save_plan_meals($conn, $id, $body['meals']);
        }
        meals_json_ok(['id' => $id]);
    }

    if ($method === 'DELETE' && $id > 0) {
        $stmt = $conn->prepare('DELETE FROM meal_weekly_plans WHERE id = ?');
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $stmt->close();
        meals_json_ok([]);
    }

    meals_json_error('Method not allowed', 405);
}

function meals_fetch_plan_meals($conn, $planId) {
    $stmt = $conn->prepare(
        'SELECT day_of_week AS dayOfWeek, meal_type AS mealType, recipe_id AS recipeId
         FROM meal_weekly_plan_meals WHERE weekly_plan_id = ?'
    );
    $stmt->bind_param('i', $planId);
    $stmt->execute();
    $result = $stmt->get_result();
    $meals = [];
    while ($row = $result->fetch_assoc()) {
        $meals[] = [
            'dayOfWeek' => (int) $row['dayOfWeek'],
            'mealType' => $row['mealType'],
            'recipeId' => $row['recipeId'] !== null ? (int) $row['recipeId'] : null,
        ];
    }
    $stmt->close();
    return $meals;
}

function meals_save_plan_meals($conn, $planId, $meals) {
    $del = $conn->prepare('DELETE FROM meal_weekly_plan_meals WHERE weekly_plan_id = ?');
    $del->bind_param('i', $planId);
    $del->execute();
    $del->close();

    $ins = $conn->prepare(
        'INSERT INTO meal_weekly_plan_meals (weekly_plan_id, day_of_week, meal_type, recipe_id) VALUES (?, ?, ?, ?)'
    );
    foreach ($meals as $meal) {
        $day = (int) ($meal['dayOfWeek'] ?? 0);
        $mealType = $meal['mealType'] ?? 'lunch';
        $recipeId = isset($meal['recipeId']) && $meal['recipeId'] !== '' && $meal['recipeId'] !== null
            ? (int) $meal['recipeId']
            : null;
        if ($day < 0 || $day > 6) {
            continue;
        }
        if ($mealType !== 'lunch' && $mealType !== 'dinner') {
            continue;
        }
        if ($recipeId === null) {
            $insNull = $conn->prepare(
                'INSERT INTO meal_weekly_plan_meals (weekly_plan_id, day_of_week, meal_type, recipe_id) VALUES (?, ?, ?, NULL)'
            );
            $insNull->bind_param('iis', $planId, $day, $mealType);
            $insNull->execute();
            $insNull->close();
        } else {
            $ins->bind_param('iisi', $planId, $day, $mealType, $recipeId);
            $ins->execute();
        }
    }
    $ins->close();
}

function meals_handle_shopping($conn, $method, $id, $action) {
    if ($method === 'POST' && $action === 'generate') {
        $body = meals_read_json_body();
        $planId = (int) ($body['planId'] ?? $_GET['planId'] ?? 0);
        if ($planId <= 0) {
            meals_json_error('planId is required');
        }
        meals_generate_shopping_list($conn, $planId);
    }

    if ($method === 'GET') {
        $planId = (int) ($_GET['planId'] ?? 0);
        if ($planId <= 0 && $id > 0) {
            $planId = $id;
        }
        if ($planId <= 0) {
            meals_json_error('planId is required');
        }
        $list = meals_get_shopping_list($conn, $planId);
        meals_json_ok(['shoppingList' => $list]);
    }

    if ($method === 'PATCH' && $action === 'toggle') {
        $body = meals_read_json_body();
        $itemId = (int) ($body['itemId'] ?? 0);
        $isChecked = !empty($body['isChecked']) ? 1 : 0;
        if ($itemId <= 0) {
            meals_json_error('itemId is required');
        }
        $stmt = $conn->prepare('UPDATE meal_shopping_list_items SET is_checked = ? WHERE id = ?');
        $stmt->bind_param('ii', $isChecked, $itemId);
        $stmt->execute();
        $stmt->close();
        meals_json_ok([]);
    }

    if ($method === 'POST' && $action === 'reset') {
        $body = meals_read_json_body();
        $planId = (int) ($body['planId'] ?? 0);
        if ($planId <= 0) {
            meals_json_error('planId is required');
        }
        $listId = meals_get_list_id_for_plan($conn, $planId);
        if ($listId) {
            $stmt = $conn->prepare('UPDATE meal_shopping_list_items SET is_checked = 0 WHERE shopping_list_id = ?');
            $stmt->bind_param('i', $listId);
            $stmt->execute();
            $stmt->close();
        }
        meals_json_ok([]);
    }

    meals_json_error('Method not allowed', 405);
}

function meals_get_list_id_for_plan($conn, $planId) {
    $stmt = $conn->prepare('SELECT id FROM meal_shopping_lists WHERE weekly_plan_id = ?');
    $stmt->bind_param('i', $planId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    return $row ? (int) $row['id'] : null;
}

function meals_generate_shopping_list($conn, $planId) {
    $sql = "SELECT ri.ingredient_id, ri.unit, SUM(ri.quantity) AS totalQty,
                   i.name, i.category
            FROM meal_weekly_plan_meals pm
            JOIN meal_recipe_ingredients ri ON ri.recipe_id = pm.recipe_id
            JOIN meal_ingredients i ON i.id = ri.ingredient_id
            WHERE pm.weekly_plan_id = ? AND pm.recipe_id IS NOT NULL
            GROUP BY ri.ingredient_id, ri.unit, i.name, i.category
            ORDER BY FIELD(i.category, 'Protein', 'Legume', 'Vegetable', 'Fruit', 'Grain', 'Herb', 'Dairy', 'Condiment', 'Other'), i.name";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param('i', $planId);
    $stmt->execute();
    $result = $stmt->get_result();
    $aggregated = [];
    while ($row = $result->fetch_assoc()) {
        $aggregated[] = $row;
    }
    $stmt->close();

    $conn->begin_transaction();
    try {
        $existingId = meals_get_list_id_for_plan($conn, $planId);
        if ($existingId) {
            $delItems = $conn->prepare('DELETE FROM meal_shopping_list_items WHERE shopping_list_id = ?');
            $delItems->bind_param('i', $existingId);
            $delItems->execute();
            $delItems->close();
            $listId = $existingId;
            $upd = $conn->prepare('UPDATE meal_shopping_lists SET generated_at = NOW() WHERE id = ?');
            $upd->bind_param('i', $listId);
            $upd->execute();
            $upd->close();
        } else {
            $ins = $conn->prepare('INSERT INTO meal_shopping_lists (weekly_plan_id) VALUES (?)');
            $ins->bind_param('i', $planId);
            $ins->execute();
            $listId = (int) $ins->insert_id;
            $ins->close();
        }

        $insItem = $conn->prepare(
            'INSERT INTO meal_shopping_list_items (shopping_list_id, ingredient_id, quantity, unit, is_checked)
             VALUES (?, ?, ?, ?, 0)'
        );
        foreach ($aggregated as $row) {
            $ingredientId = (int) $row['ingredient_id'];
            $qty = (float) $row['totalQty'];
            $unit = $row['unit'];
            $insItem->bind_param('iids', $listId, $ingredientId, $qty, $unit);
            $insItem->execute();
        }
        $insItem->close();
        $conn->commit();
        meals_json_ok(['shoppingList' => meals_get_shopping_list($conn, $planId)]);
    } catch (Exception $e) {
        $conn->rollback();
        throw $e;
    }
}

function meals_get_shopping_list($conn, $planId) {
    $listId = meals_get_list_id_for_plan($conn, $planId);
    if (!$listId) {
        return ['planId' => $planId, 'generatedAt' => null, 'items' => []];
    }

    $stmt = $conn->prepare('SELECT generated_at FROM meal_shopping_lists WHERE id = ?');
    $stmt->bind_param('i', $listId);
    $stmt->execute();
    $meta = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    $stmt = $conn->prepare(
        "SELECT sli.id, sli.quantity, sli.unit, sli.is_checked AS isChecked,
                i.id AS ingredientId, i.name AS ingredientName, i.category
         FROM meal_shopping_list_items sli
         JOIN meal_ingredients i ON i.id = sli.ingredient_id
         WHERE sli.shopping_list_id = ?
         ORDER BY FIELD(i.category, 'Protein', 'Legume', 'Vegetable', 'Fruit', 'Grain', 'Herb', 'Dairy', 'Condiment', 'Other'), i.name"
    );
    $stmt->bind_param('i', $listId);
    $stmt->execute();
    $result = $stmt->get_result();
    $items = [];
    while ($row = $result->fetch_assoc()) {
        $items[] = [
            'id' => (int) $row['id'],
            'ingredientId' => (int) $row['ingredientId'],
            'ingredientName' => $row['ingredientName'],
            'category' => $row['category'],
            'quantity' => (float) $row['quantity'],
            'unit' => $row['unit'],
            'isChecked' => (bool) $row['isChecked'],
        ];
    }
    $stmt->close();

    return [
        'planId' => $planId,
        'listId' => $listId,
        'generatedAt' => $meta['generated_at'] ?? null,
        'items' => $items,
    ];
}
