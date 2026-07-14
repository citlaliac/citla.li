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
        $token = finance_issue_session($conn);
        finance_json_ok(['token' => $token]);
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
            $categories[] = finance_category_from_row($row);
        }
        finance_json_ok(['categories' => $categories]);
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
        // Optional filters: status, month (YYYY-MM), categoryId — for report drill-down / recategorize.
        $status = $_GET['status'] ?? 'all';
        $month = isset($_GET['month']) ? trim($_GET['month']) : '';
        $categoryId = isset($_GET['categoryId']) ? (int) $_GET['categoryId'] : 0;

        $where = [];
        $types = '';
        $params = [];

        if ($status === 'uncategorized') {
            $where[] = 'category_id IS NULL';
        } elseif ($status === 'categorized') {
            $where[] = 'category_id IS NOT NULL';
        }
        if ($month !== '') {
            if (!preg_match('/^\d{4}-\d{2}$/', $month)) {
                finance_json_error('month must be YYYY-MM');
            }
            $where[] = "DATE_FORMAT(txn_date, '%Y-%m') = ?";
            $types .= 's';
            $params[] = $month;
        }
        if ($categoryId > 0) {
            $where[] = 'category_id = ?';
            $types .= 'i';
            $params[] = $categoryId;
        }

        $sql = 'SELECT * FROM finance_transactions';
        if (count($where) > 0) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }
        $sql .= ' ORDER BY txn_date DESC, id DESC LIMIT 500';

        $transactions = [];
        if ($types !== '') {
            $stmt = $conn->prepare($sql);
            // mysqli bind_param needs references; build args array carefully.
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
        $categoryId = (int) ($body['categoryId'] ?? 0);
        if ($id <= 0 || $categoryId <= 0) {
            finance_json_error('Invalid transaction or category');
        }
        $stmt = $conn->prepare(
            'UPDATE finance_transactions SET category_id = ?, categorized_at = NOW() WHERE id = ?'
        );
        $stmt->bind_param('ii', $categoryId, $id);
        $stmt->execute();
        if ($stmt->affected_rows === 0) {
            finance_json_error('Transaction not found', 404);
        }
        $stmt->close();
        $res = $conn->query('SELECT * FROM finance_transactions WHERE id = ' . $id);
        $row = $res->fetch_assoc();
        finance_json_ok(['transaction' => finance_transaction_from_row($row)]);
    } elseif ($resource === 'reports' && $method === 'GET') {
        $month = trim($_GET['month'] ?? '');
        if (!preg_match('/^\d{4}-\d{2}$/', $month)) {
            finance_json_error('month must be YYYY-MM');
        }
        $stmt = $conn->prepare(
            "SELECT c.id, c.label, c.slug, c.report_group, c.exclude_from_reports,
                    SUM(t.amount) AS total, COUNT(*) AS txn_count
             FROM finance_transactions t
             JOIN finance_categories c ON c.id = t.category_id
             WHERE t.category_id IS NOT NULL AND DATE_FORMAT(t.txn_date, '%Y-%m') = ?
             GROUP BY c.id, c.label, c.slug, c.report_group, c.exclude_from_reports
             ORDER BY c.report_group ASC, total DESC"
        );
        $stmt->bind_param('s', $month);
        $stmt->execute();
        $res = $stmt->get_result();
        $spending = [];
        $moved = [];
        $income = [];
        $ignored = 0.0;
        while ($row = $res->fetch_assoc()) {
            $entry = [
                'categoryId' => (int) $row['id'],
                'label' => $row['label'],
                'slug' => $row['slug'],
                'total' => (float) $row['total'],
                'txnCount' => (int) $row['txn_count'],
            ];
            if ($row['exclude_from_reports']) {
                $ignored += $entry['total'];
            } elseif ($row['report_group'] === 'moved') {
                $moved[] = $entry;
            } elseif ($row['report_group'] === 'income') {
                $income[] = $entry;
            } else {
                $spending[] = $entry;
            }
        }
        $stmt->close();
        $spendingTotal = array_sum(array_column($spending, 'total'));
        $incomeTotal = array_sum(array_column($income, 'total'));
        finance_json_ok([
            'month' => $month,
            'spending' => $spending,
            'moved' => $moved,
            'income' => $income,
            'spendingTotal' => $spendingTotal,
            'incomeTotal' => $incomeTotal,
            'ignoredTotal' => $ignored,
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
