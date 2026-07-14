import React from 'react';
import { financeChipStyle } from './financeCategoryUi';

/**
 * Full category grid + vendor tags (Amazon), always expanded.
 * Vendor tags use the same chip size as categories; tap tag then pick a spend category.
 * Amazon sits just after the pinned row so it's easy to hit.
 */
function FinanceCategoryPicker({
  categories,
  vendorTags = [],
  pendingVendorTag = null,
  disabled = false,
  onPickCategory,
  onPickVendorTag,
}) {
  const pinned = categories.filter((c) => c.isPinned);
  const rest = categories.filter((c) => !c.isPinned);

  const renderCat = (cat) => (
    <button
      key={cat.id}
      type="button"
      className={`finance-cat-btn${cat.slug === 'oops-splurge' ? ' finance-cat-btn--oops' : ''}`}
      style={financeChipStyle(cat.slug)}
      disabled={disabled}
      onClick={() => onPickCategory(cat.id)}
    >
      {cat.label}
    </button>
  );

  return (
    <div className="finance-category-grid">
      {pinned.map(renderCat)}

      {vendorTags.map((tag) => (
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
      ))}

      {rest.map(renderCat)}
    </div>
  );
}

export default FinanceCategoryPicker;
