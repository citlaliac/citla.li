import React, { useCallback, useEffect, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { useNavigate } from 'react-router-dom';
import { currentMonthKey } from './financeConfig';
import {
  clearFinanceToken,
  financeCreateLinkToken,
  financeExchangePublicToken,
  financeExportMonth,
  financeFetchPlaidItems,
} from './financeApi';

function FinanceSettingsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [linkToken, setLinkToken] = useState(null);
  const [month, setMonth] = useState(currentMonthKey());
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadItems = useCallback(async () => {
    try {
      const data = await financeFetchPlaidItems();
      setItems(data.items || []);
    } catch (err) {
      setError(err.message || 'Could not load accounts');
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (publicToken, metadata) => {
      setBusy(true);
      setError('');
      try {
        await financeExchangePublicToken(
          publicToken,
          metadata.institution?.name || 'Linked account'
        );
        setMessage('Account linked.');
        await loadItems();
      } catch (err) {
        setError(err.message || 'Could not link account');
      } finally {
        setBusy(false);
        setLinkToken(null);
      }
    },
    onExit: () => setLinkToken(null),
  });

  useEffect(() => {
    if (linkToken && ready) open();
  }, [linkToken, ready, open]);

  const startLink = async () => {
    setError('');
    setMessage('');
    try {
      const { linkToken: token } = await financeCreateLinkToken();
      setLinkToken(token);
    } catch (err) {
      setError(err.message || 'Could not start Plaid Link');
    }
  };

  const handleExport = async (download) => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await financeExportMonth(month, { download });
      if (result.blob) {
        const url = URL.createObjectURL(result.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `finance-${month}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        setMessage('Downloaded CSV.');
      } else {
        setMessage(`Exported ${result.exported} transactions to Google Drive.`);
      }
    } catch (err) {
      setError(err.message || 'Export failed');
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = () => {
    clearFinanceToken();
    navigate('/finance', { replace: true });
  };

  return (
    <div className="finance-settings">
      <h2 className="finance-section-title">Settings</h2>

      {message && <p className="finance-success">{message}</p>}
      {error && <p className="finance-error">{error}</p>}

      <section className="finance-settings-block">
        <h3 className="finance-settings-label">Linked accounts</h3>
        {items.length === 0 ? (
          <p className="finance-muted">No accounts linked yet.</p>
        ) : (
          <ul className="finance-account-list">
            {items.map((item) => (
              <li key={item.id}>
                <strong>{item.institutionName}</strong>
                {item.lastSyncedAt && (
                  <span className="finance-muted">
                    {' '}
                    · synced {new Date(item.lastSyncedAt).toLocaleString()}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          className="finance-btn finance-btn--primary"
          onClick={startLink}
          disabled={busy}
        >
          Link bank or card
        </button>
      </section>

      <section className="finance-settings-block">
        <h3 className="finance-settings-label">Export month</h3>
        <input
          className="finance-month-input"
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
        <div className="finance-settings-actions">
          <button
            type="button"
            className="finance-btn finance-btn--secondary"
            disabled={busy}
            onClick={() => handleExport(true)}
          >
            Download CSV
          </button>
          <button
            type="button"
            className="finance-btn finance-btn--secondary"
            disabled={busy}
            onClick={() => handleExport(false)}
          >
            Upload to Drive
          </button>
        </div>
      </section>

      <button type="button" className="finance-btn finance-btn--ghost" onClick={handleLogout}>
        Log out
      </button>
    </div>
  );
}

export default FinanceSettingsPage;
