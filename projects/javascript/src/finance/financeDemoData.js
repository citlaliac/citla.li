/** Local UI preview — mock inbox data when REACT_APP_FINANCE_DEMO=true */

export const DEMO_CATEGORIES = [
  { id: 1, slug: 'groceries', label: 'Groceries', sortOrder: 1, isPinned: true, excludeFromReports: false, reportGroup: 'spending' },
  { id: 2, slug: 'restaurants', label: 'Restaurants', sortOrder: 2, isPinned: true, excludeFromReports: false, reportGroup: 'spending' },
  { id: 3, slug: 'transportation', label: 'Transportation', sortOrder: 3, isPinned: true, excludeFromReports: false, reportGroup: 'spending' },
  { id: 4, slug: 'self-care', label: 'Self Care', sortOrder: 4, isPinned: true, excludeFromReports: false, reportGroup: 'spending' },
  { id: 5, slug: 'amazon', label: 'Amazon', sortOrder: 5, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { id: 6, slug: 'home-goods', label: 'Home Goods', sortOrder: 6, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { id: 7, slug: 'oops-splurge', label: 'Oops / Splurge', sortOrder: 7, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { id: 8, slug: 'entertainment', label: 'Entertainment', sortOrder: 8, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { id: 9, slug: 'clothing', label: 'Clothing', sortOrder: 9, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { id: 10, slug: 'utilities', label: 'Utilities', sortOrder: 10, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { id: 11, slug: 'rent', label: 'Rent', sortOrder: 11, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { id: 12, slug: 'healthcare', label: 'Healthcare', sortOrder: 12, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { id: 13, slug: 'travel-vacation', label: 'Travel / Vacation', sortOrder: 13, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { id: 14, slug: 'education-classes', label: 'Education / Classes', sortOrder: 14, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { id: 15, slug: 'savings', label: 'Savings', sortOrder: 15, isPinned: false, excludeFromReports: false, reportGroup: 'moved' },
  { id: 16, slug: 'investments', label: 'Investments', sortOrder: 16, isPinned: false, excludeFromReports: false, reportGroup: 'moved' },
  { id: 17, slug: 'cash', label: 'Cash', sortOrder: 17, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { id: 18, slug: 'ignore', label: 'Ignore / Do Not Count', sortOrder: 18, isPinned: false, excludeFromReports: true, reportGroup: 'ignore' },
];

export const DEMO_TRANSACTIONS = [
  { id: 101, merchantName: 'Trader Joe\'s', amount: 47.82, date: '2026-07-05', pending: false },
  { id: 102, merchantName: 'Uber', amount: 18.4, date: '2026-07-05', pending: true },
  { id: 103, merchantName: 'Amazon', amount: 32.15, date: '2026-07-04', pending: false },
  { id: 104, merchantName: 'Sweetgreen', amount: 14.75, date: '2026-07-04', pending: false },
  { id: 105, merchantName: 'Target', amount: 61.03, date: '2026-07-03', pending: false },
];

export const DEMO_REPORT = {
  spendingTotal: 842.19,
  spending: [
    { categoryId: 1, label: 'Groceries', total: 214.5 },
    { categoryId: 2, label: 'Restaurants', total: 186.25 },
    { categoryId: 3, label: 'Transportation', total: 92.4 },
    { categoryId: 4, label: 'Self Care', total: 68.0 },
    { categoryId: 7, label: 'Oops / Splurge', total: 156.04 },
    { categoryId: 8, label: 'Entertainment', total: 45.0 },
    { categoryId: 10, label: 'Utilities', total: 80.0 },
  ],
  moved: [
    { categoryId: 15, label: 'Savings', total: 500.0 },
    { categoryId: 16, label: 'Investments', total: 200.0 },
  ],
};
