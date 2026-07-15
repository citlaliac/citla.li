import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatMoney } from '../finance/financeConfig';
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

/**
 * Finance2 inbox — swipe-wheel categorization playground.
 * Live /finance inbox stays on the grid picker.
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
  // Stack of recently assigned txns for undo (client + server uncategorize).
  const [undoStack, setUndoStack] = useState([]);

  const load = useCallback(async () => {
    setError('');
    try {
      const [catRes, txnRes] = await Promise.all([
        financeFetchCategories(),
        financeFetchTransactions('uncategorized'),
      ]);
      setCategories(catRes.categories || []);
      setVendorTags(catRes.vendorTags || []);
      setTransactions(txnRes.transactions || []);
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
            categories={categories}
            disabled={busyId === activeTxn.id}
            onAssign={pickCategory}
            onFlipAmount={flipAmount}
            onUndo={handleUndo}
            canUndo={undoStack.length > 0}
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

          <button
            type="button"
            className="finance2-all-cats-btn"
            onClick={() => setShowAllCategories((v) => !v)}
          >
            {showAllCategories ? 'Hide all categories' : 'All categories'}
          </button>

          {showAllCategories && (
            <div className="finance2-all-cats-panel">
              <Finance2CategoryPicker
                categories={categories}
                vendorTags={vendorTags}
                pendingVendorTag={pendingVendorTag}
                disabled={busyId === activeTxn.id}
                onPickCategory={pickCategory}
                onPickVendorTag={startVendorTag}
              />
            </div>
          )}

          {transactions.length > 1 && (
            <ul className="finance-queue finance2-queue">
              {transactions.slice(1, 6).map((t) => (
                <li key={t.id}>
                  <div className="finance-queue-item finance-queue-item--static">
                    <span>{t.merchantName}</span>
                    <span>{formatMoney(t.amount)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

export default Finance2InboxPage;
