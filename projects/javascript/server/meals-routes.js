const express = require('express');
const fs = require('fs');
const path = require('path');
const { importRecipeFromUrl } = require('./meals-recipe-import-lib');

const CATEGORY_ORDER =
  "FIELD(category, 'Protein', 'Legume', 'Vegetable', 'Fruit', 'Grain', 'Herb', 'Dairy', 'Condiment', 'Other'), name ASC";

let tablesReady = false;

async function ensureMealsTables(connection) {
  if (tablesReady) return;
  const schemaPath = path.join(__dirname, 'schema-meals.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith('--'));
  for (const stmt of statements) {
    await connection.query(stmt);
  }
  tablesReady = true;
}

function jsonOk(res, data = {}) {
  res.json({ success: true, ...data });
}

function jsonError(res, message, status = 400) {
  res.status(status).json({ success: false, error: message });
}

function decodeTags(raw) {
  if (raw == null) return [];
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
  return raw;
}

function encodeTags(tags) {
  return JSON.stringify(Array.isArray(tags) ? tags : []);
}

async function fetchRecipeIngredients(connection, recipeId) {
  const [rows] = await connection.execute(
    `SELECT ri.id, ri.ingredient_id AS ingredientId, ri.quantity, ri.unit,
            i.name AS ingredientName, i.category AS ingredientCategory
     FROM meal_recipe_ingredients ri
     JOIN meal_ingredients i ON i.id = ri.ingredient_id
     WHERE ri.recipe_id = ?
     ORDER BY i.name`,
    [recipeId]
  );
  return rows.map((row) => ({
    ...row,
    id: Number(row.id),
    ingredientId: Number(row.ingredientId),
    quantity: Number(row.quantity),
  }));
}

function rowToRecipe(row) {
  return {
    id: Number(row.id),
    name: row.name,
    category: row.category,
    servings: Number(row.servings),
    notes: row.notes,
    instructions: row.instructions,
    tags: decodeTags(row.tags),
  };
}

async function saveRecipe(connection, id, body) {
  const name = String(body.name || '').trim();
  const category = String(body.category || 'Full Meal').trim();
  let servings = parseInt(body.servings, 10) || 4;
  if (servings < 1) servings = 1;
  const notes = body.notes ?? null;
  const instructions = body.instructions ?? null;
  const tagsJson = encodeTags(body.tags);
  const ingredients = Array.isArray(body.ingredients) ? body.ingredients : [];

  if (!name) {
    const err = new Error('Recipe name is required');
    err.status = 400;
    throw err;
  }

  await connection.beginTransaction();
  try {
    let recipeId = id;
    if (recipeId == null) {
      const [result] = await connection.execute(
        'INSERT INTO meal_recipes (name, category, servings, notes, instructions, tags) VALUES (?, ?, ?, ?, ?, ?)',
        [name, category, servings, notes, instructions, tagsJson]
      );
      recipeId = result.insertId;
    } else {
      await connection.execute(
        'UPDATE meal_recipes SET name = ?, category = ?, servings = ?, notes = ?, instructions = ?, tags = ? WHERE id = ?',
        [name, category, servings, notes, instructions, tagsJson, recipeId]
      );
      await connection.execute('DELETE FROM meal_recipe_ingredients WHERE recipe_id = ?', [recipeId]);
    }

    for (const ing of ingredients) {
      const ingredientId = parseInt(ing.ingredientId, 10);
      const qty = parseFloat(ing.quantity) || 1;
      const unit = String(ing.unit || 'each').trim();
      if (ingredientId > 0) {
        await connection.execute(
          'INSERT INTO meal_recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES (?, ?, ?, ?)',
          [recipeId, ingredientId, qty, unit]
        );
      }
    }

    await connection.commit();
    return recipeId;
  } catch (e) {
    await connection.rollback();
    throw e;
  }
}

async function fetchPlanMeals(connection, planId) {
  const [rows] = await connection.execute(
    `SELECT day_of_week AS dayOfWeek, meal_type AS mealType, recipe_id AS recipeId
     FROM meal_weekly_plan_meals WHERE weekly_plan_id = ?`,
    [planId]
  );
  return rows.map((row) => ({
    dayOfWeek: Number(row.dayOfWeek),
    mealType: row.mealType,
    recipeId: row.recipeId != null ? Number(row.recipeId) : null,
  }));
}

async function savePlanMeals(connection, planId, meals) {
  await connection.execute('DELETE FROM meal_weekly_plan_meals WHERE weekly_plan_id = ?', [planId]);
  for (const meal of meals) {
    const day = parseInt(meal.dayOfWeek, 10);
    const mealType = meal.mealType === 'dinner' ? 'dinner' : 'lunch';
    const recipeId =
      meal.recipeId != null && meal.recipeId !== '' ? parseInt(meal.recipeId, 10) : null;
    if (day < 0 || day > 6) continue;
    if (recipeId == null) {
      await connection.execute(
        'INSERT INTO meal_weekly_plan_meals (weekly_plan_id, day_of_week, meal_type, recipe_id) VALUES (?, ?, ?, NULL)',
        [planId, day, mealType]
      );
    } else {
      await connection.execute(
        'INSERT INTO meal_weekly_plan_meals (weekly_plan_id, day_of_week, meal_type, recipe_id) VALUES (?, ?, ?, ?)',
        [planId, day, mealType, recipeId]
      );
    }
  }
}

async function getListIdForPlan(connection, planId) {
  const [rows] = await connection.execute(
    'SELECT id FROM meal_shopping_lists WHERE weekly_plan_id = ?',
    [planId]
  );
  return rows[0] ? Number(rows[0].id) : null;
}

async function getShoppingList(connection, planId) {
  const listId = await getListIdForPlan(connection, planId);
  if (!listId) {
    return { planId, generatedAt: null, items: [] };
  }
  const [[meta]] = await connection.execute(
    'SELECT generated_at AS generatedAt FROM meal_shopping_lists WHERE id = ?',
    [listId]
  );
  const [items] = await connection.execute(
    `SELECT sli.id, sli.quantity, sli.unit, sli.is_checked AS isChecked,
            i.id AS ingredientId, i.name AS ingredientName, i.category
     FROM meal_shopping_list_items sli
     JOIN meal_ingredients i ON i.id = sli.ingredient_id
     WHERE sli.shopping_list_id = ?
     ORDER BY ${CATEGORY_ORDER}`,
    [listId]
  );
  return {
    planId,
    listId,
    generatedAt: meta?.generatedAt ?? null,
    items: items.map((row) => ({
      id: Number(row.id),
      ingredientId: Number(row.ingredientId),
      ingredientName: row.ingredientName,
      category: row.category,
      quantity: Number(row.quantity),
      unit: row.unit,
      isChecked: Boolean(row.isChecked),
    })),
  };
}

async function generateShoppingList(connection, planId) {
  const [aggregated] = await connection.execute(
    `SELECT ri.ingredient_id, ri.unit, SUM(ri.quantity) AS totalQty,
            i.name, i.category
     FROM meal_weekly_plan_meals pm
     JOIN meal_recipe_ingredients ri ON ri.recipe_id = pm.recipe_id
     JOIN meal_ingredients i ON i.id = ri.ingredient_id
     WHERE pm.weekly_plan_id = ? AND pm.recipe_id IS NOT NULL
     GROUP BY ri.ingredient_id, ri.unit, i.name, i.category
     ORDER BY ${CATEGORY_ORDER}`,
    [planId]
  );

  await connection.beginTransaction();
  try {
    let listId = await getListIdForPlan(connection, planId);
    if (listId) {
      await connection.execute('DELETE FROM meal_shopping_list_items WHERE shopping_list_id = ?', [
        listId,
      ]);
      await connection.execute(
        'UPDATE meal_shopping_lists SET generated_at = NOW() WHERE id = ?',
        [listId]
      );
    } else {
      const [ins] = await connection.execute(
        'INSERT INTO meal_shopping_lists (weekly_plan_id) VALUES (?)',
        [planId]
      );
      listId = ins.insertId;
    }

    for (const row of aggregated) {
      await connection.execute(
        `INSERT INTO meal_shopping_list_items (shopping_list_id, ingredient_id, quantity, unit, is_checked)
         VALUES (?, ?, ?, ?, 0)`,
        [listId, row.ingredient_id, row.totalQty, row.unit]
      );
    }

    await connection.commit();
    return getShoppingList(connection, planId);
  } catch (e) {
    await connection.rollback();
    throw e;
  }
}

function registerMealsRoutes(app, getConnection) {
  const router = express.Router();

  router.use(async (req, res, next) => {
    let connection;
    try {
      connection = await getConnection();
      await ensureMealsTables(connection);
      req.mealsDb = connection;
      res.on('finish', () => {
        connection.end().catch(() => {});
      });
      next();
    } catch (err) {
      if (connection) connection.end().catch(() => {});
      jsonError(res, err.message, 500);
    }
  });

  router.get('/ingredients', async (req, res) => {
    const conn = req.mealsDb;
    const category = (req.query.category || '').trim();
    let sql =
      'SELECT id, name, default_unit AS defaultUnit, category FROM meal_ingredients';
    const params = [];
    if (category) {
      sql += ' WHERE category = ?';
      params.push(category);
    }
    sql += ` ORDER BY ${CATEGORY_ORDER}`;
    const [rows] = await conn.execute(sql, params);
    jsonOk(res, {
      ingredients: rows.map((r) => ({ ...r, id: Number(r.id) })),
    });
  });

  router.post('/ingredients', async (req, res) => {
    const conn = req.mealsDb;
    const name = String(req.body.name || '').trim();
    const defaultUnit = String(req.body.defaultUnit || 'each').trim();
    const category = String(req.body.category || 'Other').trim();
    if (!name) return jsonError(res, 'Name is required');
    try {
      const [result] = await conn.execute(
        'INSERT INTO meal_ingredients (name, default_unit, category) VALUES (?, ?, ?)',
        [name, defaultUnit, category]
      );
      jsonOk(res, { id: result.insertId });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return jsonError(res, 'An ingredient with that name already exists');
      }
      throw err;
    }
  });

  router.put('/ingredients/:id', async (req, res) => {
    const conn = req.mealsDb;
    const id = parseInt(req.params.id, 10);
    const name = String(req.body.name || '').trim();
    const defaultUnit = String(req.body.defaultUnit || 'each').trim();
    const category = String(req.body.category || 'Other').trim();
    if (!name) return jsonError(res, 'Name is required');
    try {
      await conn.execute(
        'UPDATE meal_ingredients SET name = ?, default_unit = ?, category = ? WHERE id = ?',
        [name, defaultUnit, category, id]
      );
      jsonOk(res);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return jsonError(res, 'An ingredient with that name already exists');
      }
      throw err;
    }
  });

  router.delete('/ingredients/:id', async (req, res) => {
    const conn = req.mealsDb;
    const id = parseInt(req.params.id, 10);
    const [[row]] = await conn.execute(
      'SELECT COUNT(*) AS c FROM meal_recipe_ingredients WHERE ingredient_id = ?',
      [id]
    );
    if (Number(row.c) > 0) {
      return jsonError(res, 'Ingredient is used in recipes and cannot be deleted');
    }
    await conn.execute('DELETE FROM meal_ingredients WHERE id = ?', [id]);
    jsonOk(res);
  });

  router.get('/recipes', async (req, res) => {
    const conn = req.mealsDb;
    let sql = 'SELECT id, name, category, servings, notes, instructions, tags FROM meal_recipes';
    const params = [];
    const parts = [];
    if (req.query.category) {
      parts.push('category = ?');
      params.push(req.query.category);
    }
    if (req.query.tag) {
      parts.push('JSON_CONTAINS(tags, ?)');
      params.push(JSON.stringify(req.query.tag));
    }
    if (parts.length) sql += ` WHERE ${parts.join(' AND ')}`;
    sql += ' ORDER BY name ASC';
    const [rows] = await conn.execute(sql, params);
    jsonOk(res, { recipes: rows.map(rowToRecipe) });
  });

  router.get('/recipes/:id', async (req, res) => {
    const conn = req.mealsDb;
    const id = parseInt(req.params.id, 10);
    const [rows] = await conn.execute(
      'SELECT id, name, category, servings, notes, instructions, tags FROM meal_recipes WHERE id = ?',
      [id]
    );
    if (!rows[0]) return jsonError(res, 'Recipe not found', 404);
    const recipe = rowToRecipe(rows[0]);
    recipe.ingredients = await fetchRecipeIngredients(conn, id);
    jsonOk(res, { recipe });
  });

  router.post('/recipes', async (req, res) => {
    const conn = req.mealsDb;
    try {
      const recipeId = await saveRecipe(conn, null, req.body);
      jsonOk(res, { id: recipeId });
    } catch (err) {
      jsonError(res, err.message, err.status || 500);
    }
  });

  router.put('/recipes/:id', async (req, res) => {
    const conn = req.mealsDb;
    try {
      const recipeId = await saveRecipe(conn, parseInt(req.params.id, 10), req.body);
      jsonOk(res, { id: recipeId });
    } catch (err) {
      jsonError(res, err.message, err.status || 500);
    }
  });

  router.delete('/recipes/:id', async (req, res) => {
    const conn = req.mealsDb;
    await conn.execute('DELETE FROM meal_recipes WHERE id = ?', [parseInt(req.params.id, 10)]);
    jsonOk(res);
  });

  router.get('/plans', async (req, res) => {
    const conn = req.mealsDb;
    const [rows] = await conn.execute(
      'SELECT id, name, week_start AS weekStart FROM meal_weekly_plans ORDER BY week_start DESC, id DESC'
    );
    jsonOk(res, { plans: rows.map((r) => ({ ...r, id: Number(r.id) })) });
  });

  router.get('/plans/:id', async (req, res) => {
    const conn = req.mealsDb;
    const id = parseInt(req.params.id, 10);
    const [rows] = await conn.execute(
      'SELECT id, name, week_start AS weekStart FROM meal_weekly_plans WHERE id = ?',
      [id]
    );
    if (!rows[0]) return jsonError(res, 'Plan not found', 404);
    const plan = { ...rows[0], id: Number(rows[0].id) };
    plan.meals = await fetchPlanMeals(conn, id);
    jsonOk(res, { plan });
  });

  router.post('/plans', async (req, res) => {
    const conn = req.mealsDb;
    const name = String(req.body.name || 'Weekly plan').trim();
    const weekStart = String(req.body.weekStart || new Date().toISOString().slice(0, 10));
    const [result] = await conn.execute(
      'INSERT INTO meal_weekly_plans (name, week_start) VALUES (?, ?)',
      [name, weekStart]
    );
    const planId = result.insertId;
    if (Array.isArray(req.body.meals) && req.body.meals.length) {
      await savePlanMeals(conn, planId, req.body.meals);
    }
    jsonOk(res, { id: planId });
  });

  router.put('/plans/:id', async (req, res) => {
    const conn = req.mealsDb;
    const id = parseInt(req.params.id, 10);
    const name = String(req.body.name || 'Weekly plan').trim();
    const weekStart = String(req.body.weekStart || new Date().toISOString().slice(0, 10));
    await conn.execute('UPDATE meal_weekly_plans SET name = ?, week_start = ? WHERE id = ?', [
      name,
      weekStart,
      id,
    ]);
    if (Array.isArray(req.body.meals)) {
      await savePlanMeals(conn, id, req.body.meals);
    }
    jsonOk(res, { id });
  });

  router.delete('/plans/:id', async (req, res) => {
    const conn = req.mealsDb;
    await conn.execute('DELETE FROM meal_weekly_plans WHERE id = ?', [parseInt(req.params.id, 10)]);
    jsonOk(res);
  });

  router.get('/shopping', async (req, res) => {
    const planId = parseInt(req.query.planId, 10);
    if (!planId) return jsonError(res, 'planId is required');
    const list = await getShoppingList(req.mealsDb, planId);
    jsonOk(res, { shoppingList: list });
  });

  router.post('/shopping/generate', async (req, res) => {
    const planId = parseInt(req.body.planId, 10);
    if (!planId) return jsonError(res, 'planId is required');
    const list = await generateShoppingList(req.mealsDb, planId);
    jsonOk(res, { shoppingList: list });
  });

  router.patch('/shopping/toggle', async (req, res) => {
    const itemId = parseInt(req.body.itemId, 10);
    const isChecked = req.body.isChecked ? 1 : 0;
    if (!itemId) return jsonError(res, 'itemId is required');
    await req.mealsDb.execute(
      'UPDATE meal_shopping_list_items SET is_checked = ? WHERE id = ?',
      [isChecked, itemId]
    );
    jsonOk(res);
  });

  router.post('/shopping/reset', async (req, res) => {
    const planId = parseInt(req.body.planId, 10);
    if (!planId) return jsonError(res, 'planId is required');
    const listId = await getListIdForPlan(req.mealsDb, planId);
    if (listId) {
      await req.mealsDb.execute(
        'UPDATE meal_shopping_list_items SET is_checked = 0 WHERE shopping_list_id = ?',
        [listId]
      );
    }
    jsonOk(res);
  });

  app.use('/api/meals', router);

  app.post('/api/meals/import', async (req, res) => {
    let connection;
    try {
      const url = String(req.body.url || '').trim();
      if (!url) return jsonError(res, 'url is required');
      const recipe = await importRecipeFromUrl(url);
      jsonOk(res, { recipe });
    } catch (err) {
      jsonError(res, err.message, err.status || 500);
    }
  });
}

module.exports = { registerMealsRoutes, ensureMealsTables };
