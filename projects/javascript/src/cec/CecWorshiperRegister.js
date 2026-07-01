import React, { useState } from 'react';
import { DEFAULT_SKIN_ID, REGISTER_WORSHIPER_SKINS } from './cecConfig';
import CecBrandTitle from './CecBrandTitle';
import CecWorshiperPortrait from './CecWorshiperPortrait';

const PUB = process.env.PUBLIC_URL || '';
const HEAVEN_BTN_BG = `${PUB}/assets/catholicecloud/background/heaven-bkg.jpg`;
const HEAVEN_PANEL_BG = `${PUB}/assets/catholicecloud/background/heaven-bkg.jpg`;
const IS_DEV = process.env.NODE_ENV === 'development';
const DEV_GUEST_USERNAME = 'citlali';

function CecWorshiperRegister({
  onGuestEnter,
  onRegister,
  onLogin,
  authError,
  authBusy,
}) {
  const [name, setName] = useState(IS_DEV ? DEV_GUEST_USERNAME : '');
  const [username, setUsername] = useState('');
  const [skinId, setSkinId] = useState(DEFAULT_SKIN_ID);
  const [authPanel, setAuthPanel] = useState(null);
  const [email, setEmail] = useState(IS_DEV ? DEV_GUEST_USERNAME : '');
  const [password, setPassword] = useState('');
  const trimmedName = name.trim();
  const trimmedUsername = username.trim();

  const handleEnter = (e) => {
    e.preventDefault();
    if (!trimmedName || authBusy) return;
    onGuestEnter(trimmedName, skinId);
  };

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (authBusy) return;
    if (authPanel === 'login') {
      if (!email.trim()) return;
      if (!IS_DEV && !password) return;
      onLogin(email.trim(), password);
      return;
    }
    if (authPanel === 'signup') {
      if (!email.trim() || password.length < 8 || !trimmedUsername) return;
      onRegister(email.trim(), password, trimmedUsername, skinId);
    }
  };

  const openPanel = (panel) => {
    setAuthPanel((current) => (current === panel ? null : panel));
  };

  return (
    <div className="cec-register-overlay" role="dialog" aria-modal="true" aria-labelledby="cec-register-title">
      <CecBrandTitle as="h2" id="cec-register-title" className="cec-register-title cec-brand-title" />
      <div
        className="cec-register-panel cec-register-panel--wide"
        style={{ '--cec-heaven-panel-bg': `url('${HEAVEN_PANEL_BG}')` }}
      >
        <p className="cec-register-blurb">
          Pick your worshiper type and a display name. Level up your worshiper with Pontifex Points
          earned by completing liturgical activites.
        </p>

        <p className="cec-worshiper-pick-legend">Choose your worshiper</p>
        <fieldset className="cec-worshiper-pick" aria-label="Choose your worshiper">
          <div className="cec-worshiper-pick-grid cec-worshiper-pick-grid--3">
            {REGISTER_WORSHIPER_SKINS.map((skin) => (
              <button
                key={skin.id}
                type="button"
                className={`cec-worshiper-pick-option${skinId === skin.id ? ' cec-worshiper-pick-option--selected' : ''}`}
                onClick={() => setSkinId(skin.id)}
                aria-pressed={skinId === skin.id}
              >
                <CecWorshiperPortrait skinId={skin.id} rankId="cantor" size="xl" />
                <span className="cec-worshiper-pick-label">{skin.label}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="cec-register-preview" aria-live="polite">
          <p className="cec-register-preview-name">
            {(authPanel === 'signup' ? trimmedUsername : trimmedName) || '\u00A0'}
          </p>
          <CecWorshiperPortrait skinId={skinId} rankId="cantor" size="hero" />
        </div>

        <form onSubmit={handleEnter}>
          <label className="cec-register-label" htmlFor="cec-worshiper-name">
            Name for this visit
          </label>
          <input
            id="cec-worshiper-name"
            className="cec-register-input"
            type="text"
            maxLength={24}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sister Agnes"
          />
          <p className="cec-register-name-hint">
            Session only. Registered usernames cannot be used here.
          </p>

          {authError && !authPanel && (
            <p className="cec-register-auth-error" role="alert">
              {authError}
            </p>
          )}

          <button
            type="submit"
            className="cec-register-submit"
            disabled={!trimmedName || authBusy}
            style={{ '--cec-heaven-btn-bg': `url('${HEAVEN_BTN_BG}')` }}
          >
            {authBusy && !authPanel ? 'Please wait…' : 'Enter the cloud'}
          </button>
        </form>

        <div className="cec-register-auth-links">
          <button
            type="button"
            className={`cec-register-auth-link${authPanel === 'login' ? ' cec-register-auth-link--active' : ''}`}
            onClick={() => openPanel('login')}
          >
            log in
          </button>
          <span className="cec-register-auth-sep" aria-hidden="true">
            ·
          </span>
          <button
            type="button"
            className={`cec-register-auth-link${authPanel === 'signup' ? ' cec-register-auth-link--active' : ''}`}
            onClick={() => openPanel('signup')}
          >
            sign up
          </button>
        </div>

        {authPanel && (
          <form className="cec-register-auth-form" onSubmit={handleAuthSubmit}>
            <p className="cec-register-auth-form-hint">
              {authPanel === 'login'
                ? IS_DEV
                  ? `Dev login: enter ${DEV_GUEST_USERNAME} (password optional).`
                  : 'Optional — email login.'
                : 'Optional — lock a username forever.'}
            </p>
            <label className="cec-register-label cec-register-label--compact" htmlFor="cec-account-email">
              {authPanel === 'login' && IS_DEV ? 'Username or email' : 'Email'}
            </label>
            <input
              id="cec-account-email"
              className="cec-register-input cec-register-input--compact"
              type={authPanel === 'login' && IS_DEV ? 'text' : 'email'}
              autoComplete={authPanel === 'login' && IS_DEV ? 'username' : 'email'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={authPanel === 'login' && IS_DEV ? DEV_GUEST_USERNAME : 'you@example.com'}
            />
            {authPanel === 'signup' && (
              <>
                <label className="cec-register-label cec-register-label--compact" htmlFor="cec-account-username">
                  Username
                </label>
                <input
                  id="cec-account-username"
                  className="cec-register-input cec-register-input--compact"
                  type="text"
                  maxLength={24}
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. Sister Agnes"
                />
              </>
            )}
            <label className="cec-register-label cec-register-label--compact" htmlFor="cec-account-password">
              Password
            </label>
            <input
              id="cec-account-password"
              className="cec-register-input cec-register-input--compact"
              type="password"
              autoComplete={authPanel === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={authPanel === 'signup' ? 'At least 8 characters' : 'Your password'}
            />
            {authError && (
              <p className="cec-register-auth-error" role="alert">
                {authError}
              </p>
            )}
            <button
              type="submit"
              className="cec-register-auth-submit"
              disabled={
                authBusy ||
                !email.trim() ||
                (authPanel === 'login'
                  ? !IS_DEV && !password
                  : !password || password.length < 8 || !trimmedUsername)
              }
            >
              {authBusy ? '…' : authPanel === 'login' ? 'log in' : 'create account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default CecWorshiperRegister;
