<?php
require_once __DIR__ . '/meals-db.php';

meals_send_json_cors('POST, OPTIONS');
meals_handle_options();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    meals_json_error('POST required', 405);
}

try {
    $body = meals_read_json_body();
    $url = trim($body['url'] ?? '');
    if ($url === '') {
        meals_json_error('url is required');
    }

    if (!meals_is_url_allowed($url)) {
        meals_json_error('Invalid or disallowed URL', 400);
    }

    $html = meals_fetch_url($url);
    if ($html === null) {
        meals_json_error('Could not fetch URL', 400);
    }

    $recipe = meals_extract_recipe_from_html($html);
    if ($recipe === null) {
        meals_json_error('Recipe import not supported for this website.', 422);
    }

    meals_json_ok(['recipe' => $recipe]);
} catch (Exception $e) {
    error_log('meals-recipe-import: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

function meals_is_url_allowed($url) {
    $parts = parse_url($url);
    if (!$parts || empty($parts['scheme']) || empty($parts['host'])) {
        return false;
    }
    if (!in_array(strtolower($parts['scheme']), ['http', 'https'], true)) {
        return false;
    }
    $host = $parts['host'];
    $ip = gethostbyname($host);
    if ($ip === $host) {
        return false;
    }
    if (!filter_var($ip, FILTER_VALIDATE_IP)) {
        return false;
    }
    if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
        return false;
    }
    return true;
}

function meals_fetch_url($url) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 3,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; CitlaMealPlanner/1.0)',
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($body === false || $code < 200 || $code >= 400) {
        return null;
    }
    return $body;
}

function meals_extract_recipe_from_html($html) {
    if (!preg_match_all('/<script[^>]+type=["\']application\/ld\+json["\'][^>]*>(.*?)<\/script>/is', $html, $matches)) {
        return null;
    }
    foreach ($matches[1] as $block) {
        $block = trim($block);
        $data = json_decode($block, true);
        if ($data === null) {
            continue;
        }
        $recipe = meals_find_recipe_node($data);
        if ($recipe !== null) {
            return meals_normalize_recipe_node($recipe);
        }
    }
    return null;
}

function meals_find_recipe_node($data) {
    if (!is_array($data)) {
        return null;
    }
    if (isset($data['@type'])) {
        $types = $data['@type'];
        if (is_string($types) && stripos($types, 'Recipe') !== false) {
            return $data;
        }
        if (is_array($types)) {
            foreach ($types as $t) {
                if (is_string($t) && stripos($t, 'Recipe') !== false) {
                    return $data;
                }
            }
        }
    }
    if (isset($data['@graph']) && is_array($data['@graph'])) {
        foreach ($data['@graph'] as $node) {
            $found = meals_find_recipe_node($node);
            if ($found !== null) {
                return $found;
            }
        }
    }
    foreach ($data as $value) {
        if (is_array($value)) {
            $found = meals_find_recipe_node($value);
            if ($found !== null) {
                return $found;
            }
        }
    }
    return null;
}

function meals_normalize_recipe_node($node) {
    $name = $node['name'] ?? 'Imported Recipe';
    $servings = meals_parse_servings($node['recipeYield'] ?? $node['yield'] ?? null);
    $ingredients = [];
    $rawList = $node['recipeIngredient'] ?? [];
    if (is_string($rawList)) {
        $rawList = [$rawList];
    }
    if (is_array($rawList)) {
        foreach ($rawList as $line) {
            if (is_string($line) && trim($line) !== '') {
                $ingredients[] = ['rawText' => trim($line)];
            }
        }
    }
    $instructions = meals_parse_instructions($node['recipeInstructions'] ?? '');
    return [
        'name' => is_string($name) ? $name : 'Imported Recipe',
        'servings' => $servings,
        'ingredients' => $ingredients,
        'instructions' => $instructions,
        'notes' => '',
        'category' => 'Full Meal',
        'tags' => [],
    ];
}

function meals_parse_servings($yield) {
    if ($yield === null) {
        return 4;
    }
    if (is_numeric($yield)) {
        return max(1, (int) $yield);
    }
    if (is_array($yield)) {
        $yield = implode(' ', $yield);
    }
    if (preg_match('/(\d+)/', (string) $yield, $m)) {
        return max(1, (int) $m[1]);
    }
    return 4;
}

function meals_parse_instructions($raw) {
    if (is_string($raw)) {
        return trim($raw);
    }
    if (!is_array($raw)) {
        return '';
    }
    $parts = [];
    foreach ($raw as $step) {
        if (is_string($step)) {
            $parts[] = trim($step);
        } elseif (is_array($step)) {
            $text = $step['text'] ?? $step['name'] ?? '';
            if (is_string($text) && trim($text) !== '') {
                $parts[] = trim($text);
            }
        }
    }
    return implode("\n\n", $parts);
}
