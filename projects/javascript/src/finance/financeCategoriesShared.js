/**
 * Shared finance category seed (React-safe — must live under src/ for CRA builds).
 * Node re-exports this from server/finance-categories.js.
 */
const FINANCE_CATEGORIES = [
  // Pinned / frequent — groceries, restaurants, travel, utilities up top.
  { slug: 'groceries', label: '🛒 Groceries', color: '#c8e6c9', sortOrder: 1, isPinned: true, excludeFromReports: false, reportGroup: 'spending' },
  { slug: 'restaurants', label: '🍽️ Restaurants', color: '#ffcc80', sortOrder: 2, isPinned: true, excludeFromReports: false, reportGroup: 'spending' },
  { slug: 'travel-vacation', label: '✈️ Travel / Vacation', color: '#90caf9', sortOrder: 3, isPinned: true, excludeFromReports: false, reportGroup: 'spending' },
  { slug: 'utilities', label: '💡 Utilities', color: '#fff59d', sortOrder: 4, isPinned: true, excludeFromReports: false, reportGroup: 'spending' },

  // Middle — daily / lifestyle
  { slug: 'transportation', label: '🚗 Transportation', color: '#80deea', sortOrder: 5, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { slug: 'self-care', label: '💆 Self Care', color: '#f8bbd0', sortOrder: 6, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { slug: 'oops-splurge', label: '💅 Oops / Splurge', color: '#ff8a65', sortOrder: 7, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { slug: 'clothing', label: '👗 Clothing', color: '#ce93d8', sortOrder: 8, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { slug: 'home-goods', label: '🏠 Home Goods', color: '#bcaaa4', sortOrder: 9, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { slug: 'entertainment', label: '🎬 Entertainment', color: '#9fa8da', sortOrder: 10, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { slug: 'work-lunch', label: '🍱 Work Lunch / Cost', color: '#aed581', sortOrder: 11, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { slug: 'subscriptions', label: '🔁 Subscriptions', color: '#81d4fa', sortOrder: 12, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { slug: 'healthcare', label: '🩺 Healthcare', color: '#80cbc4', sortOrder: 13, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { slug: 'education-classes', label: '📚 Education / Classes', color: '#b39ddb', sortOrder: 14, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { slug: 'business', label: '💼 Business', color: '#90a4ae', sortOrder: 15, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { slug: 'income', label: '💵 Income', color: '#66bb6a', sortOrder: 16, isPinned: false, excludeFromReports: false, reportGroup: 'income' },

  // Bottom — big fixed / infrequent, then ignore for review
  { slug: 'rent', label: '🔑 Rent', color: '#ffd54f', sortOrder: 17, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  { slug: 'investments', label: '📈 Investments', color: '#4db6ac', sortOrder: 18, isPinned: false, excludeFromReports: false, reportGroup: 'moved' },
  { slug: 'gifts-donations', label: '🎁 Gifts / Donations', color: '#f48fb1', sortOrder: 19, isPinned: false, excludeFromReports: false, reportGroup: 'spending' },
  {
    slug: 'ignore',
    label: '🙈 Ignore / Do Not Count',
    color: '#bdbdbd',
    sortOrder: 20,
    isPinned: false,
    // Still excluded from spending totals, but shown in its own report section for review.
    excludeFromReports: true,
    reportGroup: 'ignore',
  },
];

/**
 * Vendor tags (e.g. Amazon) — not spend categories.
 * Flow: tap tag → pick real category (Home Goods, etc.). Reports can still total by vendor.
 */
const FINANCE_VENDOR_TAGS = [{ slug: 'amazon', label: '📦 Amazon', color: '#ffca28' }];

/** Slugs removed from the product; deleted from DB when unused / on seed sync. */
const FINANCE_CATEGORY_SLUGS_REMOVED = ['cash', 'savings'];

module.exports = {
  FINANCE_CATEGORIES,
  FINANCE_VENDOR_TAGS,
  FINANCE_CATEGORY_SLUGS_REMOVED,
};
