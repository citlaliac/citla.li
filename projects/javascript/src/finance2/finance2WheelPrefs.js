/**
 * Persist which category slugs sit on the finance2 swipe wheel.
 * Inbox and Settings → View must use the same helpers so lists always match.
 */

export const FINANCE2_WHEEL_STORAGE_KEY = 'finance2_wheel_slugs_v1';
/** Same-tab signal when wheel prefs change (storage events only fire cross-tab). */
export const FINANCE2_WHEEL_CHANGED_EVENT = 'finance2-wheel-changed';

/** Default on-wheel set (matches the original draft). */
export const FINANCE2_DEFAULT_WHEEL_SLUGS = [
  'utilities',
  'groceries',
  'entertainment',
  'subscriptions',
  'oops-splurge',
  'restaurants',
  'home-goods',
  'rent',
];

export const FINANCE2_MAX_WHEEL_SLICES = 8;

/** Short labels for the wheel ring. */
export const FINANCE2_WHEEL_SHORT_LABEL = {
  utilities: 'Utilities',
  groceries: 'Grocery',
  entertainment: 'Entertain.',
  subscriptions: 'Subs',
  'oops-splurge': 'Oops',
  restaurants: 'Restaurants',
  'home-goods': 'House',
  rent: 'Rent',
  transportation: 'Transit',
  'self-care': 'Self care',
  clothing: 'Clothes',
  'work-lunch': 'Work',
  healthcare: 'Health',
  'education-classes': 'Classes',
  business: 'Business',
  income: 'Income',
  investments: 'Invest',
  'gifts-donations': 'Gifts',
  ignore: 'Ignore',
  'travel-vacation': 'Travel',
  amazon: 'Amazon',
};

/** Soft pastel rainbow around the ring. */
export const FINANCE2_WHEEL_RAINBOW = [
  '#ff8fab',
  '#ffb347',
  '#ffe066',
  '#8fd9a8',
  '#7ec8e3',
  '#a78bfa',
  '#e879f9',
  '#fb7185',
];

/**
 * Read saved wheel order from localStorage.
 * Missing key → product defaults. Explicit [] → empty wheel (all on bench).
 */
export function loadWheelSlugs() {
  try {
    const raw = localStorage.getItem(FINANCE2_WHEEL_STORAGE_KEY);
    if (raw == null) return [...FINANCE2_DEFAULT_WHEEL_SLUGS];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...FINANCE2_DEFAULT_WHEEL_SLUGS];
    const cleaned = [];
    for (const slug of parsed) {
      if (typeof slug !== 'string' || !slug || cleaned.includes(slug)) continue;
      cleaned.push(slug);
      if (cleaned.length >= FINANCE2_MAX_WHEEL_SLICES) break;
    }
    // Empty array is intentional (Clear wheel) — do not revive defaults here.
    return cleaned;
  } catch {
    return [...FINANCE2_DEFAULT_WHEEL_SLUGS];
  }
}

export function saveWheelSlugs(slugs) {
  const cleaned = [];
  for (const slug of slugs || []) {
    if (typeof slug !== 'string' || !slug || cleaned.includes(slug)) continue;
    cleaned.push(slug);
    if (cleaned.length >= FINANCE2_MAX_WHEEL_SLICES) break;
  }
  try {
    localStorage.setItem(FINANCE2_WHEEL_STORAGE_KEY, JSON.stringify(cleaned));
  } catch {
    /* ignore quota */
  }
  try {
    window.dispatchEvent(
      new CustomEvent(FINANCE2_WHEEL_CHANGED_EVENT, { detail: cleaned })
    );
  } catch {
    /* ignore SSR / old browsers */
  }
  return cleaned;
}

/**
 * Categories + vendor tags as one placable catalog (View wheel / bench).
 * Vendors (e.g. Amazon) can sit on the ring or under Additional categories.
 */
export function buildWheelCatalog(categories = [], vendorTags = []) {
  const cats = (categories || []).map((c) => ({
    ...c,
    kind: 'category',
    isVendor: false,
  }));
  const vendors = (vendorTags || []).map((t) => ({
    slug: t.slug,
    label: t.label,
    color: t.color,
    sortOrder: -1,
    isPinned: false,
    kind: 'vendor',
    isVendor: true,
  }));
  // Vendors first on the bench by default so they’re easy to find in View.
  return [...vendors, ...cats];
}

/**
 * Single source of truth: wheel slots + bench for View and Inbox.
 * Catalog may include vendor tags (Amazon). Empty wheel stays empty.
 */
export function partitionWheelCategories(categories, wheelSlugs, vendorTags = []) {
  const list = buildWheelCatalog(categories, vendorTags);
  const bySlug = Object.fromEntries(list.map((c) => [c.slug, c]));
  const onWheelSlugs = (wheelSlugs || [])
    .filter((s) => bySlug[s])
    .slice(0, FINANCE2_MAX_WHEEL_SLICES);
  const onWheelSet = new Set(onWheelSlugs);
  const onWheel = onWheelSlugs.map((slug) => bySlug[slug]);
  const bench = list.filter((c) => !onWheelSet.has(c.slug));
  const benchCategories = bench.filter((c) => !c.isVendor);
  const benchVendors = bench.filter((c) => c.isVendor);
  return {
    bySlug,
    onWheelSlugs,
    onWheel,
    bench,
    benchCategories,
    benchVendors,
  };
}

/** Prefer short map; else strip emoji / slash noise from category.label. */
export function wheelShortLabel(slug, category) {
  if (FINANCE2_WHEEL_SHORT_LABEL[slug]) return FINANCE2_WHEEL_SHORT_LABEL[slug];
  const raw = String(category?.label || slug);
  const text = raw.replace(/^[^\p{L}\p{N}]+/u, '').split(/[\\/]/)[0].trim();
  if (text.length <= 10) return text || slug;
  return `${text.slice(0, 9)}.`;
}
