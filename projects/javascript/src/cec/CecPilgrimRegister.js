import React, { useState } from 'react';
import { DEFAULT_AVATAR_ID, WORSHIPER_AVATARS } from './cecConfig';
import CecWorshiperPortrait from './CecWorshiperPortrait';

function CecPilgrimRegister({ onRegister }) {
  const [name, setName] = useState('');
  const [avatarId, setAvatarId] = useState(DEFAULT_AVATAR_ID);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) onRegister(trimmed, avatarId);
  };

  return (
    <div className="cec-register-overlay" role="dialog" aria-modal="true" aria-labelledby="cec-register-title">
      <div className="cec-register-panel cec-register-panel--wide">
        <h2 id="cec-register-title" className="cec-register-title">
          Pilgrim Register
        </h2>
        <p className="cec-register-blurb">
          Pick how you look, choose a name, and enter the cloud. Gone when you close this tab.
        </p>
        <form onSubmit={handleSubmit}>
          <fieldset className="cec-avatar-picker">
            <legend className="cec-register-label">Your worshiper</legend>
            <div className="cec-avatar-grid">
              {WORSHIPER_AVATARS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className={`cec-avatar-option${avatarId === a.id ? ' cec-avatar-option--selected' : ''}`}
                  onClick={() => setAvatarId(a.id)}
                  aria-pressed={avatarId === a.id}
                  aria-label={a.label}
                >
                  <CecWorshiperPortrait avatarId={a.id} size="lg" />
                  <span className="cec-avatar-option-label">{a.label}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <label className="cec-register-label" htmlFor="cec-pilgrim-name">
            Display name
          </label>
          <input
            id="cec-pilgrim-name"
            className="cec-register-input"
            type="text"
            maxLength={24}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sister Agnes"
          />
          <button type="submit" className="cec-register-submit" disabled={!name.trim()}>
            Enter the cloud
          </button>
        </form>
      </div>
    </div>
  );
}

export default CecPilgrimRegister;
