/** Local UI preview — mock inbox data when REACT_APP_FINANCE_DEMO=true */

export const DEMO_CATEGORIES = [
  { id: 1, slug: 'groceries', label: 'Groceries', sortOrder: 1, isPinned: true, excludeFromReports: false, reportGroup: 'spending' },
  { id: 2, slug: 'restaurants', label: 'Restaurants', sortOrder: 2, isPinned: true, excludeFromReports: false, reportGroup: 'spending' },
  { id: 3, slug: 'transportation', label: 'Transportation', sortOrder: 3, isPinned: true, excludeFromReports: false, reportGroup: 'spending' },
  { id: 4, slug: 'self-care', label: 'Self Care', sortOrder: 4, isPinned: true, excludeFromReports: false, reportGroup: 'spending' },
  { id: 5, slug: 'home-goods', label: 'Home Goods', sortOrder: 5, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { id: 6, slug: 'oops-splurge', label: 'Oops / Splurge', sortOrder: 6, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { id: 7, slug: 'entertainment', label: 'Entertainment', sortOrder: 7, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { id: 8, slug: 'clothing', label: 'Clothing', sortOrder: 8, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { id: 9, slug: 'utilities', label: 'Utilities', sortOrder: 9, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { id: 10, slug: 'rent', label: 'Rent', sortOrder: 10, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { id: 11, slug: 'healthcare', label: 'Healthcare', sortOrder: 11, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { id: 12, slug: 'travel-vacation', label: 'Travel / Vacation', sortOrder: 12, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { id: 13, slug: 'education-classes', label: 'Education / Classes', sortOrder: 13, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { id: 14, slug: 'work-lunch', label: 'Work Lunch / Cost', sortOrder: 14, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { id: 15, slug: 'savings', label: 'Savings', sortOrder: 15, isPinned: false, excludeFromReports: false, reportGroup: 'moved' },
  { id: 16, slug: 'investments', label: 'Investments', sortOrder: 16, isPinned: false, excludeFromReports: false, reportGroup: 'moved' },
  { id: 17, slug: 'cash', label: 'Cash', sortOrder: 17, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { id: 18, slug: 'gifts-donations', label: 'Gifts / Donations', sortOrder: 18, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { id: 19, slug: 'income', label: 'Income', sortOrder: 19, isPinned: false, excludeFromReports: false, reportGroup: 'income' },
  { id: 20, slug: 'ignore', label: 'Ignore / Do Not Count', sortOrder: 20, isPinned: false, excludeFromReports: true, reportGroup: 'ignore' },
];

export const DEMO_VENDOR_TAGS = [{ slug: 'amazon', label: 'Amazon' }];

export const DEMO_TRANSACTIONS = [
  { id: 101, merchantName: 'Trader Joe\'s', amount: 47.82, date: '2026-07-05', pending: false },
  { id: 102, merchantName: 'Uber', amount: 18.4, date: '2026-07-05', pending: true },
  { id: 103, merchantName: 'Amazon', amount: 32.15, date: '2026-07-04', pending: false },
  { id: 104, merchantName: 'Sweetgreen', amount: 14.75, date: '2026-07-04', pending: false },
  { id: 105, merchantName: 'Target', amount: 61.03, date: '2026-07-03', pending: false },
];

/** Categorized sample rows for report drill-down in demo mode. */
export const DEMO_CATEGORIZED = [
  { id: 201, merchantName: 'Trader Joe\'s', amount: 47.82, date: '2026-07-05', pending: false, categoryId: 1 },
  { id: 202, merchantName: 'Whole Foods', amount: 86.4, date: '2026-07-02', pending: false, categoryId: 1 },
  { id: 203, merchantName: 'Costco', amount: 80.28, date: '2026-07-01', pending: false, categoryId: 1 },
  { id: 204, merchantName: 'Sweetgreen', amount: 14.75, date: '2026-07-04', pending: false, categoryId: 2 },
  { id: 205, merchantName: 'Chipotle', amount: 12.5, date: '2026-07-03', pending: false, categoryId: 2 },
  { id: 206, merchantName: 'Uber', amount: 18.4, date: '2026-07-05', pending: true, categoryId: 3 },
  { id: 207, merchantName: 'Sephora', amount: 68.0, date: '2026-07-01', pending: false, categoryId: 4 },
  { id: 208, merchantName: 'Amazon', amount: 42.0, date: '2026-07-06', pending: false, categoryId: 5, vendorTag: 'amazon' },
  { id: 209, merchantName: 'Impulse buy', amount: 156.04, date: '2026-07-06', pending: false, categoryId: 6 },
  { id: 210, merchantName: 'Movie tickets', amount: 45.0, date: '2026-07-02', pending: false, categoryId: 7 },
  { id: 211, merchantName: 'ConEd', amount: 80.0, date: '2026-07-01', pending: false, categoryId: 9 },
  { id: 212, merchantName: 'Cafe near office', amount: 14.0, date: '2026-07-03', pending: false, categoryId: 14 },
  { id: 213, merchantName: 'Transfer to savings', amount: 500.0, date: '2026-07-01', pending: false, categoryId: 15 },
  { id: 214, merchantName: '401k', amount: 200.0, date: '2026-07-01', pending: false, categoryId: 16 },
];
