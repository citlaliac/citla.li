<?php
require_once __DIR__ . '/finance-db.php';

finance_send_json_cors('GET, POST, PATCH, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$resource = isset($_GET['resource']) ? trim($_GET['resource']) : '';
$action = isset($_GET['action']) ? trim($_GET['action']) : '';

try {
    $envVars = cec_load_env();
    $conn = cec_db_connect($envVars);
    finance_ensure_tables($conn);

    if ($resource === 'auth' && $method === 'POST' && $action === 'login') {
        $body = finance_read_json_body();
        $password = $body['password'] ?? '';
        if ($password === '') {
            finance_json_error('Password is required');
        }
        if (!finance_verify_password($password)) {
            finance_json_error('Invalid password', 401);
        }
        // rememberMe → 30 days; otherwise 1-day session (browser quit can still clear client token).
        $rememberMe = !empty($body['rememberMe']);
        $days = isset($body['rememberDays']) ? (int) $body['rememberDays'] : ($rememberMe ? 30 : 1);
        $session = finance_issue_session($conn, $days);
        finance_json_ok([
            'token' => $session['token'],
            'expiresAt' => $session['expiresAt'],
            'days' => $session['days'],
        ]);
    }

    if (!finance_authenticate($conn)) {
        finance_json_error('Not authenticated', 401);
    }

    if ($resource === 'categories' && $method === 'GET') {
        $res = $conn->query(
            'SELECT * FROM finance_categories ORDER BY is_pinned DESC, sort_order ASC, id ASC'
        );
        $categories = [];
        while ($row = $res->fetch_assoc()) {
            // Amazon is a vendor tag now — hide legacy slug from the category picker.
            if ($row['slug'] === 'amazon') {
                continue;
            }
            $categories[] = finance_category_from_row($row);
        }
        $vendorTags = [];
        foreach (finance_vendor_tags() as $tag) {
            $vendorTags[] = ['slug' => $tag[0], 'label' => $tag[1]];
        }
        finance_json_ok(['categories' => $categories, 'vendorTags' => $vendorTags]);
    } elseif ($resource === 'categories' && $method === 'POST') {
        $body = finance_read_json_body();
        $label = trim((string) ($body['label'] ?? ''));
        if ($label === '') {
            finance_json_error('label is required');
        }
        if (strlen($label) > 96) {
            $label = substr($label, 0, 96);
        }
        $slug = strtolower(trim((string) ($body['slug'] ?? '')));
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
        $slug = trim($slug, '-');
        if ($slug === '') {
            $slug = strtolower(preg_replace('/[^a-z0-9]+/', '-', $label));
            $slug = trim($slug, '-');
        }
        if ($slug === '') {
            $slug = 'custom';
        }
        if (strlen($slug) > 48) {
            $slug = substr($slug, 0, 48);
        }
        $reportGroup = $body['reportGroup'] ?? 'spending';
        if (!in_array($reportGroup, ['spending', 'income', 'moved', 'ignore'], true)) {
            $reportGroup = 'spending';
        }
        $exclude = $reportGroup === 'ignore' ? 1 : 0;

        $unique = $slug;
        $n = 2;
        while ($n <= 50) {
            $check = $conn->prepare('SELECT id FROM finance_categories WHERE slug = ? LIMIT 1');
            $check->bind_param('s', $unique);
            $check->execute();
            $exists = $check->get_result()->fetch_assoc();
            $check->close();
            if (!$exists) {
                break;
            }
            $unique = substr($slug, 0, 40) . '-' . $n;
            $n++;
        }
        if ($n > 50) {
            finance_json_error('Could not allocate a unique slug', 409);
        }

        $maxRes = $conn->query('SELECT COALESCE(MAX(sort_order), 0) AS m FROM finance_categories');
        $maxRow = $maxRes ? $maxRes->fetch_assoc() : ['m' => 0];
        $sortOrder = ((int) $maxRow['m']) + 1;

        $stmt = $conn->prepare(
            'INSERT INTO finance_categories (slug, label, sort_order, is_pinned, exclude_from_reports, report_group)
             VALUES (?, ?, ?, 0, ?, ?)'
        );
        $stmt->bind_param('ssiis', $unique, $label, $sortOrder, $exclude, $reportGroup);
        if (!$stmt->execute()) {
            $stmt->close();
            finance_json_error('Failed to create category', 500);
        }
        $newId = (int) $stmt->insert_id;
        $stmt->close();

        $get = $conn->prepare('SELECT * FROM finance_categories WHERE id = ? LIMIT 1');
        $get->bind_param('i', $newId);
        $get->execute();
        $row = $get->get_result()->fetch_assoc();
        $get->close();
        finance_json_ok(['category' => finance_category_from_row($row)]);
    } elseif ($resource === 'plaid' && $method === 'POST' && $action === 'link-token') {
        $data = finance_plaid_request('/link/token/create', [
            'user' => ['client_user_id' => 'citlali-finance-admin'],
            'client_name' => 'citla.li Finance',
            'products' => ['transactions'],
            'country_codes' => ['US'],
            'language' => 'en',
            'transactions' => ['days_requested' => 90],
        ]);
        finance_json_ok(['linkToken' => $data['link_token'], 'expiration' => $data['expiration'] ?? null]);
    } elseif ($resource === 'plaid' && $method === 'POST' && $action === 'exchange') {
        $body = finance_read_json_body();
        $publicToken = $body['publicToken'] ?? '';
        $institutionName = mb_substr($body['institutionName'] ?? 'Linked account', 0, 128);
        if ($publicToken === '') {
            finance_json_error('publicToken is required');
        }
        $data = finance_plaid_request('/item/public_token/exchange', ['public_token' => $publicToken]);
        $enc = finance_encrypt_secret($data['access_token']);
        $stmt = $conn->prepare(
            'INSERT INTO finance_plaid_items (item_id, institution_name, access_token_enc)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE institution_name = VALUES(institution_name), access_token_enc = VALUES(access_token_enc)'
        );
        $stmt->bind_param('sss', $data['item_id'], $institutionName, $enc);
        $stmt->execute();
        $stmt->close();
        finance_json_ok(['itemId' => $data['item_id']]);
    } elseif ($resource === 'plaid' && $method === 'GET' && $action === 'items') {
        $res = $conn->query(
            'SELECT id, item_id, institution_name, last_synced_at, created_at FROM finance_plaid_items ORDER BY id ASC'
        );
        $items = [];
        while ($row = $res->fetch_assoc()) {
            $items[] = [
                'id' => (int) $row['id'],
                'itemId' => $row['item_id'],
                'institutionName' => $row['institution_name'],
                'lastSyncedAt' => $row['last_synced_at'],
                'createdAt' => $row['created_at'],
            ];
        }
        finance_json_ok(['items' => $items]);
    } elseif ($resource === 'sync' && $method === 'POST') {
        finance_json_ok(finance_sync_all($conn));
    } elseif ($resource === 'transactions' && $method === 'GET') {
        // Optional filters: status, range/month, categoryId, vendorTag — for report drill-down.
        $status = $_GET['status'] ?? 'all';
        $range = isset($_GET['range']) ? trim($_GET['range']) : '';
        $month = isset($_GET['month']) ? trim($_GET['month']) : '';
        $categoryId = isset($_GET['categoryId']) ? (int) $_GET['categoryId'] : 0;
        $vendorTag = isset($_GET['vendorTag']) ? trim($_GET['vendorTag']) : '';

        $where = [];
        $types = '';
        $params = [];

        if ($status === 'uncategorized') {
            $where[] = 'category_id IS NULL';
        } elseif ($status === 'categorized') {
            $where[] = 'category_id IS NOT NULL';
        }
        if ($range !== '' || $month !== '') {
            try {
                $window = finance_resolve_date_window($range, $month);
            } catch (Exception $e) {
                finance_json_error($e->getMessage());
            }
            $where[] = 'txn_date >= ? AND txn_date <= ?';
            $types .= 'ss';
            $params[] = $window['start'];
            $params[] = $window['end'];
        }
        if ($categoryId > 0) {
            $where[] = 'category_id = ?';
            $types .= 'i';
            $params[] = $categoryId;
        }
        if ($vendorTag !== '') {
            $where[] = 'vendor_tag = ?';
            $types .= 's';
            $params[] = $vendorTag;
        }

        $sql = 'SELECT * FROM finance_transactions';
        if (count($where) > 0) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }
        $sql .= ' ORDER BY txn_date DESC, id DESC LIMIT 2000';

        $transactions = [];
        if ($types !== '') {
            $stmt = $conn->prepare($sql);
            $bindArgs = [$types];
            foreach ($params as $i => $_) {
                $bindArgs[] = &$params[$i];
            }
            call_user_func_array([$stmt, 'bind_param'], $bindArgs);
            $stmt->execute();
            $res = $stmt->get_result();
            while ($row = $res->fetch_assoc()) {
                $transactions[] = finance_transaction_from_row($row);
            }
            $stmt->close();
        } else {
            $res = $conn->query($sql);
            while ($row = $res->fetch_assoc()) {
                $transactions[] = finance_transaction_from_row($row);
            }
        }
        finance_json_ok(['transactions' => $transactions]);
    } elseif ($resource === 'transactions' && $method === 'PATCH') {
        $id = (int) ($_GET['id'] ?? 0);
        $body = finance_read_json_body();
        if ($id <= 0) {
            finance_json_error('Invalid transaction');
        }

        $sets = [];
        $types = '';
        $params = [];

        // Flip sign (+/−) for Venmo and similar Plaid quirks; marks amount_manual so sync keeps it.
        if (!empty($body['flipAmount'])) {
            $sets[] = 'amount = -amount';
            $sets[] = 'amount_manual = 1';
        } elseif (array_key_exists('amount', $body) && is_numeric($body['amount'])) {
            $sets[] = 'amount = ?';
            $sets[] = 'amount_manual = 1';
            $types .= 'd';
            $params[] = (float) $body['amount'];
        }

        if (array_key_exists('categoryId', $body)) {
            // null / empty clears category so undo can restore inbox items.
            if ($body['categoryId'] === null || $body['categoryId'] === '') {
                $sets[] = 'category_id = NULL';
                $sets[] = 'categorized_at = NULL';
            } else {
                $categoryId = (int) $body['categoryId'];
                if ($categoryId <= 0) {
                    finance_json_error('Invalid category');
                }
                $sets[] = 'category_id = ?';
                $sets[] = 'categorized_at = NOW()';
                $types .= 'i';
                $params[] = $categoryId;
            }
        }

        if (array_key_exists('vendorTag', $body)) {
            $vendorTag = trim((string) ($body['vendorTag'] ?? ''));
            $allowed = [];
            foreach (finance_vendor_tags() as $tag) {
                $allowed[] = $tag[0];
            }
            if ($vendorTag === '') {
                $sets[] = 'vendor_tag = NULL';
            } elseif (!in_array($vendorTag, $allowed, true)) {
                finance_json_error('Invalid vendorTag');
            } else {
                $sets[] = 'vendor_tag = ?';
                $types .= 's';
                $params[] = $vendorTag;
            }
        }

        if (count($sets) === 0) {
            finance_json_error('Nothing to update');
        }

        $types .= 'i';
        $params[] = $id;
        $sql = 'UPDATE finance_transactions SET ' . implode(', ', $sets) . ' WHERE id = ?';
        $stmt = $conn->prepare($sql);
        $bindArgs = [$types];
        foreach ($params as $i => $_) {
            $bindArgs[] = &$params[$i];
        }
        call_user_func_array([$stmt, 'bind_param'], $bindArgs);
        $stmt->execute();
        if ($stmt->affected_rows === 0) {
            // Flip -amount when amount is 0 still "affects" 0 rows in some MySQL modes; re-check existence.
            $check = $conn->query('SELECT id FROM finance_transactions WHERE id = ' . $id . ' LIMIT 1');
            if (!$check || !$check->fetch_assoc()) {
                finance_json_error('Transaction not found', 404);
            }
        }
        $stmt->close();
        $res = $conn->query('SELECT * FROM finance_transactions WHERE id = ' . $id);
        $row = $res->fetch_assoc();
        finance_json_ok(['transaction' => finance_transaction_from_row($row)]);
    } elseif ($resource === 'reports' && $method === 'GET') {
        $range = isset($_GET['range']) ? trim($_GET['range']) : '';
        $month = trim($_GET['month'] ?? '');
        try {
            $window = finance_resolve_date_window($range, $month);
        } catch (Exception $e) {
            finance_json_error($e->getMessage());
        }
        $start = $window['start'];
        $end = $window['end'];
        $stmt = $conn->prepare(
            "SELECT c.id, c.label, c.slug, c.report_group, c.exclude_from_reports,
                    SUM(t.amount) AS total, COUNT(*) AS txn_count
             FROM finance_transactions t
             JOIN finance_categories c ON c.id = t.category_id
             WHERE t.category_id IS NOT NULL
               AND t.txn_date >= ? AND t.txn_date <= ?
             GROUP BY c.id, c.label, c.slug, c.report_group, c.exclude_from_reports
             ORDER BY c.report_group ASC, total DESC"
        );
        $stmt->bind_param('ss', $start, $end);
        $stmt->execute();
        $res = $stmt->get_result();
        $spending = [];
        $moved = [];
        $income = [];
        $ignoredRows = [];
        $ignored = 0.0;
        while ($row = $res->fetch_assoc()) {
            $entry = [
                'categoryId' => (int) $row['id'],
                'label' => $row['label'],
                'slug' => $row['slug'],
                'total' => (float) $row['total'],
                'txnCount' => (int) $row['txn_count'],
            ];
            if ($row['exclude_from_reports'] || $row['report_group'] === 'ignore') {
                // Listed for review; not counted in spending totals.
                $ignoredRows[] = $entry;
                $ignored += $entry['total'];
            } elseif ($row['report_group'] === 'moved') {
                // Investments / transfers — not "spend".
                $moved[] = $entry;
            } elseif ($row['report_group'] === 'income') {
                $income[] = $entry;
            } else {
                // Actual costs (groceries, rent, etc.).
                $spending[] = $entry;
            }
        }
        $stmt->close();
        $spendingTotal = array_sum(array_column($spending, 'total'));
        $incomeTotal = array_sum(array_column($income, 'total'));
        $investedTotal = array_sum(array_column($moved, 'total'));

        // Store / vendor tag totals for spending only (excludes income + investments).
        $vendors = [];
        $vStmt = $conn->prepare(
            'SELECT t.vendor_tag AS slug, SUM(t.amount) AS total, COUNT(*) AS txn_count '
            . finance_spending_join_sql()
            . " AND t.vendor_tag IS NOT NULL AND t.vendor_tag <> ''
               AND t.txn_date >= ? AND t.txn_date <= ?
             GROUP BY t.vendor_tag
             ORDER BY total DESC"
        );
        $vStmt->bind_param('ss', $start, $end);
        $vStmt->execute();
        $vRes = $vStmt->get_result();
        $labelBySlug = [];
        foreach (finance_vendor_tags() as $tag) {
            $labelBySlug[$tag[0]] = $tag[1];
        }
        while ($vRow = $vRes->fetch_assoc()) {
            $slug = $vRow['slug'];
            $vendors[] = [
                'slug' => $slug,
                'label' => $labelBySlug[$slug] ?? $slug,
                'total' => (float) $vRow['total'],
                'txnCount' => (int) $vRow['txn_count'],
            ];
        }
        $vStmt->close();

        // Attach % of spend for category bars.
        foreach ($spending as &$spendRow) {
            $spendRow['pct'] =
                $spendingTotal > 0
                    ? round(100.0 * $spendRow['total'] / $spendingTotal, 1)
                    : 0.0;
        }
        unset($spendRow);

        // Monthly series + average for the active report window.
        $series = finance_monthly_spend_series($conn, $start, $end);

        // Month view: day-by-day cumulative spend vs prior month.
        $dailySpend = [];
        $priorDailySpend = [];
        $pace = null;
        if ($window['range'] === 'month' && !empty($window['month'])) {
            $pacePack = finance_month_spend_pace($conn, $window['month']);
            if ($pacePack) {
                $dailySpend = $pacePack['dailySpend'];
                $priorDailySpend = $pacePack['priorDailySpend'];
                $pace = $pacePack['pace'];
            }
        }

        // Top merchants for fixed 1 / 6 / 12 month windows (excl. MTA).
        $topMerchants = [];
        foreach ([1, 6, 12] as $n) {
            $w = finance_last_n_months_window($n);
            $topMerchants[(string) $n] = finance_top_merchants($conn, $w['start'], $w['end'], 5);
        }

        // Hottest categories by txn count (hints for future pin order).
        $hotCategories = [];
        foreach ([3, 6, 12] as $n) {
            $w = finance_last_n_months_window($n);
            $hotCategories[(string) $n] = finance_hot_categories($conn, $w['start'], $w['end'], 3);
        }

        $allocation = finance_allocation_summary($spendingTotal, $incomeTotal, $investedTotal);

        finance_json_ok([
            'range' => $window['range'],
            'month' => $window['month'],
            'start' => $window['start'],
            'end' => $window['end'],
            'label' => $window['label'],
            'spending' => $spending,
            'moved' => $moved,
            'income' => $income,
            'ignored' => $ignoredRows,
            'vendors' => $vendors,
            'spendingTotal' => $spendingTotal,
            'incomeTotal' => $incomeTotal,
            'investedTotal' => $investedTotal,
            'ignoredTotal' => $ignored,
            'allocation' => $allocation,
            'monthlySpend' => $series['monthlySpend'],
            'avgMonthlySpend' => $series['avgMonthlySpend'],
            'monthBucketCount' => $series['monthBucketCount'],
            'dailySpend' => $dailySpend,
            'priorDailySpend' => $priorDailySpend,
            'pace' => $pace,
            'topMerchants' => $topMerchants,
            'hotCategories' => $hotCategories,
        ]);
    } elseif ($resource === 'export' && $method === 'POST') {
        $month = trim($_GET['month'] ?? '');
        if (!preg_match('/^\d{4}-\d{2}$/', $month)) {
            finance_json_error('month must be YYYY-MM');
        }
        $stmt = $conn->prepare(
            "SELECT t.id, t.txn_date, t.merchant_name, t.amount, c.label AS category_label
             FROM finance_transactions t
             JOIN finance_categories c ON c.id = t.category_id
             WHERE t.category_id IS NOT NULL AND t.exported_at IS NULL
               AND DATE_FORMAT(t.txn_date, '%Y-%m') = ?
             ORDER BY t.txn_date ASC, t.id ASC"
        );
        $stmt->bind_param('s', $month);
        $stmt->execute();
        $res = $stmt->get_result();
        $rows = [];
        $ids = [];
        while ($row = $res->fetch_assoc()) {
            $rows[] = $row;
            $ids[] = (int) $row['id'];
        }
        $stmt->close();
        if (count($rows) === 0) {
            finance_json_error('No categorized transactions to export for that month', 404);
        }
        $csv = finance_build_csv($rows);
        $filename = 'finance-' . $month . '.csv';
        $driveFileId = null;
        try {
            $driveFileId = finance_upload_csv_drive($filename, $csv);
        } catch (Exception $e) {
            if (empty($_GET['download'])) {
                finance_json_error($e->getMessage(), 500);
            }
        }
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $types = str_repeat('i', count($ids));
        $upd = $conn->prepare("UPDATE finance_transactions SET exported_at = NOW() WHERE id IN ($placeholders)");
        $upd->bind_param($types, ...$ids);
        $upd->execute();
        $upd->close();
        if (!empty($_GET['download']) || !$driveFileId) {
            header('Content-Type: text/csv');
            header('Content-Disposition: attachment; filename="' . $filename . '"');
            echo $csv;
            exit();
        }
        finance_json_ok(['filename' => $filename, 'driveFileId' => $driveFileId, 'exported' => count($rows)]);
    } else {
        finance_json_error('Unknown resource', 404);
    }

    $conn->close();
} catch (Exception $e) {
    error_log('finance-api: ' . $e->getMessage());
    finance_json_error($e->getMessage(), 500);
}
