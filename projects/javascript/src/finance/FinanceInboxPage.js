import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatMoney } from './financeConfig';
import {
  financeCategorizeTransaction,
  financeFetchCategories,
  financeFetchTransactions,
  financeFlipTransactionAmount,
  financeSync,
} from './financeApi';
import FinanceCategoryPicker from './FinanceCategoryPicker';

function FinanceInboxPage() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendorTags, setVendorTags] = useState([]);
  const [pendingVendorTag, setPendingVendorTag] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [busyId, setBusyId] = useState(null);

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
      setActiveId((txnRes.transactions || [])[0]?.id ?? null);
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

  const activeTxn = transactions.find((t) => t.id === activeId) || transactions[0];
  const pendingVendorLabel =
    vendorTags.find((t) => t.slug === pendingVendorTag)?.label || pendingVendorTag;

  const pickCategory = async (categoryId) => {
    if (!activeTxn || busyId) return;
    setBusyId(activeTxn.id);
    setError('');
    try {
      await financeCategorizeTransaction(activeTxn.id, categoryId, {
        vendorTag: pendingVendorTag || '',
      });
      const next = transactions.filter((t) => t.id !== activeTxn.id);
      setTransactions(next);
      setActiveId(next[0]?.id ?? null);
      setPendingVendorTag(null);
    } catch (err) {
      setError(err.message || 'Could not save category');
    } finally {
      setBusyId(null);
    }
  };

  // Amazon (and future stores): pick tag first, then a real spend category.
  const startVendorTag = (slug) => {
    setPendingVendorTag(slug);
  };

  const clearVendorTag = () => setPendingVendorTag(null);

  // Tap amount to flip +/− (Venmo self-transfers often come in with the wrong sign).
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
    <div className="finance-inbox">
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
          <Link className="finance-link" to="/finance/report">
            View monthly report
          </Link>
        </div>
      ) : (
        <>
          <div className="finance-charge-card">
            <p className="finance-charge-merchant">{activeTxn.merchantName}</p>
            <button
              type="button"
              className="finance-charge-amount finance-charge-amount--btn"
              onClick={flipAmount}
              disabled={busyId === activeTxn.id}
              title="Tap to flip + / −"
              aria-label="Flip amount sign"
            >
              {formatMoney(activeTxn.amount)}
            </button>
            <p className="finance-charge-hint">Tap amount to flip + / −</p>
            <p className="finance-charge-date">{activeTxn.date}</p>
            {activeTxn.pending && <span className="finance-pending">Pending</span>}
          </div>

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

          <FinanceCategoryPicker
            categories={categories}
            vendorTags={vendorTags}
            pendingVendorTag={pendingVendorTag}
            disabled={busyId === activeTxn.id}
            onPickCategory={pickCategory}
            onPickVendorTag={startVendorTag}
          />

          {transactions.length > 1 && (
            <ul className="finance-queue">
              {transactions.slice(1, 6).map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    className={`finance-queue-item${t.id === activeId ? ' is-active' : ''}`}
                    onClick={() => {
                      setActiveId(t.id);
                      setPendingVendorTag(null);
                    }}
                  >
                    <span>{t.merchantName}</span>
                    <span>{formatMoney(t.amount)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

export default FinanceInboxPage;
