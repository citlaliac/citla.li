import { FINANCE_CATEGORIES } from '../../../server/finance-categories';

describe('finance categories seed', () => {
  test('has 18 categories with 4 pinned', () => {
    expect(FINANCE_CATEGORIES).toHaveLength(18);
    expect(FINANCE_CATEGORIES.filter((c) => c.isPinned)).toHaveLength(4);
    expect(FINANCE_CATEGORIES.filter((c) => c.isPinned).map((c) => c.slug)).toEqual([
      'groceries',
      'restaurants',
      'transportation',
      'self-care',
    ]);
  });

  test('ignore category is excluded from reports', () => {
    const ignore = FINANCE_CATEGORIES.find((c) => c.slug === 'ignore');
    expect(ignore?.excludeFromReports).toBe(true);
  });

  test('includes home goods', () => {
    expect(FINANCE_CATEGORIES.some((c) => c.slug === 'home-goods')).toBe(true);
  });
});
