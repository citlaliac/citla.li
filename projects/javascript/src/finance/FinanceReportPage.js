import React, { useEffect, useState } from 'react';
import { currentMonthKey, formatMoney } from './financeConfig';
import { financeFetchReport } from './financeApi';

function FinanceReportPage() {
  const [month, setMonth] = useState(currentMonthKey());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    financeFetchReport(month)
      .then((data) => {
        if (!cancelled) setReport(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load report');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [month]);

  const maxSpend =
    report?.spending?.reduce((m, r) => Math.max(m, r.total), 0) || 1;

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
              <ul className="finance-report-list">
                {report.spending.map((row) => (
                  <li key={row.categoryId} className="finance-report-row">
                    <div className="finance-report-row-top">
                      <span>{row.label}</span>
                      <span>{formatMoney(row.total)}</span>
                    </div>
                    <div className="finance-bar-track">
                      <div
                        className="finance-bar-fill"
                        style={{ width: `${Math.min(100, (row.total / maxSpend) * 100)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {report.moved?.length > 0 && (
            <section className="finance-report-section">
              <h3 className="finance-report-subtitle">Moved money</h3>
              <ul className="finance-report-list finance-report-list--compact">
                {report.moved.map((row) => (
                  <li key={row.categoryId} className="finance-report-row-top">
                    <span>{row.label}</span>
                    <span>{formatMoney(row.total)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default FinanceReportPage;
