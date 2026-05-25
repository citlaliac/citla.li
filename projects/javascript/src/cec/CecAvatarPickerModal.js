import React, { useState } from 'react';
import { WORSHIPER_AVATARS } from './cecConfig';
import CecWorshiperPortrait from './CecWorshiperPortrait';

function CecAvatarPickerModal({ currentAvatarId, onSave, onClose }) {
  const [avatarId, setAvatarId] = useState(currentAvatarId);

  return (
    <div className="cec-register-overlay" role="dialog" aria-modal="true" aria-labelledby="cec-avatar-change-title">
      <div className="cec-register-panel cec-register-panel--wide">
        <h2 id="cec-avatar-change-title" className="cec-register-title">
          Change vestments
        </h2>
        <div className="cec-avatar-grid">
          {WORSHIPER_AVATARS.map((a) => (
            <button
              key={a.id}
              type="button"
              className={`cec-avatar-option${avatarId === a.id ? ' cec-avatar-option--selected' : ''}`}
              onClick={() => setAvatarId(a.id)}
              aria-pressed={avatarId === a.id}
            >
              <CecWorshiperPortrait avatarId={a.id} size="lg" />
              <span className="cec-avatar-option-label">{a.label}</span>
            </button>
          ))}
        </div>
        <div className="cec-avatar-change-actions">
          <button type="button" className="cec-register-submit" onClick={() => onSave(avatarId)}>
            Save look
          </button>
          <button type="button" className="cec-avatar-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default CecAvatarPickerModal;
