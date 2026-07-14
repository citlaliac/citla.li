import { FINANCE_CATEGORIES, FINANCE_VENDOR_TAGS } from '../../../server/finance-categories';

describe('finance categories seed', () => {
  test('has 20 categories with 4 pinned and no Amazon spend category', () => {
    expect(FINANCE_CATEGORIES).toHaveLength(20);
    expect(FINANCE_CATEGORIES.filter((c) => c.isPinned)).toHaveLength(4);
    expect(FINANCE_CATEGORIES.some((c) => c.slug === 'amazon')).toBe(false);
    expect(FINANCE_CATEGORIES.some((c) => c.slug === 'work-lunch')).toBe(true);
  });

  test('ignore category is excluded from reports', () => {
    const ignore = FINANCE_CATEGORIES.find((c) => c.slug === 'ignore');
    expect(ignore?.excludeFromReports).toBe(true);
  });

  test('Amazon is a vendor tag, not a category', () => {
    expect(FINANCE_VENDOR_TAGS.some((t) => t.slug === 'amazon')).toBe(true);
    expect(FINANCE_CATEGORIES.some((c) => c.slug === 'gifts-donations')).toBe(true);
    expect(FINANCE_CATEGORIES.find((c) => c.slug === 'income')?.reportGroup).toBe('income');
  });
});
