-- Personal finance module (Oops-style categorizer)

CREATE TABLE IF NOT EXISTS finance_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_finance_session_token (token_hash),
  INDEX idx_finance_session_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS finance_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(48) NOT NULL,
  label VARCHAR(96) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_pinned TINYINT(1) NOT NULL DEFAULT 0,
  exclude_from_reports TINYINT(1) NOT NULL DEFAULT 0,
  report_group VARCHAR(16) NOT NULL DEFAULT 'spending',
  UNIQUE KEY uk_finance_category_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS finance_plaid_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_id VARCHAR(64) NOT NULL,
  institution_name VARCHAR(128) NOT NULL DEFAULT '',
  access_token_enc TEXT NOT NULL,
  transactions_cursor VARCHAR(256) NULL,
  last_synced_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_finance_plaid_item (item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS finance_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plaid_transaction_id VARCHAR(128) NOT NULL,
  plaid_item_id INT NOT NULL,
  txn_date DATE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  amount_manual TINYINT(1) NOT NULL DEFAULT 0,
  merchant_name VARCHAR(255) NOT NULL DEFAULT '',
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
