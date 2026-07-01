import React, { useState } from 'react';
import { DEFAULT_SKIN_ID, REGISTER_WORSHIPER_SKINS } from './cecConfig';
import CecBrandTitle from './CecBrandTitle';
import CecWorshiperPortrait from './CecWorshiperPortrait';

const PUB = process.env.PUBLIC_URL || '';
const HEAVEN_BTN_BG = `${PUB}/assets/catholicecloud/background/heaven-bkg.jpg`;
const HEAVEN_PANEL_BG = `${PUB}/assets/catholicecloud/background/heaven-bkg.jpg`;

function CecWorshiperRegister({ onRegister }) {
  const [name, setName] = useState('');
  const [skinId, setSkinId] = useState(DEFAULT_SKIN_ID);
  const trimmedName = name.trim();

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) onRegister(trimmed, skinId);
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
          <p className="cec-register-preview-name">{trimmedName || '\u00A0'}</p>
          <CecWorshiperPortrait skinId={skinId} rankId="cantor" size="hero" />
        </div>

        <form onSubmit={handleSubmit}>
          <label className="cec-register-label" htmlFor="cec-worshiper-name">
            Select a name for your worshiper
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
          <button
            type="submit"
            className="cec-register-submit"
            disabled={!name.trim()}
            style={{ '--cec-heaven-btn-bg': `url('${HEAVEN_BTN_BG}')` }}
          >
            Enter the cloud
          </button>
        </form>
      </div>
    </div>
  );
}

export default CecWorshiperRegister;
