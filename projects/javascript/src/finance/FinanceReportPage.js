import React, { useCallback, useEffect, useState } from 'react';
import {
  currentMonthKey,
  formatMoney,
  HOT_CATEGORY_RANGE_OPTIONS,
  MERCHANT_RANGE_OPTIONS,
  REPORT_RANGE_OPTIONS,
} from './financeConfig';
import {
  financeCategorizeTransaction,
  financeFetchCategories,
  financeFetchReport,
  financeFetchTransactions,
  financeFlipTransactionAmount,
} from './financeApi';
import FinanceCategoryPicker from './FinanceCategoryPicker';
import FinanceSpendChart from './FinanceSpendChart';

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
  const [pendingVendorTag, setPendingVendorTag] = useState(null);
  const [busyId, setBusyId] = useState(null);
  // Independent of main report range — local chip state for insight panels.
  const [merchantMonths, setMerchantMonths] = useState(6);
  const [hotMonths, setHotMonths] = useState(6);

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
    setPendingVendorTag(null);
  }, [range, month]);

  const openCategory = async (row) => {
    setSelectedFilter({ kind: 'category', categoryId: row.categoryId, label: row.label });
    setSelectedTxn(null);
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
    setPendingVendorTag(null);
  };

  const backToList = () => {
    setSelectedTxn(null);
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
        setPendingVendorTag(null);
      } else {
        const next = listTxns.filter((t) => t.id !== selectedTxn.id);
        setListTxns(next);
        setSelectedTxn(null);
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

  const renderRows = (rows, { onOpen, keyField = 'categoryId', showPct = false } = {}) => {
    if (!rows || rows.length === 0) {
      return <p className="finance-muted">None in this period.</p>;
    }
    const localMax = rows.reduce((m, r) => Math.max(m, r.total), 0) || 1;
    return (
      <ul className="finance-report-list">
        {rows.map((row) => {
          const label = row.label || row.merchantName;
          const key = row[keyField] || row.slug || row.merchantName;
          const barWidth = Math.min(
            100,
            showPct && row.pct != null ? row.pct : (row.total / localMax) * 100
          );
          const body = (
            <>
              <div className="finance-report-row-top">
                <span>{label}</span>
                <span>
                  {formatMoney(row.total)}
                  {showPct && row.pct != null ? (
                    <span className="finance-report-pct"> · {row.pct}%</span>
                  ) : null}
                </span>
              </div>
              <div className="finance-bar-track">
                <div className="finance-bar-fill" style={{ width: `${barWidth}%` }} />
              </div>
              {row.txnCount != null && (
                <p className="finance-report-txn-count">
                  {row.txnCount} charge{row.txnCount === 1 ? '' : 's'}
                  {onOpen ? ' · tap to edit' : ''}
                </p>
              )}
            </>
          );
          return (
            <li key={key} className="finance-report-row">
              {onOpen ? (
                <button type="button" className="finance-report-row-btn" onClick={() => onOpen(row)}>
                  {body}
                </button>
              ) : (
                <div className="finance-report-row-btn finance-report-row-btn--static">{body}</div>
              )}
            </li>
          );
        })}
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

        <FinanceCategoryPicker
          categories={categories}
          vendorTags={vendorTags}
          pendingVendorTag={pendingVendorTag}
          disabled={busyId === selectedTxn.id}
          onPickCategory={pickCategory}
          onPickVendorTag={setPendingVendorTag}
        />
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
          {report.avgMonthlySpend != null && (
            <p className="finance-report-avg">
              Avg / month: <strong>{formatMoney(report.avgMonthlySpend)}</strong>
              {report.monthBucketCount > 1
                ? ` · across ${report.monthBucketCount} months`
                : ''}
            </p>
          )}

          <section className="finance-report-section">
            <h3 className="finance-report-subtitle">Spend over time</h3>
            <FinanceSpendChart
              series={report.monthlySpend || []}
              avgMonthlySpend={report.avgMonthlySpend || 0}
            />
          </section>

          <section className="finance-report-section">
            <h3 className="finance-report-subtitle">By category</h3>
            {report.spending.length === 0 ? (
              <p className="finance-muted">No categorized spending in this period.</p>
            ) : (
              renderRows(report.spending, { onOpen: openCategory, showPct: true })
            )}
          </section>

          <section className="finance-report-section">
            <div className="finance-insight-head">
              <h3 className="finance-report-subtitle">Top merchants</h3>
              <div className="finance-range-chips finance-range-chips--compact" role="group" aria-label="Merchant timeframe">
                {MERCHANT_RANGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`finance-range-chip${merchantMonths === opt.id ? ' is-active' : ''}`}
                    aria-pressed={merchantMonths === opt.id}
                    onClick={() => setMerchantMonths(opt.id)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="finance-muted finance-report-ignored-note">
              Excludes MTA · last {merchantMonths} month{merchantMonths === 1 ? '' : 's'}
            </p>
            {renderRows(report.topMerchants?.[String(merchantMonths)] || [], {
              keyField: 'merchantName',
            })}
          </section>

          <section className="finance-report-section">
            <div className="finance-insight-head">
              <h3 className="finance-report-subtitle">Most used categories</h3>
              <div className="finance-range-chips finance-range-chips--compact" role="group" aria-label="Hot category timeframe">
                {HOT_CATEGORY_RANGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`finance-range-chip${hotMonths === opt.id ? ' is-active' : ''}`}
                    aria-pressed={hotMonths === opt.id}
                    onClick={() => setHotMonths(opt.id)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="finance-muted finance-report-ignored-note">
              By charge count · handy later for pinning inbox buttons
            </p>
            {renderRows(report.hotCategories?.[String(hotMonths)] || [], {
              onOpen: openCategory,
            })}
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

          {/* Review ignored transfers / payoffs without counting them in spending. */}
          <section className="finance-report-section">
            <h3 className="finance-report-subtitle">Ignored</h3>
            <p className="finance-muted finance-report-ignored-note">
              Not counted in spending
              {report.ignoredTotal != null
                ? ` · ${formatMoney(report.ignoredTotal)} total`
                : ''}
              . Tap to verify or recategorize.
            </p>
            {!report.ignored?.length ? (
              <p className="finance-muted">Nothing ignored in this period.</p>
            ) : (
              renderRows(report.ignored, { onOpen: openCategory })
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default FinanceReportPage;
