-- Run once on citlwqfk_submissions (or rely on submit-kudos.php CREATE TABLE IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS kudos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  honoree_name VARCHAR(255) NOT NULL,
  reason TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_moderated TINYINT(1) DEFAULT 1,
  moderation_status VARCHAR(255) DEFAULT 'approved'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
