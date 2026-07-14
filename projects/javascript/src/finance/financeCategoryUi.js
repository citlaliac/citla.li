/**
 * Client-side styles for category / vendor chips.
 * Colors live on the shared seed so inbox + report stay consistent without a DB color column.
 */
import {
  FINANCE_CATEGORIES,
  FINANCE_VENDOR_TAGS,
} from '../../server/finance-categories';

const COLOR_BY_SLUG = {
  ...Object.fromEntries(FINANCE_CATEGORIES.map((c) => [c.slug, c.color])),
  ...Object.fromEntries(FINANCE_VENDOR_TAGS.map((t) => [t.slug, t.color])),
};

/** Inline style for a colored category or vendor button. */
export function financeChipStyle(slug) {
  const backgroundColor = COLOR_BY_SLUG[slug] || '#efe9df';
  return { backgroundColor };
}
