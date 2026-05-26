import React, { useState } from 'react';
import { DEFAULT_SKIN_ID, ENTRY_WORSHIPER_SKINS } from './cecConfig';
import CecWorshiperPortrait from './CecWorshiperPortrait';

function CecWorshiperRegister({ onRegister }) {
  const [name, setName] = useState('');
  const [skinId, setSkinId] = useState(DEFAULT_SKIN_ID);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) onRegister(trimmed, skinId);
  };

  return (
    <div className="cec-register-overlay" role="dialog" aria-modal="true" aria-labelledby="cec-register-title">
      <div className="cec-register-panel cec-register-panel--wide">
        <h2 id="cec-register-title" className="cec-register-title">
          Worshiper Register
        </h2>
        <p className="cec-register-blurb">
          Pick your entry-level worshiper, then choose a display name. Frog worshipers level up through Cantor,
          Seminarian, Deacon, and Priest.
        </p>

        <fieldset className="cec-worshiper-pick">
          <legend className="cec-worshiper-pick-legend">Choose your worshiper</legend>
          <div className="cec-worshiper-pick-grid">
            {ENTRY_WORSHIPER_SKINS.map((skin) => (
              <button
                key={skin.id}
                type="button"
                className={`cec-worshiper-pick-option${skinId === skin.id ? ' cec-worshiper-pick-option--selected' : ''}`}
                onClick={() => setSkinId(skin.id)}
                aria-pressed={skinId === skin.id}
              >
                <CecWorshiperPortrait skinId={skin.id} rankId="cantor" size="lg" />
                <span className="cec-worshiper-pick-label">{skin.label}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="cec-register-preview" aria-live="polite">
          <CecWorshiperPortrait skinId={skinId} rankId="cantor" size="hero" />
        </div>

        <form onSubmit={handleSubmit}>
          <label className="cec-register-label" htmlFor="cec-worshiper-name">
            Display name
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
          <button type="submit" className="cec-register-submit" disabled={!name.trim()}>
            Enter the cloud
          </button>
        </form>
      </div>
    </div>
  );
}

export default CecWorshiperRegister;
