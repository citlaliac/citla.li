import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatMoney } from './financeConfig';
import {
  financeCategorizeTransaction,
  financeFetchCategories,
  financeFetchTransactions,
  financeSync,
} from './financeApi';

function FinanceInboxPage() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [expanded, setExpanded] = useState(false);
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

  const pinned = categories.filter((c) => c.isPinned);
  const rest = categories.filter((c) => !c.isPinned);
  const activeTxn = transactions.find((t) => t.id === activeId) || transactions[0];

  const pickCategory = async (categoryId) => {
    if (!activeTxn || busyId) return;
    setBusyId(activeTxn.id);
    setError('');
    try {
      await financeCategorizeTransaction(activeTxn.id, categoryId);
      const next = transactions.filter((t) => t.id !== activeTxn.id);
      setTransactions(next);
      setActiveId(next[0]?.id ?? null);
      setExpanded(false);
    } catch (err) {
      setError(err.message || 'Could not save category');
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
            <p className="finance-charge-amount">{formatMoney(activeTxn.amount)}</p>
            <p className="finance-charge-date">{activeTxn.date}</p>
            {activeTxn.pending && <span className="finance-pending">Pending</span>}
          </div>

          <div className="finance-category-grid finance-category-grid--pinned">
            {pinned.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className="finance-cat-btn"
                disabled={busyId === activeTxn.id}
                onClick={() => pickCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {!expanded ? (
            <button
              type="button"
              className="finance-expand-btn"
              onClick={() => setExpanded(true)}
            >
              More categories
            </button>
          ) : (
            <div className="finance-category-grid">
              {rest.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`finance-cat-btn finance-cat-btn--secondary${
                    cat.slug === 'oops-splurge' ? ' finance-cat-btn--oops' : ''
                  }`}
                  disabled={busyId === activeTxn.id}
                  onClick={() => pickCategory(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}

          {transactions.length > 1 && (
            <ul className="finance-queue">
              {transactions.slice(1, 6).map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    className={`finance-queue-item${t.id === activeId ? ' is-active' : ''}`}
                    onClick={() => {
                      setActiveId(t.id);
                      setExpanded(false);
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
