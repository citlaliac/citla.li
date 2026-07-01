-- Run once on citlwqfk_submissions (or rely on meals_ensure_tables in PHP).

CREATE TABLE IF NOT EXISTS meal_ingredients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  default_unit VARCHAR(32) NOT NULL DEFAULT 'each',
  category ENUM(
    'Protein', 'Legume', 'Vegetable', 'Fruit', 'Grain',
    'Herb', 'Dairy', 'Condiment', 'Other'
  ) NOT NULL DEFAULT 'Other',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_meal_ingredient_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS meal_recipes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  category ENUM('Protein', 'Legume', 'Salad', 'Vegetable', 'Full Meal') NOT NULL DEFAULT 'Full Meal',
  servings INT NOT NULL DEFAULT 4,
  notes TEXT NULL,
  instructions TEXT NULL,
  tags JSON NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS meal_recipe_ingredients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recipe_id INT NOT NULL,
  ingredient_id INT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
  unit VARCHAR(32) NOT NULL DEFAULT 'each',
  FOREIGN KEY (recipe_id) REFERENCES meal_recipes(id) ON DELETE CASCADE,
  FOREIGN KEY (ingredient_id) REFERENCES meal_ingredients(id) ON DELETE RESTRICT,
  INDEX idx_recipe (recipe_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS meal_weekly_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  week_start DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS meal_weekly_plan_meals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  weekly_plan_id INT NOT NULL,
  day_of_week TINYINT NOT NULL COMMENT '0=Mon .. 6=Sun',
  meal_type ENUM('lunch', 'dinner') NOT NULL,
  recipe_id INT NULL,
  FOREIGN KEY (weekly_plan_id) REFERENCES meal_weekly_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (recipe_id) REFERENCES meal_recipes(id) ON DELETE SET NULL,
  UNIQUE KEY uk_plan_slot (weekly_plan_id, day_of_week, meal_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS meal_shopping_lists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  weekly_plan_id INT NOT NULL,
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (weekly_plan_id) REFERENCES meal_weekly_plans(id) ON DELETE CASCADE,
  UNIQUE KEY uk_plan_list (weekly_plan_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS meal_shopping_list_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shopping_list_id INT NOT NULL,
  ingredient_id INT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(32) NOT NULL,
  is_checked TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (shopping_list_id) REFERENCES meal_shopping_lists(id) ON DELETE CASCADE,
  FOREIGN KEY (ingredient_id) REFERENCES meal_ingredients(id) ON DELETE CASCADE,
  UNIQUE KEY uk_list_ingredient_unit (shopping_list_id, ingredient_id, unit)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
