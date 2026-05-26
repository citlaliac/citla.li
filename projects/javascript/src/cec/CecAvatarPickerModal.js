import React, { useState } from 'react';
import { WORSHIPER_PORTRAITS } from './cecConfig';
import CecWorshiperPortrait from './CecWorshiperPortrait';

function CecAvatarPickerModal({ currentRankId, onSave, onClose }) {
  const [previewRankId, setPreviewRankId] = useState(currentRankId || 'cantor');

  return (
    <div className="cec-register-overlay" role="dialog" aria-modal="true" aria-labelledby="cec-avatar-change-title">
      <div className="cec-register-panel">
        <h2 id="cec-avatar-change-title" className="cec-register-title">
          Frog vestments by rank
        </h2>
        <div className="cec-avatar-grid">
          {WORSHIPER_PORTRAITS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`cec-avatar-option${previewRankId === p.rankId ? ' cec-avatar-option--selected' : ''}`}
              onClick={() => setPreviewRankId(p.rankId)}
              aria-pressed={previewRankId === p.rankId}
            >
              <CecWorshiperPortrait rankId={p.rankId} size="lg" />
              <span className="cec-avatar-option-label">{p.label}</span>
            </button>
          ))}
        </div>
        <div className="cec-avatar-change-actions">
          <button type="button" className="cec-register-submit" onClick={() => onSave(previewRankId)}>
            Preview
          </button>
          <button type="button" className="cec-avatar-cancel" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default CecAvatarPickerModal;
