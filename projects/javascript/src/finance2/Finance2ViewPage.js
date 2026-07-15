import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { financeCreateCategory, financeFetchCategories } from '../finance/financeApi';
import { financeChipStyle } from '../finance/financeCategoryUi';
import {
  colorForCustomSlug,
  mergeFinanceCategoryLists,
  rememberCustomCategory,
  slugifyCategoryLabel,
} from './finance2CustomCategories';
import {
  FINANCE2_DEFAULT_WHEEL_SLUGS,
  FINANCE2_MAX_WHEEL_SLICES,
  loadWheelSlugs,
  partitionWheelCategories,
  saveWheelSlugs,
  wheelShortLabel,
} from './finance2WheelPrefs';

/**
 * Drag categories between the wheel slots and the bench (off-wheel).
 * Also create custom categories. Saved wheel prefs power the inbox swipe ring.
 */
function Finance2ViewPage() {
  const [categories, setCategories] = useState([]);
  const [vendorTags, setVendorTags] = useState([]);
  const [wheelSlugs, setWheelSlugs] = useState(() => loadWheelSlugs());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [dragging, setDragging] = useState(null);
  const [dropHighlight, setDropHighlight] = useState(null);
  const [newLabel, setNewLabel] = useState('');
  const [newGroup, setNewGroup] = useState('spending');
  const [creating, setCreating] = useState(false);

  const refreshCategories = useCallback(async () => {
    const data = await financeFetchCategories();
    setCategories(mergeFinanceCategoryLists(data.categories || []));
    setVendorTags(data.vendorTags || []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refreshCategories();
      } catch (err) {
        if (!cancelled) {
          // Still show the full product seed so the page is usable offline / on API blip.
          setCategories(mergeFinanceCategoryLists([]));
          setVendorTags([{ slug: 'amazon', label: '📦 Amazon', color: '#ffca28' }]);
          setError(err.message || 'Could not load categories');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshCategories]);

  // Same catalog as Inbox — includes vendor tags (Amazon) for wheel placement.
  const { bySlug, onWheelSlugs: activeWheel, bench } = useMemo(
    () => partitionWheelCategories(categories, wheelSlugs, vendorTags),
    [categories, wheelSlugs, vendorTags]
  );

  const persist = useCallback((next) => {
    const saved = saveWheelSlugs(next);
    setWheelSlugs(saved);
    setMessage('Saved');
    window.setTimeout(() => setMessage(''), 1200);
  }, []);

  const moveToWheel = (slug, atIndex) => {
    if (!bySlug[slug]) return;
    let next = activeWheel.filter((s) => s !== slug);
    if (next.length >= FINANCE2_MAX_WHEEL_SLICES && atIndex == null) {
      setError(`Wheel holds up to ${FINANCE2_MAX_WHEEL_SLICES} categories`);
      return;
    }
    setError('');
    if (atIndex == null || atIndex >= next.length) {
      if (next.length >= FINANCE2_MAX_WHEEL_SLICES) {
        setError(`Wheel holds up to ${FINANCE2_MAX_WHEEL_SLICES} categories`);
        return;
      }
      next = [...next, slug];
    } else {
      next.splice(Math.max(0, atIndex), 0, slug);
      if (next.length > FINANCE2_MAX_WHEEL_SLICES) {
        next = next.slice(0, FINANCE2_MAX_WHEEL_SLICES);
      }
    }
    persist(next);
  };

  const moveToBench = (slug) => {
    persist(activeWheel.filter((s) => s !== slug));
  };

  const reorderWheel = (fromIndex, toIndex) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    const next = [...activeWheel];
    const [item] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, item);
    persist(next);
  };

  const onDragStart = (payload) => (e) => {
    setDragging(payload);
    e.dataTransfer.setData('text/plain', payload.slug);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragEnd = () => {
    setDragging(null);
    setDropHighlight(null);
  };

  const onDropWheelSlot = (index) => (e) => {
    e.preventDefault();
    const slug = dragging?.slug || e.dataTransfer.getData('text/plain');
    if (!slug) return;
    if (dragging?.from === 'wheel' && typeof dragging.index === 'number') {
      reorderWheel(dragging.index, index);
    } else {
      let next = activeWheel.filter((s) => s !== slug);
      if (next.length >= FINANCE2_MAX_WHEEL_SLICES) {
        next[index] = slug;
      } else {
        next.splice(index, 0, slug);
        if (next.length > FINANCE2_MAX_WHEEL_SLICES) {
          next = next.slice(0, FINANCE2_MAX_WHEEL_SLICES);
        }
      }
      persist(next);
    }
    onDragEnd();
  };

  const onDropBench = (e) => {
    e.preventDefault();
    const slug = dragging?.slug || e.dataTransfer.getData('text/plain');
    if (!slug) return;
    moveToBench(slug);
    onDragEnd();
  };

  const allowDrop = (highlight) => (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropHighlight(highlight);
  };

  const onCreateCategory = async (e) => {
    e.preventDefault();
    const label = newLabel.trim();
    if (!label) {
      setError('Enter a category name');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const slug = slugifyCategoryLabel(label);
      const color = colorForCustomSlug(slug);
      const data = await financeCreateCategory({
        label,
        slug,
        reportGroup: newGroup,
        color,
      });
      const created = data.category || data;
      rememberCustomCategory({
        ...created,
        color: created.color || color,
        isCustom: true,
      });
      setNewLabel('');
      await refreshCategories();
      setMessage(`Added “${created.label || label}”`);
      window.setTimeout(() => setMessage(''), 1600);
    } catch (err) {
      setError(err.message || 'Could not create category');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <p className="finance-muted">Loading categories…</p>;
  }

  const displaySlots = Array.from({ length: FINANCE2_MAX_WHEEL_SLICES }, (_, i) => activeWheel[i] || null);

  return (
    <div className="finance2-view">
      <header className="finance2-view-head">
        <Link className="finance2-view-back" to="/finance2/settings">
          ← Settings
        </Link>
        <h2 className="finance-section-title">Wheel view</h2>
        <p className="finance-muted finance2-view-copy">
          Drag categories onto the wheel (up to {FINANCE2_MAX_WHEEL_SLICES}) or off to the bench.
          On-wheel categories appear as inbox swipe slices.
        </p>
        <p className="finance-muted finance2-view-count">
          {categories.length + vendorTags.length} items · {activeWheel.length} on wheel ·{' '}
          {bench.length} more
        </p>
        {message && <p className="finance-success">{message}</p>}
        {error && <p className="finance-error">{error}</p>}
      </header>

      <section className="finance2-view-section finance2-view-create">
        <h3 className="finance2-view-label">Add your own category</h3>
        <p className="finance-muted finance2-view-hint">
          New categories land on the bench — drag them onto the wheel anytime.
        </p>
        <form className="finance2-view-create-form" onSubmit={onCreateCategory}>
          <label className="finance2-view-create-field">
            <span className="finance2-view-create-caption">Name</span>
            <input
              type="text"
              className="finance2-view-create-input"
              value={newLabel}
              onChange={(ev) => setNewLabel(ev.target.value)}
              placeholder="e.g. Pet care"
              maxLength={96}
              autoComplete="off"
              enterKeyHint="done"
            />
          </label>
          <label className="finance2-view-create-field">
            <span className="finance2-view-create-caption">Counts as</span>
            <select
              className="finance2-view-create-select"
              value={newGroup}
              onChange={(ev) => setNewGroup(ev.target.value)}
            >
              <option value="spending">Spending</option>
              <option value="income">Income</option>
              <option value="moved">Moved money</option>
              <option value="ignore">Ignore / do not count</option>
            </select>
          </label>
          <button
            type="submit"
            className="finance-btn finance-btn--primary"
            disabled={creating || !newLabel.trim()}
          >
            {creating ? 'Adding…' : 'Add category'}
          </button>
        </form>
      </section>

      <section className="finance2-view-section">
        <h3 className="finance2-view-label">On the wheel</h3>
        <div
          className={`finance2-view-wheel-grid${
            dropHighlight === 'wheel' ? ' is-drop-target' : ''
          }`}
          onDragOver={allowDrop('wheel')}
          onDragLeave={() => setDropHighlight(null)}
        >
          {displaySlots.map((slug, index) => {
            const cat = slug ? bySlug[slug] : null;
            return (
              <div
                key={`slot-${index}`}
                className={`finance2-view-slot${slug ? '' : ' is-empty'}${
                  dropHighlight === `slot-${index}` ? ' is-drop-target' : ''
                }`}
                onDragOver={allowDrop(`slot-${index}`)}
                onDrop={onDropWheelSlot(index)}
              >
                <span className="finance2-view-slot-index">{index + 1}</span>
                {cat ? (
                  <button
                    type="button"
                    className={`finance2-view-chip${cat.isVendor ? ' is-vendor' : ''}`}
                    style={financeChipStyle(cat.slug, cat)}
                    draggable
                    onDragStart={onDragStart({ slug: cat.slug, from: 'wheel', index })}
                    onDragEnd={onDragEnd}
                    title="Drag to reorder or move to additional categories"
                  >
                    <span className="finance2-view-chip-short">
                      {wheelShortLabel(cat.slug, cat)}
                    </span>
                    <span className="finance2-view-chip-full">{cat.label}</span>
                  </button>
                ) : (
                  <span className="finance2-view-slot-empty">Drop here</span>
                )}
              </div>
            );
          })}
        </div>
        <p className="finance-muted finance2-view-hint">
          Slot 1 is top of the ring; then clockwise.
        </p>
      </section>

      <section
        className={`finance2-view-section finance2-view-bench${
          dropHighlight === 'bench' ? ' is-drop-target' : ''
        }`}
        onDragOver={allowDrop('bench')}
        onDrop={onDropBench}
        onDragLeave={() => setDropHighlight(null)}
      >
        <h3 className="finance2-view-label">Additional categories ({bench.length})</h3>
        <p className="finance-muted finance2-view-hint">
          Shown under More categories in the inbox — including vendor tags like Amazon.
        </p>
        <div className="finance2-view-bench-grid">
          {bench.length === 0 ? (
            <p className="finance-muted">Everything is on the wheel.</p>
          ) : (
            bench.map((cat) => (
              <button
                key={cat.slug}
                type="button"
                className={`finance2-view-chip${cat.isCustom ? ' is-custom' : ''}${
                  cat.isVendor ? ' is-vendor' : ''
                }`}
                style={financeChipStyle(cat.slug, cat)}
                draggable
                onDragStart={onDragStart({ slug: cat.slug, from: 'bench' })}
                onDragEnd={onDragEnd}
                onDoubleClick={() => moveToWheel(cat.slug)}
                title="Drag onto a wheel slot · double-tap to add"
              >
                <span className="finance2-view-chip-short">
                  {wheelShortLabel(cat.slug, cat)}
                  {cat.isVendor ? ' · tag' : cat.isCustom ? ' ·' : ''}
                </span>
                <span className="finance2-view-chip-full">{cat.label}</span>
              </button>
            ))
          )}
        </div>
      </section>

      <div className="finance2-view-actions">
        <button
          type="button"
          className="finance-btn finance-btn--ghost"
          onClick={() => {
            persist([]);
          }}
        >
          Clear wheel
        </button>
        <button
          type="button"
          className="finance-btn finance-btn--secondary"
          onClick={() => {
            setError('');
            persist([...FINANCE2_DEFAULT_WHEEL_SLUGS]);
          }}
        >
          Reset defaults
        </button>
        <Link className="finance-btn finance-btn--primary" to="/finance2/inbox">
          Done
        </Link>
      </div>
    </div>
  );
}

export default Finance2ViewPage;
