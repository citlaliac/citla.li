import React, { useCallback, useEffect, useState } from 'react';
import {
  currentMonthKey,
  formatMoney,
  REPORT_RANGE_OPTIONS,
} from './financeConfig';
import {
  financeCategorizeTransaction,
  financeFetchCategories,
  financeFetchReport,
  financeFetchTransactions,
  financeFlipTransactionAmount,
} from './financeApi';

/**
 * Spending report with timeframe presets (month / last 6 / last 12 / YTD),
 * category/vendor drill-down, and recategorize.
 */
function FinanceReportPage() {
  const [range, setRange] = useState('month');
  const [month, setMonth] = useState(currentMonthKey());
  const [report, setReport] = useState(null);
  const [categories, setCategories] = useState([]);
  const [vendorTags, setVendorTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Drill-down filter: { kind: 'category', categoryId, label } | { kind: 'vendor', vendorTag, label }
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [listTxns, setListTxns] = useState([]);
  const [txnsLoading, setTxnsLoading] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [pendingVendorTag, setPendingVendorTag] = useState(null);
  const [busyId, setBusyId] = useState(null);

  // Shared filters for report + drill-down fetches.
  const windowFilters = useCallback(() => {
    const filters = { range };
    if (range === 'month') filters.month = month;
    return filters;
  }, [range, month]);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [reportData, catData] = await Promise.all([
        financeFetchReport(windowFilters()),
        financeFetchCategories(),
      ]);
      setReport(reportData);
      setCategories(catData.categories || []);
      setVendorTags(catData.vendorTags || []);
    } catch (err) {
      setError(err.message || 'Could not load report');
    } finally {
      setLoading(false);
    }
  }, [windowFilters]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  // Reset drill-down when the selected timeframe changes.
  useEffect(() => {
    setSelectedFilter(null);
    setSelectedTxn(null);
    setListTxns([]);
    setExpanded(false);
    setPendingVendorTag(null);
  }, [range, month]);

  const openCategory = async (row) => {
    setSelectedFilter({ kind: 'category', categoryId: row.categoryId, label: row.label });
    setSelectedTxn(null);
    setExpanded(false);
    setPendingVendorTag(null);
    setTxnsLoading(true);
    setError('');
    try {
      const data = await financeFetchTransactions({
        ...windowFilters(),
        categoryId: row.categoryId,
      });
      setListTxns(data.transactions || []);
    } catch (err) {
      setError(err.message || 'Could not load transactions');
      setListTxns([]);
    } finally {
      setTxnsLoading(false);
    }
  };

  const openVendor = async (row) => {
    setSelectedFilter({ kind: 'vendor', vendorTag: row.slug, label: row.label });
    setSelectedTxn(null);
    setExpanded(false);
    setPendingVendorTag(null);
    setTxnsLoading(true);
    setError('');
    try {
      const data = await financeFetchTransactions({
        ...windowFilters(),
        vendorTag: row.slug,
      });
      setListTxns(data.transactions || []);
    } catch (err) {
      setError(err.message || 'Could not load transactions');
      setListTxns([]);
    } finally {
      setTxnsLoading(false);
    }
  };

  const backToOverview = () => {
    setSelectedFilter(null);
    setSelectedTxn(null);
    setListTxns([]);
    setExpanded(false);
    setPendingVendorTag(null);
  };

  const backToList = () => {
    setSelectedTxn(null);
    setExpanded(false);
    setPendingVendorTag(null);
  };

  const pickCategory = async (categoryId) => {
    if (!selectedTxn || busyId) return;
    setBusyId(selectedTxn.id);
    setError('');
    try {
      const vendorTag =
        pendingVendorTag !== null
          ? pendingVendorTag
          : selectedTxn.vendorTag || '';
      await financeCategorizeTransaction(selectedTxn.id, categoryId, { vendorTag });

      const nextVendor =
        pendingVendorTag !== null ? pendingVendorTag || null : selectedTxn.vendorTag || null;
      const stillInList =
        selectedFilter?.kind === 'category'
          ? categoryId === selectedFilter.categoryId
          : selectedFilter?.kind === 'vendor'
            ? nextVendor === selectedFilter.vendorTag
            : false;

      if (stillInList) {
        const updated = {
          ...selectedTxn,
          categoryId,
          vendorTag: nextVendor,
        };
        setListTxns((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        setSelectedTxn(null);
        setExpanded(false);
        setPendingVendorTag(null);
      } else {
        const next = listTxns.filter((t) => t.id !== selectedTxn.id);
        setListTxns(next);
        setSelectedTxn(null);
        setExpanded(false);
        setPendingVendorTag(null);
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

  const flipSelectedAmount = async () => {
    if (!selectedTxn || busyId) return;
    setBusyId(selectedTxn.id);
    setError('');
    try {
      const data = await financeFlipTransactionAmount(selectedTxn.id);
      const nextAmount =
        data.transaction?.amount != null
          ? data.transaction.amount
          : -Number(selectedTxn.amount);
      const updated = { ...selectedTxn, amount: nextAmount, amountManual: true };
      setSelectedTxn(updated);
      setListTxns((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      await loadReport();
    } catch (err) {
      setError(err.message || 'Could not flip amount');
    } finally {
      setBusyId(null);
    }
  };

  const windowLabel = report?.label || (range === 'month' ? month : 'this period');

  const pinned = categories.filter((c) => c.isPinned);
  const rest = categories.filter((c) => !c.isPinned);
  const pendingVendorLabel =
    vendorTags.find((t) => t.slug === pendingVendorTag)?.label || pendingVendorTag;

  // Range chips + optional month picker (shown on overview and list views).
  const renderRangeControls = () => (
    <div className="finance-range-controls">
      <div className="finance-range-chips" role="group" aria-label="Report timeframe">
        {REPORT_RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={`finance-range-chip${range === opt.id ? ' is-active' : ''}`}
            aria-pressed={range === opt.id}
            onClick={() => setRange(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {range === 'month' && (
        <input
          className="finance-month-input"
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          aria-label="Report month"
        />
      )}
    </div>
  );

  const renderRows = (rows, { onOpen, keyField = 'categoryId' } = {}) => {
    if (!rows || rows.length === 0) {
      return <p className="finance-muted">None in this period.</p>;
    }
    const localMax = rows.reduce((m, r) => Math.max(m, r.total), 0) || 1;
    return (
      <ul className="finance-report-list">
        {rows.map((row) => (
          <li key={row[keyField] || row.slug} className="finance-report-row">
            <button
              type="button"
              className="finance-report-row-btn"
              onClick={() => onOpen(row)}
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

  if (selectedTxn) {
    return (
      <div className="finance-report">
        <header className="finance-report-head">
          <button type="button" className="finance-back-btn" onClick={backToList}>
            ← {selectedFilter?.label || 'Back'}
          </button>
        </header>
        <h2 className="finance-section-title">Change category</h2>
        {error && <p className="finance-error">{error}</p>}

        <div className="finance-charge-card">
          <p className="finance-charge-merchant">{selectedTxn.merchantName}</p>
          {selectedTxn.vendorTag && (
            <p className="finance-vendor-chip">
              {vendorTags.find((t) => t.slug === selectedTxn.vendorTag)?.label ||
                selectedTxn.vendorTag}
            </p>
          )}
          <button
            type="button"
            className="finance-charge-amount finance-charge-amount--btn"
            onClick={flipSelectedAmount}
            disabled={busyId === selectedTxn.id}
            title="Tap to flip + / −"
            aria-label="Flip amount sign"
          >
            {formatMoney(selectedTxn.amount)}
          </button>
          <p className="finance-charge-hint">Tap amount to flip + / −</p>
          <p className="finance-charge-date">{selectedTxn.date}</p>
        </div>

        {pendingVendorTag && (
          <div className="finance-vendor-banner">
            <span>
              Tagged <strong>{pendingVendorLabel}</strong> — now pick what it was
            </span>
            <button
              type="button"
              className="finance-vendor-clear"
              onClick={() => setPendingVendorTag(null)}
            >
              Clear
            </button>
          </div>
        )}

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
          <>
            {vendorTags.length > 0 && (
              <div className="finance-vendor-row">
                {vendorTags.map((tag) => (
                  <button
                    key={tag.slug}
                    type="button"
                    className={`finance-cat-btn finance-cat-btn--vendor${
                      pendingVendorTag === tag.slug ? ' is-active' : ''
                    }`}
                    disabled={busyId === selectedTxn.id}
                    onClick={() => setPendingVendorTag(tag.slug)}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            )}
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
          </>
        )}
      </div>
    );
  }

  if (selectedFilter) {
    return (
      <div className="finance-report">
        <header className="finance-report-head finance-report-head--stack">
          <button type="button" className="finance-back-btn" onClick={backToOverview}>
            ← Report
          </button>
          {renderRangeControls()}
        </header>
        <h2 className="finance-section-title">{selectedFilter.label}</h2>
        <p className="finance-muted">Tap a charge to recategorize it.</p>
        {error && <p className="finance-error">{error}</p>}
        {txnsLoading && <p className="finance-muted">Loading…</p>}
        {!txnsLoading && listTxns.length === 0 && (
          <p className="finance-muted">No charges here for {windowLabel}.</p>
        )}
        {!txnsLoading && listTxns.length > 0 && (
          <ul className="finance-report-list">
            {listTxns.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  className="finance-queue-item"
                  onClick={() => {
                    setSelectedTxn(t);
                    setPendingVendorTag(t.vendorTag || null);
                  }}
                >
                  <span>
                    <strong>{t.merchantName}</strong>
                    {t.vendorTag && (
                      <span className="finance-txn-date-inline">
                        {' '}
                        · {vendorTags.find((v) => v.slug === t.vendorTag)?.label || t.vendorTag}
                      </span>
                    )}
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

  return (
    <div className="finance-report">
      <header className="finance-report-head finance-report-head--stack">
        <h2 className="finance-section-title">Report</h2>
        {renderRangeControls()}
      </header>

      {loading && <p className="finance-muted">Loading…</p>}
      {error && <p className="finance-error">{error}</p>}

      {report && !loading && (
        <>
          <p className="finance-report-window-label">{windowLabel}</p>
          <p className="finance-report-total">
            Spending total: <strong>{formatMoney(report.spendingTotal)}</strong>
          </p>

          <section className="finance-report-section">
            <h3 className="finance-report-subtitle">By category</h3>
            {report.spending.length === 0 ? (
              <p className="finance-muted">No categorized spending in this period.</p>
            ) : (
              renderRows(report.spending, { onOpen: openCategory })
            )}
          </section>

          {report.vendors?.length > 0 && (
            <section className="finance-report-section">
              <h3 className="finance-report-subtitle">By store</h3>
              {renderRows(report.vendors, { onOpen: openVendor, keyField: 'slug' })}
            </section>
          )}

          {report.moved?.length > 0 && (
            <section className="finance-report-section">
              <h3 className="finance-report-subtitle">Moved money</h3>
              {renderRows(report.moved, { onOpen: openCategory })}
            </section>
          )}

          {report.income?.length > 0 && (
            <section className="finance-report-section">
              <h3 className="finance-report-subtitle">Income</h3>
              {renderRows(report.income, { onOpen: openCategory })}
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default FinanceReportPage;
