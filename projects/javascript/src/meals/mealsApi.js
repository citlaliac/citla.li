import { mealsApiBase, mealsImportUrl } from './mealsConfig';

function buildUrl(resource, { id = 0, action = '', query = {} } = {}) {
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    let path = `${mealsApiBase()}/${resource}`;
    if (id) path += `/${id}`;
    if (action) path += `/${action}`;
    const qs = new URLSearchParams(query).toString();
    return qs ? `${path}?${qs}` : path;
  }
  const params = new URLSearchParams({ resource, ...query });
  if (id) params.set('id', String(id));
  if (action) params.set('action', action);
  return `${mealsApiBase()}?${params.toString()}`;
}

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export function fetchIngredients(category = '') {
  const query = category ? { category } : {};
  return request(buildUrl('ingredients', { query })).then((d) => d.ingredients);
}

export function createIngredient(payload) {
  return request(buildUrl('ingredients'), { method: 'POST', body: JSON.stringify(payload) });
}

export function updateIngredient(id, payload) {
  return request(buildUrl('ingredients', { id }), { method: 'PUT', body: JSON.stringify(payload) });
}

export function deleteIngredient(id) {
  return request(buildUrl('ingredients', { id }), { method: 'DELETE' });
}

export function fetchRecipes(filters = {}) {
  const query = {};
  if (filters.category) query.category = filters.category;
  if (filters.tag) query.tag = filters.tag;
  return request(buildUrl('recipes', { query })).then((d) => d.recipes);
}

export function fetchRecipe(id) {
  return request(buildUrl('recipes', { id })).then((d) => d.recipe);
}

export function createRecipe(payload) {
  return request(buildUrl('recipes'), { method: 'POST', body: JSON.stringify(payload) });
}

export function updateRecipe(id, payload) {
  return request(buildUrl('recipes', { id }), { method: 'PUT', body: JSON.stringify(payload) });
}

export function deleteRecipe(id) {
  return request(buildUrl('recipes', { id }), { method: 'DELETE' });
}

export function importRecipePreview(url) {
  return fetch(mealsImportUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  }).then(async (res) => {
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Import failed');
    }
    return data.recipe;
  });
}

export function fetchPlans() {
  return request(buildUrl('plans')).then((d) => d.plans);
}

export function fetchPlan(id) {
  return request(buildUrl('plans', { id })).then((d) => d.plan);
}

export function createPlan(payload) {
  return request(buildUrl('plans'), { method: 'POST', body: JSON.stringify(payload) });
}

export function updatePlan(id, payload) {
  return request(buildUrl('plans', { id }), { method: 'PUT', body: JSON.stringify(payload) });
}

export function deletePlan(id) {
  return request(buildUrl('plans', { id }), { method: 'DELETE' });
}

export function fetchShoppingList(planId) {
  return request(buildUrl('shopping', { query: { planId: String(planId) } })).then(
    (d) => d.shoppingList
  );
}

export function generateShoppingList(planId) {
  const isDev = process.env.NODE_ENV === 'development';
  const url = isDev
    ? `${mealsApiBase()}/shopping/generate`
    : buildUrl('shopping', { action: 'generate' });
  return request(url, { method: 'POST', body: JSON.stringify({ planId }) }).then(
    (d) => d.shoppingList
  );
}

export function toggleShoppingItem(itemId, isChecked) {
  const isDev = process.env.NODE_ENV === 'development';
  const url = isDev ? `${mealsApiBase()}/shopping/toggle` : buildUrl('shopping', { action: 'toggle' });
  return request(url, { method: 'PATCH', body: JSON.stringify({ itemId, isChecked }) });
}

export function resetShoppingList(planId) {
  const isDev = process.env.NODE_ENV === 'development';
  const url = isDev ? `${mealsApiBase()}/shopping/reset` : buildUrl('shopping', { action: 'reset' });
  return request(url, { method: 'POST', body: JSON.stringify({ planId }) });
}
