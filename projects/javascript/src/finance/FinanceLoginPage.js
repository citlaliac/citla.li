import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { financeLogin, isFinanceDemo, setFinanceToken } from './financeApi';

function FinanceLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { token } = await financeLogin(password);
      setFinanceToken(token);
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
        {error && <p className="finance-error">{error}</p>}
        <button className="finance-btn finance-btn--primary" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

export default FinanceLoginPage;
