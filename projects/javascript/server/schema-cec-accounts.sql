-- Catholic e Cloud — simple email/password accounts (PP + worshiper profile)

CREATE TABLE IF NOT EXISTS cec_accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NULL,
  password_hash VARCHAR(255) NULL,
  display_name VARCHAR(24) NOT NULL,
  avatar_id VARCHAR(32) NOT NULL DEFAULT 'frog',
  pontifex_points INT NOT NULL DEFAULT 0,
  completed_actions JSON NULL,
  action_last_done JSON NULL,
  last_spin_date DATE NULL,
  last_active_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_cec_account_email (email),
  UNIQUE KEY uk_cec_display_name (display_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cec_account_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  account_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_cec_session_token (token_hash),
  INDEX idx_cec_session_account (account_id),
  INDEX idx_cec_session_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
