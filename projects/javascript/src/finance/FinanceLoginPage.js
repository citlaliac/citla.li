import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FINANCE_REMEMBER_DAYS,
  financeLogin,
  isFinanceDemo,
  setFinanceToken,
} from './financeApi';

function FinanceLoginPage() {
  const [password, setPassword] = useState('');
  // Checked by default: stay signed in for FINANCE_REMEMBER_DAYS on this browser.
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { token } = await financeLogin(password, {
        rememberMe,
        rememberDays: rememberMe ? FINANCE_REMEMBER_DAYS : 1,
      });
      // Demo login already stored the token; live API still needs client persist.
      if (token) setFinanceToken(token, { remember: rememberMe });
      navigate('/finance/inbox', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="finance-login">
      <h1 className="finance-login-title">Oops</h1>
      <p className="finance-login-copy">Sort your spending</p>
      {isFinanceDemo && (
        <p className="finance-demo-banner">Demo mode — type any password to preview the UI</p>
      )}
      <form className="finance-login-form" onSubmit={handleSubmit}>
        <label className="finance-label" htmlFor="finance-password">
          Password
        </label>
        <input
          id="finance-password"
          className="finance-input"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <label className="finance-remember" htmlFor="finance-remember">
          <input
            id="finance-remember"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <span>Keep me signed in for {FINANCE_REMEMBER_DAYS} days</span>
        </label>
        {!rememberMe && (
          <p className="finance-muted finance-remember-hint">
            Session ends when you close this tab
          </p>
        )}
        {error && <p className="finance-error">{error}</p>}
        <button className="finance-btn finance-btn--primary" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

export default FinanceLoginPage;
