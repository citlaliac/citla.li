import React, { useState } from 'react';

function CecPilgrimRegister({ onRegister }) {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) onRegister(trimmed);
  };

  return (
    <div className="cec-register-overlay" role="dialog" aria-modal="true" aria-labelledby="cec-register-title">
      <div className="cec-register-panel cec-register-panel--wide">
        <h2 id="cec-register-title" className="cec-register-title">
          Pilgrim Register
        </h2>
        <p className="cec-register-blurb">
          A cool online space for Catholics to hang out. Your worshiper is assigned one Cantor look per
          session.
        </p>
        <p className="cec-register-collection">
          Collect all three worshiper skins — one look per visit.
        </p>
        <form onSubmit={handleSubmit}>
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
