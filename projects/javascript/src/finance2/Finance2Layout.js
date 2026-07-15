import React, { useEffect } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { getFinanceToken } from '../finance/financeApi';
import Finance2LoginPage from './Finance2LoginPage';
import Finance2InboxPage from './Finance2InboxPage';
import Finance2ReportPage from './Finance2ReportPage';
import Finance2SettingsPage from './Finance2SettingsPage';
import { useSEO } from '../hooks/useSEO';
// Start from the live finance styles; override / experiment in Finance2Page.css.
import '../styles/FinancePage.css';
import '../styles/Finance2Page.css';

/**
 * UI playground for Oops finance at /finance2.
 * Same API + auth as /finance; edit files under src/finance2 without touching production UI.
 */
function Finance2AuthedLayout() {
  const token = getFinanceToken();
  const location = useLocation();

  useSEO({
    title: 'Finance2 playground | citla.li',
    description: 'Private spending tracker UI playground.',
    canonicalUrl: 'https://citla.li/finance2',
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (!token) {
    return <Navigate to="/finance2" replace state={{ from: location }} />;
  }

  return (
    <div className="finance-page finance2-page">
      <p className="finance2-playground-banner" role="status">
        UI playground · safe to experiment ·{' '}
        <NavLink className="finance2-playground-banner-link" to="/finance">
          open live /finance
        </NavLink>
      </p>
      <main className="finance-main">
        <Routes>
          <Route path="inbox" element={<Finance2InboxPage />} />
          <Route path="report" element={<Finance2ReportPage />} />
          <Route path="settings" element={<Finance2SettingsPage />} />
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
