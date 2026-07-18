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
  pp_milli_remainder INT NOT NULL DEFAULT 0,
  next_smite_at DATETIME NULL,
  debuff_until DATETIME NULL,
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

-- Congregations are additive: no existing account/profile/PP rows are replaced.
CREATE TABLE IF NOT EXISTS cec_factions (
  founder_account_id INT PRIMARY KEY,
  status VARCHAR(16) NOT NULL DEFAULT 'active',
  frozen_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cec_faction_status (status, frozen_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cec_faction_memberships (
  account_id INT PRIMARY KEY,
  sponsor_account_id INT NULL,
  faction_founder_id INT NOT NULL,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  switched_at DATETIME NULL,
  INDEX idx_cec_membership_sponsor (sponsor_account_id),
  INDEX idx_cec_membership_faction (faction_founder_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Immutable-ish audit rows make reward/trickle/smite mutations idempotent.
CREATE TABLE IF NOT EXISTS cec_pp_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_key VARCHAR(128) NOT NULL,
  actor_account_id INT NOT NULL,
  beneficiary_account_id INT NOT NULL,
  event_type VARCHAR(32) NOT NULL,
  base_pp INT NOT NULL DEFAULT 0,
  awarded_pp INT NOT NULL DEFAULT 0,
  metadata_json JSON NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_cec_pp_event_key_beneficiary (event_key, beneficiary_account_id),
  INDEX idx_cec_pp_event_actor (actor_account_id, created_at),
  INDEX idx_cec_pp_event_beneficiary (beneficiary_account_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
