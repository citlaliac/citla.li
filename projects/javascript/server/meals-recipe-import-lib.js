const dns = require('dns').promises;
const { URL } = require('url');

function isPrivateIp(ip) {
  if (ip === '127.0.0.1' || ip === '::1') return true;
  const parts = ip.split('.').map(Number);
  if (parts.length === 4) {
    if (parts[0] === 10) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
    if (parts[0] === 127) return true;
    if (parts[0] === 0) return true;
  }
  return false;
}

async function isUrlAllowed(urlString) {
  let parsed;
  try {
    parsed = new URL(urlString);
  } catch {
    return false;
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) return false;
  const host = parsed.hostname;
  try {
    const { address } = await dns.lookup(host, { family: 4 });
    if (!address || isPrivateIp(address)) return false;
    return true;
  } catch {
    return false;
  }
}

async function fetchUrl(urlString) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(urlString, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CitlaMealPlanner/1.0)' },
      redirect: 'follow',
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function findRecipeNode(data) {
  if (!data || typeof data !== 'object') return null;
  if (data['@type']) {
    const types = data['@type'];
    const list = Array.isArray(types) ? types : [types];
    if (list.some((t) => typeof t === 'string' && t.toLowerCase().includes('recipe'))) {
      return data;
    }
  }
  if (Array.isArray(data['@graph'])) {
    for (const node of data['@graph']) {
      const found = findRecipeNode(node);
      if (found) return found;
    }
  }
  for (const value of Object.values(data)) {
    if (value && typeof value === 'object') {
      const found = findRecipeNode(value);
      if (found) return found;
    }
  }
  return null;
}

function parseServings(yieldVal) {
  if (yieldVal == null) return 4;
  if (typeof yieldVal === 'number') return Math.max(1, Math.floor(yieldVal));
  const str = Array.isArray(yieldVal) ? yieldVal.join(' ') : String(yieldVal);
  const m = str.match(/(\d+)/);
  return m ? Math.max(1, parseInt(m[1], 10)) : 4;
}

function parseInstructions(raw) {
  if (typeof raw === 'string') return raw.trim();
  if (!Array.isArray(raw)) return '';
  const parts = [];
  raw.forEach((step) => {
    if (typeof step === 'string') parts.push(step.trim());
    else if (step && typeof step === 'object') {
      const text = step.text || step.name || '';
      if (typeof text === 'string' && text.trim()) parts.push(text.trim());
    }
  });
  return parts.join('\n\n');
}

function normalizeRecipeNode(node) {
  const name = typeof node.name === 'string' ? node.name : 'Imported Recipe';
  const servings = parseServings(node.recipeYield ?? node.yield);
  const ingredients = [];
  let rawList = node.recipeIngredient ?? [];
  if (typeof rawList === 'string') rawList = [rawList];
  if (Array.isArray(rawList)) {
    rawList.forEach((line) => {
      if (typeof line === 'string' && line.trim()) {
        ingredients.push({ rawText: line.trim() });
      }
    });
  }
  return {
    name,
    servings,
    ingredients,
    instructions: parseInstructions(node.recipeInstructions ?? ''),
    notes: '',
    category: 'Full Meal',
    tags: [],
  };
}

function extractRecipeFromHtml(html) {
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m = re.exec(html);
  while (m !== null) {
    try {
      const data = JSON.parse(m[1].trim());
      const recipe = findRecipeNode(data);
      if (recipe) return normalizeRecipeNode(recipe);
    } catch {
      /* try next block */
    }
    m = re.exec(html);
  }
  return null;
}

async function importRecipeFromUrl(urlString) {
  if (!(await isUrlAllowed(urlString))) {
    const err = new Error('Invalid or disallowed URL');
    err.status = 400;
    throw err;
  }
  const html = await fetchUrl(urlString);
  if (!html) {
    const err = new Error('Could not fetch URL');
    err.status = 400;
    throw err;
  }
  const recipe = extractRecipeFromHtml(html);
  if (!recipe) {
    const err = new Error('Recipe import not supported for this website.');
    err.status = 422;
    throw err;
  }
  return recipe;
}

module.exports = {
  importRecipeFromUrl,
  extractRecipeFromHtml,
  findRecipeNode,
  normalizeRecipeNode,
};
