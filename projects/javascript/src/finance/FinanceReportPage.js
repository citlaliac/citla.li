import React, { useCallback, useEffect, useState } from 'react';
import { currentMonthKey, formatMoney } from './financeConfig';
import {
  financeCategorizeTransaction,
  financeFetchCategories,
  financeFetchReport,
  financeFetchTransactions,
} from './financeApi';

/**
 * Monthly report with category drill-down and recategorize.
 * Views: overview → category transactions → edit one charge.
 */
function FinanceReportPage() {
  const [month, setMonth] = useState(currentMonthKey());
  const [report, setReport] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Drill-down: null overview | { categoryId, label } list | + selectedTxn edit
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryTxns, setCategoryTxns] = useState([]);
  const [txnsLoading, setTxnsLoading] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [reportData, catData] = await Promise.all([
        financeFetchReport(month),
        financeFetchCategories(),
      ]);
      setReport(reportData);
      setCategories(catData.categories || []);
    } catch (err) {
      setError(err.message || 'Could not load report');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  // Reset drill-down when month changes.
  useEffect(() => {
    setSelectedCategory(null);
    setSelectedTxn(null);
    setCategoryTxns([]);
    setExpanded(false);
  }, [month]);

  const openCategory = async (row) => {
    setSelectedCategory({ categoryId: row.categoryId, label: row.label });
    setSelectedTxn(null);
    setExpanded(false);
    setTxnsLoading(true);
    setError('');
    try {
      const data = await financeFetchTransactions({
        month,
        categoryId: row.categoryId,
      });
      setCategoryTxns(data.transactions || []);
    } catch (err) {
      setError(err.message || 'Could not load transactions');
      setCategoryTxns([]);
    } finally {
      setTxnsLoading(false);
    }
  };

  const backToOverview = () => {
    setSelectedCategory(null);
    setSelectedTxn(null);
    setCategoryTxns([]);
    setExpanded(false);
  };

  const backToCategoryList = () => {
    setSelectedTxn(null);
    setExpanded(false);
  };

  const pickCategory = async (categoryId) => {
    if (!selectedTxn || busyId) return;
    setBusyId(selectedTxn.id);
    setError('');
    try {
      await financeCategorizeTransaction(selectedTxn.id, categoryId);
      // Stay in category view if still same category; otherwise remove from list.
      if (selectedCategory && categoryId === selectedCategory.categoryId) {
        setSelectedTxn(null);
        setExpanded(false);
      } else {
        const next = categoryTxns.filter((t) => t.id !== selectedTxn.id);
        setCategoryTxns(next);
        setSelectedTxn(null);
        setExpanded(false);
        if (next.length === 0) {
          await loadReport();
          backToOverview();
          return;
        }
      }
      await loadReport();
    } catch (err) {
      setError(err.message || 'Could not save category');
    } finally {
      setBusyId(null);
    }
  };

  const pinned = categories.filter((c) => c.isPinned);
  const rest = categories.filter((c) => !c.isPinned);

  const renderCategoryRows = (rows) => {
    if (!rows || rows.length === 0) {
      return <p className="finance-muted">None this month.</p>;
    }
    const localMax = rows.reduce((m, r) => Math.max(m, r.total), 0) || 1;
    return (
      <ul className="finance-report-list">
        {rows.map((row) => (
          <li key={row.categoryId} className="finance-report-row">
            <button
              type="button"
              className="finance-report-row-btn"
              onClick={() => openCategory(row)}
            >
              <div className="finance-report-row-top">
                <span>{row.label}</span>
                <span>{formatMoney(row.total)}</span>
              </div>
              <div className="finance-bar-track">
                <div
                  className="finance-bar-fill"
                  style={{ width: `${Math.min(100, (row.total / localMax) * 100)}%` }}
                />
              </div>
              {row.txnCount != null && (
                <p className="finance-report-txn-count">
                  {row.txnCount} charge{row.txnCount === 1 ? '' : 's'} · tap to edit
                </p>
              )}
            </button>
          </li>
        ))}
      </ul>
    );
  };

  // --- Edit one transaction ---
  if (selectedTxn) {
    return (
      <div className="finance-report">
        <header className="finance-report-head">
          <button type="button" className="finance-back-btn" onClick={backToCategoryList}>
            ← {selectedCategory?.label || 'Back'}
          </button>
        </header>
        <h2 className="finance-section-title">Change category</h2>
        {error && <p className="finance-error">{error}</p>}

        <div className="finance-charge-card">
          <p className="finance-charge-merchant">{selectedTxn.merchantName}</p>
          <p className="finance-charge-amount">{formatMoney(selectedTxn.amount)}</p>
          <p className="finance-charge-date">{selectedTxn.date}</p>
        </div>

        <div className="finance-category-grid finance-category-grid--pinned">
          {pinned.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className="finance-cat-btn"
              disabled={busyId === selectedTxn.id}
              onClick={() => pickCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {!expanded ? (
          <button type="button" className="finance-expand-btn" onClick={() => setExpanded(true)}>
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
                disabled={busyId === selectedTxn.id}
                onClick={() => pickCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- Transaction list for one category ---
  if (selectedCategory) {
    return (
      <div className="finance-report">
        <header className="finance-report-head">
          <button type="button" className="finance-back-btn" onClick={backToOverview}>
            ← Report
          </button>
          <input
            className="finance-month-input"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            aria-label="Report month"
          />
        </header>
        <h2 className="finance-section-title">{selectedCategory.label}</h2>
        <p className="finance-muted">Tap a charge to recategorize it.</p>
        {error && <p className="finance-error">{error}</p>}
        {txnsLoading && <p className="finance-muted">Loading…</p>}
        {!txnsLoading && categoryTxns.length === 0 && (
          <p className="finance-muted">No charges in this category for {month}.</p>
        )}
        {!txnsLoading && categoryTxns.length > 0 && (
          <ul className="finance-report-list">
            {categoryTxns.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  className="finance-queue-item"
                  onClick={() => setSelectedTxn(t)}
                >
                  <span>
                    <strong>{t.merchantName}</strong>
                    <span className="finance-txn-date-inline"> · {t.date}</span>
                  </span>
                  <span>{formatMoney(t.amount)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // --- Overview ---
  return (
    <div className="finance-report">
      <header className="finance-report-head">
        <h2 className="finance-section-title">Monthly report</h2>
        <input
          className="finance-month-input"
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
      </header>

      {loading && <p className="finance-muted">Loading…</p>}
      {error && <p className="finance-error">{error}</p>}

      {report && !loading && (
        <>
          <p className="finance-report-total">
            Spending total: <strong>{formatMoney(report.spendingTotal)}</strong>
          </p>

          <section className="finance-report-section">
            <h3 className="finance-report-subtitle">By category</h3>
            {report.spending.length === 0 ? (
              <p className="finance-muted">No categorized spending this month.</p>
            ) : (
              renderCategoryRows(report.spending)
            )}
          </section>

          {report.moved?.length > 0 && (
            <section className="finance-report-section">
              <h3 className="finance-report-subtitle">Moved money</h3>
              {renderCategoryRows(report.moved)}
            </section>
          )}

          {report.income?.length > 0 && (
            <section className="finance-report-section">
              <h3 className="finance-report-subtitle">Income</h3>
              {renderCategoryRows(report.income)}
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default FinanceReportPage;
