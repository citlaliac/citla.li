-- Run once on citlwqfk_submissions (or rely on cec_ensure_tables in PHP).

CREATE TABLE IF NOT EXISTS cec_bulletin (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(36) NOT NULL,
  display_name VARCHAR(24) NOT NULL,
  rank_label VARCHAR(32) NOT NULL,
  body VARCHAR(280) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_moderated TINYINT(1) DEFAULT 0,
  moderation_status VARCHAR(255) NULL,
  INDEX idx_bulletin_visible (is_moderated, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cec_wheel_spins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(36) NOT NULL,
  spin_date DATE NOT NULL,
  saint_id VARCHAR(32) NOT NULL,
  saint_label VARCHAR(64) NOT NULL,
  points_awarded INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY one_spin_per_day (session_id, spin_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
