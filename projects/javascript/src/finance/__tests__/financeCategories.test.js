import { FINANCE_CATEGORIES } from '../../../server/finance-categories';

describe('finance categories seed', () => {
  test('has 20 categories with 4 pinned', () => {
    expect(FINANCE_CATEGORIES).toHaveLength(20);
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

  test('includes home goods, gifts, and income', () => {
    expect(FINANCE_CATEGORIES.some((c) => c.slug === 'home-goods')).toBe(true);
    expect(FINANCE_CATEGORIES.some((c) => c.slug === 'gifts-donations')).toBe(true);
    const income = FINANCE_CATEGORIES.find((c) => c.slug === 'income');
    expect(income?.reportGroup).toBe('income');
  });
});
