/**
 * Custom categories for finance2 (View settings + inbox).
 * Colors live client-side; ids come from the API (or demo store).
 */

import { FINANCE_CATEGORIES } from '../finance/financeCategoriesShared';

export const FINANCE2_CUSTOM_CATS_KEY = 'finance2_custom_categories_v1';

/** Soft pastel palette for user-made categories. */
const CUSTOM_PALETTE = [
  '#f8bbd0',
  '#ffcc80',
  '#fff59d',
  '#c8e6c9',
  '#80deea',
  '#90caf9',
  '#b39ddb',
  '#ce93d8',
  '#ffab91',
  '#a5d6a7',
];

/** Turn a display name into a URL-safe slug (unique suffix added by callers if needed). */
export function slugifyCategoryLabel(label) {
  const base = String(label || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return base || 'custom';
}

/** Deterministic pastel from slug so the same custom cat keeps its color. */
export function colorForCustomSlug(slug) {
  let hash = 0;
  const s = String(slug || '');
  for (let i = 0; i < s.length; i += 1) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }
  return CUSTOM_PALETTE[hash % CUSTOM_PALETTE.length];
}

/** Load custom category metadata (colors / labels) from localStorage. */
export function loadCustomCategoryMeta() {
  try {
    const raw = localStorage.getItem(FINANCE2_CUSTOM_CATS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((c) => c && typeof c.slug === 'string' && c.slug);
  } catch {
    return [];
  }
}

/** Persist custom category metadata (merge by slug). */
export function saveCustomCategoryMeta(list) {
  const bySlug = new Map();
  for (const c of list || []) {
    if (!c?.slug) continue;
    bySlug.set(c.slug, {
      slug: c.slug,
      label: c.label,
      color: c.color || colorForCustomSlug(c.slug),
      reportGroup: c.reportGroup || 'spending',
      id: c.id != null ? c.id : undefined,
    });
  }
  const cleaned = [...bySlug.values()];
  try {
    localStorage.setItem(FINANCE2_CUSTOM_CATS_KEY, JSON.stringify(cleaned));
  } catch {
    /* ignore quota */
  }
  return cleaned;
}

/** Remember one custom category after create. */
export function rememberCustomCategory(cat) {
  if (!cat?.slug) return loadCustomCategoryMeta();
  const prev = loadCustomCategoryMeta().filter((c) => c.slug !== cat.slug);
  return saveCustomCategoryMeta([
    ...prev,
    {
      ...cat,
      color: cat.color || colorForCustomSlug(cat.slug),
      reportGroup: cat.reportGroup || 'spending',
    },
  ]);
}

/**
 * Merge API rows + seed + local customs so the View page never silently drops
 * known categories (stale DB / partial responses).
 */
export function mergeFinanceCategoryLists(apiCategories = []) {
  const map = new Map();

  // 1) Seed — always present so nothing from the product list is missing.
  for (const c of FINANCE_CATEGORIES) {
    map.set(c.slug, {
      slug: c.slug,
      label: c.label,
      sortOrder: c.sortOrder,
      isPinned: !!c.isPinned,
      excludeFromReports: !!c.excludeFromReports,
      reportGroup: c.reportGroup || 'spending',
      color: c.color,
      isCustom: false,
    });
  }

  // 2) API wins on id / labels / flags when present.
  const seedSlugs = new Set(FINANCE_CATEGORIES.map((c) => c.slug));
  for (const c of apiCategories || []) {
    if (!c?.slug || c.slug === 'amazon') continue;
    const prev = map.get(c.slug) || {};
    const isCustom = !!prev.isCustom || !!c.isCustom || !seedSlugs.has(c.slug);
    map.set(c.slug, {
      ...prev,
      ...c,
      color: c.color || prev.color || (isCustom ? colorForCustomSlug(c.slug) : undefined),
      isCustom,
    });
  }

  // 3) Local customs (and their colors) fill gaps / decorate customs.
  for (const c of loadCustomCategoryMeta()) {
    const prev = map.get(c.slug);
    if (prev && !prev.isCustom && FINANCE_CATEGORIES.some((s) => s.slug === c.slug)) {
      // Don't override seed/API built-ins with stale local meta.
      continue;
    }
    map.set(c.slug, {
      sortOrder: 200,
      isPinned: false,
      excludeFromReports: false,
      reportGroup: 'spending',
      ...prev,
      ...c,
      color: c.color || prev?.color || colorForCustomSlug(c.slug),
      isCustom: true,
    });
  }

  return [...map.values()].sort((a, b) => {
    const so = (a.sortOrder ?? 999) - (b.sortOrder ?? 999);
    if (so !== 0) return so;
    return String(a.label || '').localeCompare(String(b.label || ''));
  });
}
