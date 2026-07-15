import React from 'react';
import { financeChipStyle } from '../finance/financeCategoryUi';

/**
 * Category grid + vendor tags (Amazon).
 * layout="bench" — keep caller order (matches Settings → View off-wheel list).
 * layout="default" — pinned row first, then vendors, then the rest.
 */
function FinanceCategoryPicker({
  categories,
  vendorTags = [],
  pendingVendorTag = null,
  disabled = false,
  onPickCategory,
  onPickVendorTag,
  layout = 'default',
}) {
  const pinned = categories.filter((c) => c.isPinned);
  const rest = categories.filter((c) => !c.isPinned);
  const ordered = layout === 'bench' ? categories : [...pinned, ...rest];

  const renderCat = (cat) => (
    <button
      key={cat.id ?? cat.slug}
      type="button"
      className={`finance-cat-btn${cat.slug === 'oops-splurge' ? ' finance-cat-btn--oops' : ''}`}
      style={financeChipStyle(cat.slug, cat)}
      disabled={disabled || cat.id == null}
      onClick={() => onPickCategory(cat.id)}
    >
      {cat.label}
    </button>
  );

  const renderVendors = () =>
    vendorTags.map((tag) => (
      <button
        key={tag.slug}
        type="button"
        className={`finance-cat-btn finance-cat-btn--vendor${
          pendingVendorTag === tag.slug ? ' is-active' : ''
        }`}
        style={financeChipStyle(tag.slug)}
        disabled={disabled}
        onClick={() => onPickVendorTag(tag.slug)}
      >
        {tag.label}
      </button>
    ));

  return (
    <div className="finance-category-grid">
      {layout === 'bench' ? (
        <>
          {/* Vendors first so Amazon stays easy to hit, then the View bench order. */}
          {renderVendors()}
          {ordered.map(renderCat)}
        </>
      ) : (
        <>
          {pinned.map(renderCat)}
          {renderVendors()}
          {rest.map(renderCat)}
        </>
      )}
    </div>
  );
}

export default FinanceCategoryPicker;
