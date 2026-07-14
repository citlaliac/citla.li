<?php
/**
 * Personal finance module — DB, auth, Plaid, export helpers.
 */

require_once __DIR__ . '/perspective-helper.php';

function finance_send_json_cors($methods = 'GET, POST, PATCH, OPTIONS') {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowed = ['https://citla.li', 'http://localhost:3000'];
    if (in_array($origin, $allowed, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
    } else {
        header('Access-Control-Allow-Origin: https://citla.li');
    }
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Methods: ' . $methods);
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
}

function finance_read_json_body() {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function finance_json_ok($data = []) {
    echo json_encode(array_merge(['success' => true], $data));
    exit();
}

function finance_json_error($message, $status = 400) {
    http_response_code($status);
    echo json_encode(['success' => false, 'error' => $message]);
    exit();
}

function finance_hash_token($token) {
    return hash('sha256', $token);
}

function finance_categories_seed() {
    // Keep in sync with src/finance/financeCategoriesShared.js (emoji baked into label).
    return [
        ['groceries', '🛒 Groceries', 1, 1, 0, 'spending'],
        ['restaurants', '🍽️ Restaurants', 2, 1, 0, 'spending'],
        ['travel-vacation', '✈️ Travel / Vacation', 3, 1, 0, 'spending'],
        ['utilities', '💡 Utilities', 4, 1, 0, 'spending'],
        ['transportation', '🚗 Transportation', 5, 0, 0, 'spending'],
        ['self-care', '💆 Self Care', 6, 0, 0, 'spending'],
        ['oops-splurge', '💅 Oops / Splurge', 7, 0, 0, 'spending'],
        ['clothing', '👗 Clothing', 8, 0, 0, 'spending'],
        ['home-goods', '🏠 Home Goods', 9, 0, 0, 'spending'],
        ['entertainment', '🎬 Entertainment', 10, 0, 0, 'spending'],
        ['work-lunch', '🍱 Work Lunch / Cost', 11, 0, 0, 'spending'],
        ['subscriptions', '🔁 Subscriptions', 12, 0, 0, 'spending'],
        ['healthcare', '🩺 Healthcare', 13, 0, 0, 'spending'],
        ['education-classes', '📚 Education / Classes', 14, 0, 0, 'spending'],
        ['business', '💼 Business', 15, 0, 0, 'spending'],
        ['income', '💵 Income', 16, 0, 0, 'income'],
        ['rent', '🔑 Rent', 17, 0, 0, 'spending'],
        ['investments', '📈 Investments', 18, 0, 0, 'moved'],
        ['gifts-donations', '🎁 Gifts / Donations', 19, 0, 0, 'spending'],
        ['ignore', '🙈 Ignore / Do Not Count', 20, 0, 1, 'ignore'],
    ];
}

/** Vendor tags for two-step labeling (Amazon → Home Goods, etc.). */
function finance_vendor_tags() {
    return [
        ['amazon', '📦 Amazon'],
    ];
}

/** Retired categories — removed on seed sync when possible. */
function finance_categories_removed_slugs() {
    return ['cash', 'savings'];
}

function finance_ensure_tables($conn) {
    // Inline DDL (meals pattern) — schema-finance.sql is dev reference only; deploy copies *.php not *.sql.
    $conn->query('CREATE TABLE IF NOT EXISTS finance_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        token_hash CHAR(64) NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_finance_session_token (token_hash),
        INDEX idx_finance_session_expires (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');

    $conn->query('CREATE TABLE IF NOT EXISTS finance_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slug VARCHAR(48) NOT NULL,
        label VARCHAR(64) NOT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        is_pinned TINYINT(1) NOT NULL DEFAULT 0,
        exclude_from_reports TINYINT(1) NOT NULL DEFAULT 0,
        report_group VARCHAR(16) NOT NULL DEFAULT \'spending\',
        UNIQUE KEY uk_finance_category_slug (slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');

    // Allow emoji + longer labels (existing installs may still be VARCHAR(64)).
    $conn->query('ALTER TABLE finance_categories MODIFY label VARCHAR(96) NOT NULL');

    $conn->query('CREATE TABLE IF NOT EXISTS finance_plaid_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        item_id VARCHAR(64) NOT NULL,
        institution_name VARCHAR(128) NOT NULL DEFAULT \'\',
        access_token_enc TEXT NOT NULL,
        transactions_cursor VARCHAR(256) NULL,
        last_synced_at DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_finance_plaid_item (item_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');

    $conn->query('CREATE TABLE IF NOT EXISTS finance_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        plaid_transaction_id VARCHAR(128) NOT NULL,
        plaid_item_id INT NOT NULL,
        txn_date DATE NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        amount_manual TINYINT(1) NOT NULL DEFAULT 0,
        merchant_name VARCHAR(255) NOT NULL DEFAULT \'\',
        vendor_tag VARCHAR(32) NULL,
        pending TINYINT(1) NOT NULL DEFAULT 0,
        category_id INT NULL,
        categorized_at DATETIME NULL,
        exported_at DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_finance_plaid_txn (plaid_transaction_id),
        INDEX idx_finance_txn_date (txn_date),
        INDEX idx_finance_txn_category (category_id),
        INDEX idx_finance_txn_inbox (category_id, txn_date),
        CONSTRAINT fk_finance_txn_item FOREIGN KEY (plaid_item_id) REFERENCES finance_plaid_items (id) ON DELETE CASCADE,
        CONSTRAINT fk_finance_txn_category FOREIGN KEY (category_id) REFERENCES finance_categories (id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');

    // Existing installs: add amount_manual so Venmo sign flips survive Plaid sync.
    $col = $conn->query("SHOW COLUMNS FROM finance_transactions LIKE 'amount_manual'");
    if ($col && $col->num_rows === 0) {
        $conn->query(
            'ALTER TABLE finance_transactions ADD COLUMN amount_manual TINYINT(1) NOT NULL DEFAULT 0 AFTER amount'
        );
    }
    $vendorCol = $conn->query("SHOW COLUMNS FROM finance_transactions LIKE 'vendor_tag'");
    if ($vendorCol && $vendorCol->num_rows === 0) {
        $conn->query(
            'ALTER TABLE finance_transactions ADD COLUMN vendor_tag VARCHAR(32) NULL AFTER merchant_name'
        );
    }

    // Existing Amazon-category charges keep their category for now; also stamp vendor_tag for store reports.
    $conn->query(
        "UPDATE finance_transactions t
         JOIN finance_categories c ON c.id = t.category_id
         SET t.vendor_tag = 'amazon'
         WHERE c.slug = 'amazon' AND (t.vendor_tag IS NULL OR t.vendor_tag = '')"
    );
    $res = $conn->query('SELECT COUNT(*) AS c FROM finance_categories');
    $row = $res ? $res->fetch_assoc() : ['c' => 0];
    if ((int) $row['c'] === 0) {
        $stmt = $conn->prepare(
            'INSERT INTO finance_categories (slug, label, sort_order, is_pinned, exclude_from_reports, report_group)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        foreach (finance_categories_seed() as $cat) {
            $stmt->bind_param('ssiiis', $cat[0], $cat[1], $cat[2], $cat[3], $cat[4], $cat[5]);
            $stmt->execute();
        }
        $stmt->close();
    } else {
        // Upsert seed so existing DBs pick up reorders, emojis, and new categories.
        $stmt = $conn->prepare(
            'INSERT INTO finance_categories (slug, label, sort_order, is_pinned, exclude_from_reports, report_group)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               label = VALUES(label),
               sort_order = VALUES(sort_order),
               is_pinned = VALUES(is_pinned),
               exclude_from_reports = VALUES(exclude_from_reports),
               report_group = VALUES(report_group)'
        );
        foreach (finance_categories_seed() as $cat) {
            $stmt->bind_param('ssiiis', $cat[0], $cat[1], $cat[2], $cat[3], $cat[4], $cat[5]);
            $stmt->execute();
        }
        $stmt->close();
    }

    // Drop retired categories (cash/savings) when safe; ON DELETE SET NULL clears any rare links.
    foreach (finance_categories_removed_slugs() as $slug) {
        $del = $conn->prepare('DELETE FROM finance_categories WHERE slug = ?');
        $del->bind_param('s', $slug);
        $del->execute();
        $del->close();
    }
}

/**
 * Load finance env vars with INI_SCANNER_RAW + quote trimming.
 * Default parse_ini_file can swallow/mangle secrets that contain $ or similar.
 */
function finance_load_env_file() {
    static $env = null;
    if ($env !== null) {
        return $env;
    }
    $envFile = __DIR__ . '/.env';
    if (!file_exists($envFile)) {
        throw new Exception('.env file not found');
    }
    $parsed = parse_ini_file($envFile, false, INI_SCANNER_RAW);
    if ($parsed === false) {
        throw new Exception('Failed to parse .env file');
    }
    foreach ($parsed as $k => $v) {
        if (!is_string($v)) {
            continue;
        }
        $v = trim($v);
        $len = strlen($v);
        if ($len >= 2) {
            $first = $v[0];
            $last = $v[$len - 1];
            if (($first === '"' && $last === '"') || ($first === "'" && $last === "'")) {
                $v = substr($v, 1, -1);
            }
        }
        $parsed[$k] = $v;
    }
    $env = $parsed;
    return $env;
}

function finance_env($key) {
    $env = finance_load_env_file();
    $value = $env[$key] ?? getenv($key);
    if ($value === false || $value === null) {
        return '';
    }
    return is_string($value) ? trim($value) : (string) $value;
}

function finance_verify_password($password) {
    $hash = finance_env('FINANCE_ADMIN_PASSWORD_HASH');
    if ($hash !== '') {
        return password_verify($password, $hash);
    }
    $plain = finance_env('FINANCE_ADMIN_PASSWORD');
    return $plain !== '' && hash_equals($plain, $password);
}

function finance_issue_session($conn, $days = 30) {
    $token = bin2hex(random_bytes(32));
    $hash = finance_hash_token($token);
    // Clamp so clients can request short session (1 day) or longer remember-me.
    $days = (int) $days;
    if ($days < 1) {
        $days = 1;
    }
    if ($days > 90) {
        $days = 90;
    }
    $expires = date('Y-m-d H:i:s', time() + $days * 24 * 60 * 60);
    $stmt = $conn->prepare('INSERT INTO finance_sessions (token_hash, expires_at) VALUES (?, ?)');
    $stmt->bind_param('ss', $hash, $expires);
    $stmt->execute();
    $stmt->close();
    return ['token' => $token, 'expiresAt' => $expires, 'days' => $days];
}

function finance_authenticate($conn) {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/^Bearer\s+(\S+)$/i', $header, $m)) {
        $hash = finance_hash_token($m[1]);
        $stmt = $conn->prepare(
            'SELECT id FROM finance_sessions WHERE token_hash = ? AND expires_at > NOW() LIMIT 1'
        );
        $stmt->bind_param('s', $hash);
        $stmt->execute();
        $res = $stmt->get_result();
        $ok = (bool) $res->fetch_assoc();
        $stmt->close();
        return $ok;
    }
    return false;
}

function finance_encryption_key() {
    $raw = finance_env('FINANCE_ENCRYPTION_KEY');
    if (!preg_match('/^[0-9a-fA-F]{64}$/', $raw)) {
        throw new Exception('FINANCE_ENCRYPTION_KEY must be 64 hex characters');
    }
    return hex2bin($raw);
}

function finance_encrypt_secret($plain) {
    $key = finance_encryption_key();
    $iv = random_bytes(12);
    $tag = '';
    $cipher = openssl_encrypt($plain, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag);
    return base64_encode($iv . $tag . $cipher);
}

function finance_decrypt_secret($encoded) {
    $key = finance_encryption_key();
    $buf = base64_decode($encoded, true);
    $iv = substr($buf, 0, 12);
    $tag = substr($buf, 12, 16);
    $data = substr($buf, 28);
    $plain = openssl_decrypt($data, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag);
    if ($plain === false) {
        throw new Exception('Could not decrypt Plaid token');
    }
    return $plain;
}

/**
 * Resolve report / drill-down date window from query params.
 * range: month | last6 | last12 | ytd
 * month: YYYY-MM (required when range is month or omitted with month set)
 * @return array{start:string,end:string,range:string,month:?string,label:string}
 */
function finance_resolve_date_window($range, $month) {
    $today = new DateTimeImmutable('today');
    $range = trim((string) $range);
    $month = trim((string) $month);
    if ($range === '') {
        $range = $month !== '' ? 'month' : 'month';
    }

    if ($range === 'last6') {
        $start = $today->modify('-6 months');
        return [
            'start' => $start->format('Y-m-d'),
            'end' => $today->format('Y-m-d'),
            'range' => 'last6',
            'month' => null,
            'label' => 'Last 6 months',
        ];
    }
    if ($range === 'last12') {
        $start = $today->modify('-12 months');
        return [
            'start' => $start->format('Y-m-d'),
            'end' => $today->format('Y-m-d'),
            'range' => 'last12',
            'month' => null,
            'label' => 'Last 12 months',
        ];
    }
    if ($range === 'ytd') {
        $start = new DateTimeImmutable($today->format('Y') . '-01-01');
        return [
            'start' => $start->format('Y-m-d'),
            'end' => $today->format('Y-m-d'),
            'range' => 'ytd',
            'month' => null,
            'label' => 'Year to date',
        ];
    }

    if ($month === '') {
        $month = $today->format('Y-m');
    }
    if (!preg_match('/^\d{4}-\d{2}$/', $month)) {
        throw new Exception('month must be YYYY-MM');
    }
    $start = DateTimeImmutable::createFromFormat('!Y-m-d', $month . '-01');
    if (!$start) {
        throw new Exception('Invalid month');
    }
    $end = $start->modify('last day of this month');
    return [
        'start' => $start->format('Y-m-d'),
        'end' => $end->format('Y-m-d'),
        'range' => 'month',
        'month' => $month,
        'label' => $month,
    ];
}

/**
 * Rolling window ending today for merchant / hot-category insights.
 * @return array{start:string,end:string}
 */
function finance_last_n_months_window($n) {
    $today = new DateTimeImmutable('today');
    $start = $today->modify('-' . (int) $n . ' months');
    return [
        'start' => $start->format('Y-m-d'),
        'end' => $today->format('Y-m-d'),
    ];
}

/**
 * Calendar month keys from start..end inclusive (YYYY-MM).
 * @return string[]
 */
function finance_month_keys_between($startIso, $endIso) {
    $keys = [];
    $cur = DateTimeImmutable::createFromFormat('!Y-m-d', substr($startIso, 0, 7) . '-01');
    $end = DateTimeImmutable::createFromFormat('!Y-m-d', substr($endIso, 0, 7) . '-01');
    if (!$cur || !$end) {
        return $keys;
    }
    while ($cur <= $end) {
        $keys[] = $cur->format('Y-m');
        $cur = $cur->modify('+1 month');
    }
    return $keys;
}

/**
 * Short month label e.g. Jan, Feb.
 */
function finance_month_short_label($ym) {
    $d = DateTimeImmutable::createFromFormat('!Y-m-d', $ym . '-01');
    return $d ? $d->format('M') : $ym;
}

/**
 * Spending totals = costs only (report_group = spending).
 * Income, investments (moved), and ignore never roll into spendingTotal / monthly charts.
 */
function finance_spending_join_sql() {
    return "FROM finance_transactions t
             JOIN finance_categories c ON c.id = t.category_id
             WHERE t.category_id IS NOT NULL
               AND c.exclude_from_reports = 0
               AND c.report_group = 'spending'";
}

/**
 * Filled monthly spending series + average for a window.
 * @return array{monthlySpend:array,avgMonthlySpend:float,monthBucketCount:int}
 */
function finance_monthly_spend_series($conn, $start, $end) {
    $sql = 'SELECT DATE_FORMAT(t.txn_date, \'%Y-%m\') AS ym, SUM(t.amount) AS total '
        . finance_spending_join_sql()
        . ' AND t.txn_date >= ? AND t.txn_date <= ?
           GROUP BY ym
           ORDER BY ym ASC';
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('ss', $start, $end);
    $stmt->execute();
    $res = $stmt->get_result();
    $byMonth = [];
    while ($row = $res->fetch_assoc()) {
        $byMonth[$row['ym']] = (float) $row['total'];
    }
    $stmt->close();

    $keys = finance_month_keys_between($start, $end);
    $series = [];
    $sum = 0.0;
    foreach ($keys as $ym) {
        $total = $byMonth[$ym] ?? 0.0;
        $sum += $total;
        $series[] = [
            'month' => $ym,
            'label' => finance_month_short_label($ym),
            'total' => $total,
        ];
    }
    $count = max(count($keys), 1);
    return [
        'monthlySpend' => $series,
        'avgMonthlySpend' => $sum / $count,
        'monthBucketCount' => $count,
    ];
}

/**
 * Daily spending totals for a calendar window (costs only).
 * @return array<int,float> map day-of-month => total
 */
function finance_daily_spend_map($conn, $start, $end) {
    $sql = 'SELECT DAY(t.txn_date) AS day_num, SUM(t.amount) AS total '
        . finance_spending_join_sql()
        . ' AND t.txn_date >= ? AND t.txn_date <= ?
           GROUP BY DAY(t.txn_date)
           ORDER BY day_num ASC';
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('ss', $start, $end);
    $stmt->execute();
    $res = $stmt->get_result();
    $map = [];
    while ($row = $res->fetch_assoc()) {
        $map[(int) $row['day_num']] = (float) $row['total'];
    }
    $stmt->close();
    return $map;
}

/**
 * Cumulative daily spend for a month vs the prior month (same day numbers).
 * Caps the current month at today when viewing the live month.
 *
 * @return array{dailySpend:array,priorDailySpend:array,pace:array}|null
 */
function finance_month_spend_pace($conn, $monthKey) {
    if (!preg_match('/^\d{4}-\d{2}$/', $monthKey)) {
        return null;
    }
    $parts = explode('-', $monthKey);
    $y = (int) $parts[0];
    $m = (int) $parts[1];
    $thisStart = sprintf('%04d-%02d-01', $y, $m);
    $lastDayOfMonth = (int) date('t', strtotime($thisStart));
    $today = new DateTimeImmutable('today');
    $isCurrentMonth = ((int) $today->format('Y') === $y && (int) $today->format('n') === $m);
    $throughDay = $isCurrentMonth
        ? min((int) $today->format('j'), $lastDayOfMonth)
        : $lastDayOfMonth;
    $thisEnd = sprintf('%04d-%02d-%02d', $y, $m, $throughDay);

    // Prior calendar month, aligned to the same day count.
    $priorAnchor = (new DateTimeImmutable($thisStart))->modify('-1 month');
    $py = (int) $priorAnchor->format('Y');
    $pm = (int) $priorAnchor->format('n');
    $priorLast = (int) $priorAnchor->format('t');
    $priorThrough = min($throughDay, $priorLast);
    $priorStart = sprintf('%04d-%02d-01', $py, $pm);
    $priorEnd = sprintf('%04d-%02d-%02d', $py, $pm, $priorThrough);

    $thisMap = finance_daily_spend_map($conn, $thisStart, $thisEnd);
    $priorMap = finance_daily_spend_map($conn, $priorStart, $priorEnd);

    $build = function ($map, $days) {
        $out = [];
        $cum = 0.0;
        for ($d = 1; $d <= $days; $d++) {
            $dayTotal = $map[$d] ?? 0.0;
            $cum += $dayTotal;
            $out[] = [
                'day' => $d,
                'label' => (string) $d,
                'total' => $dayTotal,
                'cumulative' => $cum,
            ];
        }
        return $out;
    };

    $dailySpend = $build($thisMap, $throughDay);
    $priorDailySpend = $build($priorMap, $priorThrough);
    $thisTotal = $throughDay > 0 ? $dailySpend[$throughDay - 1]['cumulative'] : 0.0;
    $priorTotal = $priorThrough > 0 ? $priorDailySpend[$priorThrough - 1]['cumulative'] : 0.0;
    $delta = $thisTotal - $priorTotal;
    $pctVsPrior = $priorTotal > 0 ? round(100.0 * $delta / $priorTotal, 1) : null;

    return [
        'dailySpend' => $dailySpend,
        'priorDailySpend' => $priorDailySpend,
        'pace' => [
            'throughDay' => $throughDay,
            'thisMonthTotal' => $thisTotal,
            'priorMonthTotal' => $priorTotal,
            'priorMonthLabel' => $priorAnchor->format('M Y'),
            'delta' => $delta,
            'pctVsPrior' => $pctVsPrior,
        ],
    ];
}

/**
 * How spend + investments relate to income for the report window.
 * Uses absolute totals so Plaid sign flips still compare sensibly.
 *
 * @return array
 */
function finance_allocation_summary($spendingTotal, $incomeTotal, $investedTotal) {
    $spend = abs((float) $spendingTotal);
    $income = abs((float) $incomeTotal);
    $invested = abs((float) $investedTotal);
    $pct = function ($part, $whole) {
        if ($whole <= 0) {
            return null;
        }
        return round(100.0 * $part / $whole, 1);
    };
    return [
        'spendingAbs' => $spend,
        'incomeAbs' => $income,
        'investedAbs' => $invested,
        'pctSpentOfIncome' => $pct($spend, $income),
        'pctInvestedOfIncome' => $pct($invested, $income),
        'pctAllocatedOfIncome' => $pct($spend + $invested, $income),
    ];
}

/**
 * Top merchants by spend (excludes MTA / transit noise).
 * @return array
 */
function finance_top_merchants($conn, $start, $end, $limit = 5) {
    $limit = max(1, min(20, (int) $limit));
    $sql = 'SELECT t.merchant_name AS merchantName, SUM(t.amount) AS total, COUNT(*) AS txnCount '
        . finance_spending_join_sql()
        . " AND t.txn_date >= ? AND t.txn_date <= ?
             AND t.merchant_name IS NOT NULL AND TRIM(t.merchant_name) <> ''
             AND UPPER(t.merchant_name) NOT LIKE '%MTA%'
           GROUP BY t.merchant_name
           ORDER BY total DESC
           LIMIT {$limit}";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('ss', $start, $end);
    $stmt->execute();
    $res = $stmt->get_result();
    $out = [];
    while ($row = $res->fetch_assoc()) {
        $out[] = [
            'merchantName' => $row['merchantName'],
            'total' => (float) $row['total'],
            'txnCount' => (int) $row['txnCount'],
        ];
    }
    $stmt->close();
    return $out;
}

/**
 * Top categories by transaction count (for future pin / reorder hints).
 * @return array
 */
function finance_hot_categories($conn, $start, $end, $limit = 3) {
    $limit = max(1, min(20, (int) $limit));
    $sql = 'SELECT c.id, c.label, c.slug, COUNT(*) AS txnCount, SUM(t.amount) AS total '
        . finance_spending_join_sql()
        . " AND t.txn_date >= ? AND t.txn_date <= ?
           GROUP BY c.id, c.label, c.slug
           ORDER BY txnCount DESC, total DESC
           LIMIT {$limit}";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('ss', $start, $end);
    $stmt->execute();
    $res = $stmt->get_result();
    $out = [];
    while ($row = $res->fetch_assoc()) {
        $out[] = [
            'categoryId' => (int) $row['id'],
            'label' => $row['label'],
            'slug' => $row['slug'],
            'txnCount' => (int) $row['txnCount'],
            'total' => (float) $row['total'],
        ];
    }
    $stmt->close();
    return $out;
}

function finance_plaid_base_url() {
    $env = strtolower(finance_env('PLAID_ENV') ?: 'sandbox');
    if ($env === 'production') {
        return 'https://production.plaid.com';
    }
    if ($env === 'development') {
        return 'https://development.plaid.com';
    }
    return 'https://sandbox.plaid.com';
}

function finance_plaid_request($path, $body) {
    $clientId = finance_env('PLAID_CLIENT_ID');
    $secret = finance_env('PLAID_SECRET');
    if ($clientId === '' || $secret === '') {
        $missing = [];
        if ($clientId === '') {
            $missing[] = 'PLAID_CLIENT_ID';
        }
        if ($secret === '') {
            $missing[] = 'PLAID_SECRET';
        }
        throw new Exception(
            implode(' and ', $missing) . ' empty in public_html/.env — check spelling and save the file'
        );
    }
    $payload = array_merge(['client_id' => $clientId, 'secret' => $secret], $body);
    $ch = curl_init(finance_plaid_base_url() . $path);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    ]);
    $response = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $data = json_decode($response, true);
    if ($code < 200 || $code >= 300) {
        $msg = $data['error_message'] ?? $data['display_message'] ?? $data['error_code'] ?? 'Plaid error';
        throw new Exception($msg);
    }
    return is_array($data) ? $data : [];
}

function finance_upsert_transaction($conn, $plaidItemDbId, $txn) {
    $merchant = mb_substr($txn['merchant_name'] ?? $txn['name'] ?? 'Unknown', 0, 255);
    $amount = (float) ($txn['amount'] ?? 0);
    $date = $txn['date'] ?? date('Y-m-d');
    $pending = !empty($txn['pending']) ? 1 : 0;
    $txnId = $txn['transaction_id'] ?? '';
    // Preserve user-flipped amounts (amount_manual=1) so Plaid sync does not undo Venmo sign fixes.
    $stmt = $conn->prepare(
        'INSERT INTO finance_transactions
            (plaid_transaction_id, plaid_item_id, txn_date, amount, merchant_name, pending)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
            txn_date = VALUES(txn_date),
            amount = IF(amount_manual = 1, amount, VALUES(amount)),
            merchant_name = VALUES(merchant_name),
            pending = VALUES(pending)'
    );
    $stmt->bind_param('sisdsi', $txnId, $plaidItemDbId, $date, $amount, $merchant, $pending);
    $stmt->execute();
    $stmt->close();
}

function finance_sync_all($conn) {
    $res = $conn->query('SELECT * FROM finance_plaid_items');
    $added = 0;
    $modified = 0;
    $items = 0;
    while ($item = $res->fetch_assoc()) {
        $items += 1;
        try {
            $accessToken = finance_decrypt_secret($item['access_token_enc']);
        } catch (Exception $e) {
            continue;
        }
        $cursor = $item['transactions_cursor'] ?: null;
        $hasMore = true;
        while ($hasMore) {
            $body = ['access_token' => $accessToken];
            if ($cursor) {
                $body['cursor'] = $cursor;
            }
            $data = finance_plaid_request('/transactions/sync', $body);
            foreach ($data['added'] ?? [] as $txn) {
                finance_upsert_transaction($conn, (int) $item['id'], $txn);
                $added += 1;
            }
            foreach ($data['modified'] ?? [] as $txn) {
                finance_upsert_transaction($conn, (int) $item['id'], $txn);
                $modified += 1;
            }
            $cursor = $data['next_cursor'] ?? null;
            $hasMore = !empty($data['has_more']);
        }
        $stmt = $conn->prepare(
            'UPDATE finance_plaid_items SET transactions_cursor = ?, last_synced_at = NOW() WHERE id = ?'
        );
        $stmt->bind_param('si', $cursor, $item['id']);
        $stmt->execute();
        $stmt->close();
    }
    return ['added' => $added, 'modified' => $modified, 'items' => $items];
}

function finance_category_from_row($row) {
    return [
        'id' => (int) $row['id'],
        'slug' => $row['slug'],
        'label' => $row['label'],
        'sortOrder' => (int) $row['sort_order'],
        'isPinned' => (bool) $row['is_pinned'],
        'excludeFromReports' => (bool) $row['exclude_from_reports'],
        'reportGroup' => $row['report_group'],
    ];
}

function finance_transaction_from_row($row) {
    return [
        'id' => (int) $row['id'],
        'plaidTransactionId' => $row['plaid_transaction_id'],
        'date' => $row['txn_date'],
        'amount' => (float) $row['amount'],
        'amountManual' => !empty($row['amount_manual']),
        'merchantName' => $row['merchant_name'],
        'vendorTag' => $row['vendor_tag'] ?? null,
        'pending' => (bool) $row['pending'],
        'categoryId' => $row['category_id'] !== null ? (int) $row['category_id'] : null,
        'categorizedAt' => $row['categorized_at'],
        'exportedAt' => $row['exported_at'],
    ];
}

function finance_build_csv($rows) {
    $lines = ['date,merchant,amount,category'];
    foreach ($rows as $r) {
        $merchant = str_replace('"', '""', $r['merchant_name'] ?? '');
        $category = str_replace('"', '""', $r['category_label'] ?? '');
        $lines[] = $r['txn_date'] . ',"' . $merchant . '",' . $r['amount'] . ',"' . $category . '"';
    }
    return implode("\n", $lines) . "\n";
}

function finance_google_access_token() {
    $email = finance_env('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    $key = finance_env('GOOGLE_PRIVATE_KEY');
    if ($email === '' || $key === '') {
        throw new Exception('Google Drive export is not configured');
    }
    $key = str_replace('\\n', "\n", $key);
    $now = time();
    $header = rtrim(strtr(base64_encode(json_encode(['alg' => 'RS256', 'typ' => 'JWT'])), '+/', '-_'), '=');
    $claim = rtrim(strtr(base64_encode(json_encode([
        'iss' => $email,
        'scope' => 'https://www.googleapis.com/auth/drive.file',
        'aud' => 'https://oauth2.googleapis.com/token',
        'iat' => $now,
        'exp' => $now + 3600,
    ])), '+/', '-_'), '=');
    $input = $header . '.' . $claim;
    openssl_sign($input, $signature, $key, OPENSSL_ALGO_SHA256);
    $jwt = $input . '.' . rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');
    $ch = curl_init('https://oauth2.googleapis.com/token');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query([
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $jwt,
        ]),
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    $data = json_decode($response, true);
    if (empty($data['access_token'])) {
        throw new Exception('Could not obtain Google access token');
    }
    return $data['access_token'];
}

function finance_upload_csv_drive($filename, $csv) {
    $folderId = finance_env('FINANCE_GDRIVE_FOLDER_ID');
    if ($folderId === '') {
        throw new Exception('FINANCE_GDRIVE_FOLDER_ID is not set');
    }
    $token = finance_google_access_token();
    $boundary = 'finance_' . bin2hex(random_bytes(8));
    $metadata = json_encode(['name' => $filename, 'parents' => [$folderId]]);
    $body = "--{$boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n{$metadata}\r\n"
        . "--{$boundary}\r\nContent-Type: text/csv\r\n\r\n{$csv}\r\n--{$boundary}--";
    $ch = curl_init('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $body,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $token,
            'Content-Type: multipart/related; boundary=' . $boundary,
        ],
    ]);
    $response = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($code < 200 || $code >= 300) {
        throw new Exception('Google Drive upload failed');
    }
    $data = json_decode($response, true);
    return $data['id'] ?? null;
}
