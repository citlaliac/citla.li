import {
  normalizeIngredientName,
  nameSimilarity,
  suggestIngredients,
  aggregateShoppingItems,
} from '../ingredientMatch';

describe('normalizeIngredientName', () => {
  test('lowercases and strips punctuation', () => {
    expect(normalizeIngredientName('  Black Beans, canned! ')).toBe('black beans canned');
  });
});

describe('nameSimilarity', () => {
  test('exact match scores 1', () => {
    expect(nameSimilarity('black beans', 'Black Beans')).toBe(1);
  });

  test('substring match scores high', () => {
    expect(nameSimilarity('beans', 'black beans')).toBeGreaterThanOrEqual(0.85);
  });
});

describe('suggestIngredients', () => {
  const existing = [
    { id: 1, name: 'Black beans' },
    { id: 2, name: 'Chicken breast' },
  ];

  test('suggests close matches', () => {
    const suggestions = suggestIngredients('black bean', existing);
    expect(suggestions[0].id).toBe(1);
    expect(suggestions[0].score).toBeGreaterThan(0.2);
  });
});

describe('aggregateShoppingItems', () => {
  test('sums quantities by ingredient and unit', () => {
    const rows = [
      { ingredientId: 1, unit: 'cup', quantity: 2, category: 'Legume' },
      { ingredientId: 1, unit: 'cup', quantity: 1, category: 'Legume' },
      { ingredientId: 2, unit: 'each', quantity: 3, category: 'Protein' },
    ];
    const agg = aggregateShoppingItems(rows);
    expect(agg).toHaveLength(2);
    const beans = agg.find((x) => x.ingredientId === 1);
    expect(beans.quantity).toBe(3);
  });
});
