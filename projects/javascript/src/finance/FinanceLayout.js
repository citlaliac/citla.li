import React, { useEffect } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { getFinanceToken } from './financeApi';
import FinanceLoginPage from './FinanceLoginPage';
import FinanceInboxPage from './FinanceInboxPage';
import FinanceReportPage from './FinanceReportPage';
import FinanceSettingsPage from './FinanceSettingsPage';
import { useSEO } from '../hooks/useSEO';
import '../styles/FinancePage.css';

function FinanceAuthedLayout() {
  const token = getFinanceToken();
  const location = useLocation();

  useSEO({
    title: 'Finance | citla.li',
    description: 'Private spending tracker.',
    canonicalUrl: 'https://citla.li/finance',
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (!token) {
    return <Navigate to="/finance" replace state={{ from: location }} />;
  }

  return (
    <div className="finance-page">
      <main className="finance-main">
        <Routes>
          <Route path="inbox" element={<FinanceInboxPage />} />
          <Route path="report" element={<FinanceReportPage />} />
          <Route path="settings" element={<FinanceSettingsPage />} />
          <Route path="*" element={<Navigate to="inbox" replace />} />
        </Routes>
      </main>
      <nav className="finance-bottom-nav" aria-label="Finance sections">
        <NavLink to="/finance/inbox" className="finance-nav-link">
          Inbox
        </NavLink>
        <NavLink to="/finance/report" className="finance-nav-link">
          Report
        </NavLink>
        <NavLink to="/finance/settings" className="finance-nav-link">
          Settings
        </NavLink>
      </nav>
    </div>
  );
}

function FinanceLayout() {
  const token = getFinanceToken();

  return (
    <Routes>
      <Route
        index
        element={token ? <Navigate to="inbox" replace /> : <FinanceLoginPage />}
      />
      <Route path="*" element={<FinanceAuthedLayout />} />
    </Routes>
  );
}

export default FinanceLayout;
