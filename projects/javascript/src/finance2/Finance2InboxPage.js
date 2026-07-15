import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  financeCategorizeTransaction,
  financeFetchCategories,
  financeFetchTransactions,
  financeFlipTransactionAmount,
  financeSync,
  financeUncategorizeTransaction,
} from '../finance/financeApi';
import Finance2CategoryPicker from './Finance2CategoryPicker';
import Finance2SwipeWheel from './Finance2SwipeWheel';
import { mergeFinanceCategoryLists } from './finance2CustomCategories';
import {
  FINANCE2_WHEEL_CHANGED_EVENT,
  buildWheelCatalog,
  loadWheelSlugs,
  partitionWheelCategories,
} from './finance2WheelPrefs';

/**
 * Finance2 inbox — swipe-wheel categorization playground.
 * Wheel + “More” lists use the same partition helper as Settings → View.
 */
function Finance2InboxPage() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendorTags, setVendorTags] = useState([]);
  const [pendingVendorTag, setPendingVendorTag] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [undoStack, setUndoStack] = useState([]);
  const [wheelSlugs, setWheelSlugs] = useState(() => loadWheelSlugs());

  // Keep wheel prefs in sync with Settings → View (same tab + remount).
  useEffect(() => {
    const syncPrefs = () => setWheelSlugs(loadWheelSlugs());
    syncPrefs();
    window.addEventListener('focus', syncPrefs);
    window.addEventListener(FINANCE2_WHEEL_CHANGED_EVENT, syncPrefs);
    return () => {
      window.removeEventListener('focus', syncPrefs);
      window.removeEventListener(FINANCE2_WHEEL_CHANGED_EVENT, syncPrefs);
    };
  }, []);

  const load = useCallback(async () => {
    setError('');
    try {
      const [catRes, txnRes] = await Promise.all([
        financeFetchCategories(),
        financeFetchTransactions('uncategorized'),
      ]);
      // Same merge as Settings → View so catalogues match 1:1.
      setCategories(mergeFinanceCategoryLists(catRes.categories || []));
      setVendorTags(catRes.vendorTags || []);
      setTransactions(txnRes.transactions || []);
      setWheelSlugs(loadWheelSlugs());
    } catch (err) {
      setError(err.message || 'Could not load inbox');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setSyncing(true);
      try {
        await financeSync();
      } catch {
        /* sync may fail if Plaid not configured yet */
      } finally {
        if (!cancelled) setSyncing(false);
      }
      if (!cancelled) await load();
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const activeTxn = transactions[0];
  const pendingVendorLabel =
    vendorTags.find((t) => t.slug === pendingVendorTag)?.label || pendingVendorTag;

  // Identical split to Settings → View (categories + Amazon / vendors).
  const { onWheelSlugs, benchCategories, benchVendors } = useMemo(
    () => partitionWheelCategories(categories, wheelSlugs, vendorTags),
    [categories, wheelSlugs, vendorTags]
  );
  const wheelCatalog = useMemo(
    () => buildWheelCatalog(categories, vendorTags),
    [categories, vendorTags]
  );

  const pickCategory = async (categoryId, { vendorTag } = {}) => {
    if (!activeTxn || busyId) return;
    const tag = vendorTag !== undefined ? vendorTag : pendingVendorTag || '';
    const snapshot = { ...activeTxn, vendorTag: tag || activeTxn.vendorTag || null };
    setBusyId(activeTxn.id);
    setError('');
    try {
      await financeCategorizeTransaction(activeTxn.id, categoryId, {
        vendorTag: tag || '',
      });
      setTransactions((prev) => prev.filter((t) => t.id !== activeTxn.id));
      setUndoStack((prev) => [...prev, snapshot]);
      setPendingVendorTag(null);
      setShowAllCategories(false);
    } catch (err) {
      setError(err.message || 'Could not save category');
      throw err;
    } finally {
      setBusyId(null);
    }
  };

  const handleUndo = async () => {
    if (!undoStack.length || busyId) return;
    const last = undoStack[undoStack.length - 1];
    setBusyId(last.id);
    setError('');
    try {
      await financeUncategorizeTransaction(last.id);
      setUndoStack((prev) => prev.slice(0, -1));
      setTransactions((prev) => [last, ...prev.filter((t) => t.id !== last.id)]);
      setPendingVendorTag(null);
    } catch (err) {
      setError(err.message || 'Could not undo');
    } finally {
      setBusyId(null);
    }
  };

  const startVendorTag = (slug) => {
    setPendingVendorTag(slug);
    setShowAllCategories(true);
  };

  const clearVendorTag = () => setPendingVendorTag(null);

  const flipAmount = async () => {
    if (!activeTxn || busyId) return;
    setBusyId(activeTxn.id);
    setError('');
    try {
      const data = await financeFlipTransactionAmount(activeTxn.id);
      const nextAmount =
        data.transaction?.amount != null ? data.transaction.amount : -Number(activeTxn.amount);
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === activeTxn.id ? { ...t, amount: nextAmount, amountManual: true } : t
        )
      );
    } catch (err) {
      setError(err.message || 'Could not flip amount');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <p className="finance-muted">{syncing ? 'Syncing accounts…' : 'Loading…'}</p>;
  }

  return (
    <div className="finance-inbox finance2-inbox">
      <header className="finance-inbox-head">
        <h2 className="finance-section-title">
          Inbox
          {transactions.length > 0 && (
            <span className="finance-badge">{transactions.length}</span>
          )}
        </h2>
        <button
          type="button"
          className="finance-btn finance-btn--ghost"
          onClick={async () => {
            setSyncing(true);
            try {
              await financeSync();
              await load();
            } catch (err) {
              setError(err.message || 'Sync failed');
            } finally {
              setSyncing(false);
            }
          }}
          disabled={syncing}
        >
          {syncing ? 'Syncing…' : 'Sync'}
        </button>
      </header>

      {error && <p className="finance-error">{error}</p>}

      {transactions.length === 0 ? (
        <div className="finance-empty">
          <p>All caught up.</p>
          {undoStack.length > 0 && (
            <button type="button" className="finance-btn finance-btn--ghost" onClick={handleUndo}>
              Undo last
            </button>
          )}
          <Link className="finance-link" to="/finance2/report">
            View monthly report
          </Link>
        </div>
      ) : (
        <>
          <Finance2SwipeWheel
            transaction={activeTxn}
            categories={wheelCatalog}
            wheelSlugs={onWheelSlugs}
            disabled={busyId === activeTxn.id}
            onAssign={pickCategory}
            onPickVendor={startVendorTag}
            onFlipAmount={flipAmount}
            onUndo={handleUndo}
            onOpenAll={(forceOpen) =>
              setShowAllCategories((v) => (forceOpen === true ? true : !v))
            }
            canUndo={undoStack.length > 0}
            allOpen={showAllCategories}
          />

          {pendingVendorTag && (
            <div className="finance-vendor-banner">
              <span>
                Tagged <strong>{pendingVendorLabel}</strong> — now pick what it was
              </span>
              <button type="button" className="finance-vendor-clear" onClick={clearVendorTag}>
                Clear
              </button>
            </div>
          )}

          {showAllCategories && (
            <div className="finance2-all-sheet" role="dialog" aria-label="More categories">
              <button
                type="button"
                className="finance2-all-sheet-backdrop"
                aria-label="Close categories"
                onClick={() => setShowAllCategories(false)}
              />
              <div className="finance2-all-sheet-panel">
                <div className="finance2-all-sheet-grab" aria-hidden />
                <header className="finance2-all-sheet-head">
                  <h3 className="finance2-all-sheet-title">More categories</h3>
                  <button
                    type="button"
                    className="finance2-all-cats-close"
                    onClick={() => setShowAllCategories(false)}
                  >
                    Close
                  </button>
                </header>
                {benchCategories.length === 0 && benchVendors.length === 0 ? (
                  <p className="finance-muted">
                    Everything is already on the wheel. Move some off in Settings → View.
                  </p>
                ) : (
                  <Finance2CategoryPicker
                    categories={benchCategories}
                    vendorTags={benchVendors}
                    pendingVendorTag={pendingVendorTag}
                    disabled={busyId === activeTxn.id}
                    onPickCategory={pickCategory}
                    onPickVendorTag={startVendorTag}
                    layout="bench"
                  />
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Finance2InboxPage;
