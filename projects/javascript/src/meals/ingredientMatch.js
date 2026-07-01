/** Normalize ingredient name for fuzzy matching. */
export function normalizeIngredientName(name) {
  return String(name)
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Score similarity 0–1 between two normalized strings. */
export function nameSimilarity(a, b) {
  const na = normalizeIngredientName(a);
  const nb = normalizeIngredientName(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  const wordsA = na.split(' ');
  const wordsB = new Set(nb.split(' '));
  let overlap = 0;
  wordsA.forEach((w) => {
    if (wordsB.has(w) && w.length > 2) overlap += 1;
  });
  return overlap / Math.max(wordsA.length, wordsB.size);
}

/** Suggest best existing ingredients for imported raw text. */
export function suggestIngredients(rawText, existingIngredients, limit = 5) {
  return existingIngredients
    .map((ing) => ({
      ...ing,
      score: nameSimilarity(rawText, ing.name),
    }))
    .filter((x) => x.score > 0.2)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Aggregate recipe ingredients for shopping list (used in tests). */
export function aggregateShoppingItems(recipeIngredientRows) {
  const map = new Map();
  recipeIngredientRows.forEach((row) => {
    const key = `${row.ingredientId}::${row.unit}`;
    const prev = map.get(key);
    if (prev) {
      prev.quantity += Number(row.quantity);
    } else {
      map.set(key, { ...row, quantity: Number(row.quantity) });
    }
  });
  return [...map.values()];
}
