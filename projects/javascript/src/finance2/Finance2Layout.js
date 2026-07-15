import React, { useEffect, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { getFinanceToken, resetFinanceDemoState } from '../finance/financeApi';
import Finance2LoginPage from './Finance2LoginPage';
import Finance2InboxPage from './Finance2InboxPage';
import Finance2ReportPage from './Finance2ReportPage';
import Finance2SettingsPage from './Finance2SettingsPage';
import Finance2ViewPage from './Finance2ViewPage';
import {
  FINANCE2_FAKE_DATA_EVENT,
  isFinance2FakeDataEnabled,
  setFinance2FakeDataEnabled,
} from './finance2FakeData';
import { useSEO } from '../hooks/useSEO';
// Start from the live finance styles; override / experiment in Finance2Page.css.
import '../styles/FinancePage.css';
import '../styles/Finance2Page.css';

/**
 * UI playground for Oops finance at /finance2.
 * Same API + auth as /finance unless “Use fake data” is on.
 */
function Finance2AuthedLayout() {
  const token = getFinanceToken();
  const location = useLocation();
  const [fakeData, setFakeData] = useState(() => isFinance2FakeDataEnabled());
  // Bump to remount inbox/report when switching data source.
  const [dataEpoch, setDataEpoch] = useState(0);

  useSEO({
    title: 'Finance2 playground | citla.li',
    description: 'Private spending tracker UI playground.',
    canonicalUrl: 'https://citla.li/finance2',
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const sync = () => setFakeData(isFinance2FakeDataEnabled());
    window.addEventListener(FINANCE2_FAKE_DATA_EVENT, sync);
    return () => window.removeEventListener(FINANCE2_FAKE_DATA_EVENT, sync);
  }, []);

  const onToggleFake = (e) => {
    const on = e.target.checked;
    if (on) resetFinanceDemoState();
    setFinance2FakeDataEnabled(on);
    setFakeData(on);
    setDataEpoch((n) => n + 1);
  };

  if (!token) {
    return <Navigate to="/finance2" replace state={{ from: location }} />;
  }

  return (
    <div className={`finance-page finance2-page${fakeData ? ' is-fake-data' : ''}`}>
      <p className="finance2-playground-banner" role="status">
        UI playground ·{' '}
        {fakeData ? 'fake data on' : 'using your real transactions'} ·{' '}
        <NavLink className="finance2-playground-banner-link" to="/finance">
          open live /finance
        </NavLink>
      </p>

      <div className={`finance2-data-mode${fakeData ? ' is-on' : ''}`}>
        <label className="finance2-data-mode-label" htmlFor="finance2-fake-data">
          <input
            id="finance2-fake-data"
            type="checkbox"
            checked={fakeData}
            onChange={onToggleFake}
          />
          <span className="finance2-data-mode-copy">
            <strong>Use fake data</strong>
            <span>
              {fakeData
                ? 'Practice charges only — nothing saves to your real inbox.'
                : 'Off = real Plaid charges (same as /finance).'}
            </span>
          </span>
        </label>
      </div>

      <main className="finance-main">
        <Routes key={dataEpoch}>
          <Route path="inbox" element={<Finance2InboxPage />} />
          <Route path="report" element={<Finance2ReportPage />} />
          <Route path="settings" element={<Finance2SettingsPage />} />
          <Route path="settings/view" element={<Finance2ViewPage />} />
          <Route path="*" element={<Navigate to="inbox" replace />} />
        </Routes>
      </main>
      <nav className="finance-bottom-nav" aria-label="Finance2 sections">
        <NavLink to="/finance2/inbox" className="finance-nav-link">
          Inbox
        </NavLink>
        <NavLink to="/finance2/report" className="finance-nav-link">
          Report
        </NavLink>
        <NavLink to="/finance2/settings" className="finance-nav-link">
          Settings
        </NavLink>
      </nav>
    </div>
  );
}

function Finance2Layout() {
  const token = getFinanceToken();

  return (
    <Routes>
      <Route
        index
        element={token ? <Navigate to="inbox" replace /> : <Finance2LoginPage />}
      />
      <Route path="*" element={<Finance2AuthedLayout />} />
    </Routes>
  );
}

export default Finance2Layout;
