import { FINANCE_CATEGORIES, FINANCE_VENDOR_TAGS } from '../../../server/finance-categories';

describe('finance categories seed', () => {
  test('has 20 categories with top pinned and no retired slugs', () => {
    expect(FINANCE_CATEGORIES).toHaveLength(20);
    expect(FINANCE_CATEGORIES.filter((c) => c.isPinned)).toHaveLength(4);
    expect(FINANCE_CATEGORIES.map((c) => c.slug).slice(0, 4)).toEqual([
      'groceries',
      'restaurants',
      'travel-vacation',
      'utilities',
    ]);
    expect(FINANCE_CATEGORIES.some((c) => c.slug === 'amazon')).toBe(false);
    expect(FINANCE_CATEGORIES.some((c) => c.slug === 'business')).toBe(true);
    expect(FINANCE_CATEGORIES.some((c) => c.slug === 'subscriptions')).toBe(true);
    expect(FINANCE_CATEGORIES.some((c) => c.slug === 'cash')).toBe(false);
    expect(FINANCE_CATEGORIES.some((c) => c.slug === 'savings')).toBe(false);
  });

  test('every category has a distinct color chip', () => {
    const colors = FINANCE_CATEGORIES.map((c) => c.color);
    expect(colors.every((c) => /^#[0-9a-fA-F]{6}$/.test(c))).toBe(true);
    expect(new Set(colors).size).toBe(FINANCE_CATEGORIES.length);
  });

  test('ignore is excluded from spending totals but kept for report review', () => {
    const ignore = FINANCE_CATEGORIES.find((c) => c.slug === 'ignore');
    expect(ignore?.excludeFromReports).toBe(true);
    expect(ignore?.reportGroup).toBe('ignore');
  });

  test('Amazon is a vendor tag, not a category', () => {
    expect(FINANCE_VENDOR_TAGS.some((t) => t.slug === 'amazon')).toBe(true);
    expect(FINANCE_CATEGORIES.some((c) => c.slug === 'gifts-donations')).toBe(true);
    expect(FINANCE_CATEGORIES.find((c) => c.slug === 'income')?.reportGroup).toBe('income');
  });
});
