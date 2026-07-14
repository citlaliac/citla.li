/** Shared category definitions for finance module (Node seed + reference for PHP). */
const FINANCE_CATEGORIES = [
  { slug: 'groceries', label: 'Groceries', sortOrder: 1, isPinned: true, excludeFromReports: false, reportGroup: 'spending' },
  { slug: 'restaurants', label: 'Restaurants', sortOrder: 2, isPinned: true, excludeFromReports: false, reportGroup: 'spending' },
  { slug: 'transportation', label: 'Transportation', sortOrder: 3, isPinned: true, excludeFromReports: false, reportGroup: 'spending' },
  { slug: 'self-care', label: 'Self Care', sortOrder: 4, isPinned: true, excludeFromReports: false, reportGroup: 'spending' },
  { slug: 'amazon', label: 'Amazon', sortOrder: 5, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { slug: 'home-goods', label: 'Home Goods', sortOrder: 6, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { slug: 'oops-splurge', label: 'Oops / Splurge', sortOrder: 7, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { slug: 'entertainment', label: 'Entertainment', sortOrder: 8, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { slug: 'clothing', label: 'Clothing', sortOrder: 9, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { slug: 'utilities', label: 'Utilities', sortOrder: 10, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { slug: 'rent', label: 'Rent', sortOrder: 11, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { slug: 'healthcare', label: 'Healthcare', sortOrder: 12, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { slug: 'travel-vacation', label: 'Travel / Vacation', sortOrder: 13, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { slug: 'education-classes', label: 'Education / Classes', sortOrder: 14, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { slug: 'savings', label: 'Savings', sortOrder: 15, isPinned: false, excludeFromReports: false, reportGroup: 'moved' },
  { slug: 'investments', label: 'Investments', sortOrder: 16, isPinned: false, excludeFromReports: false, reportGroup: 'moved' },
  { slug: 'cash', label: 'Cash', sortOrder: 17, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { slug: 'gifts-donations', label: 'Gifts / Donations', sortOrder: 18, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { slug: 'income', label: 'Income', sortOrder: 19, isPinned: false, excludeFromReports: false, reportGroup: 'income' },
  {
    slug: 'ignore',
    label: 'Ignore / Do Not Count',
    sortOrder: 20,
    isPinned: false,
    excludeFromReports: true,
    reportGroup: 'ignore',
  },
];

module.exports = { FINANCE_CATEGORIES };
