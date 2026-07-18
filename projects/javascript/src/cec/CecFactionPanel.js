import React, { useEffect, useState } from 'react';
import {
  cecFetchFaction,
  cecFoundFaction,
  cecJoinFaction,
  cecPreviewSponsor,
} from './cecApi';
import { getAuthToken } from './worshiperStorage';

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Account-backed congregation controls. Sponsor preview is a deliberate
 * confirmation step because switching moves the member's whole follower tree.
 */
function CecFactionPanel({ initialFaction, onChange, onClose }) {
  const [faction, setFaction] = useState(initialFaction);
  const [code, setCode] = useState('');
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const token = getAuthToken();

  useEffect(() => {
    let cancelled = false;
    setBusy(true);
    cecFetchFaction(token)
      .then((next) => {
        if (!cancelled) {
          setFaction(next);
          onChange(next);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [onChange, token]);

  const commitFaction = (next) => {
    setFaction(next);
    onChange(next);
    setPreview(null);
    setCode('');
  };

  const handlePreview = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      setPreview(await cecPreviewSponsor(token, code));
    } catch (err) {
      setPreview(null);
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async () => {
    setBusy(true);
    setError('');
    try {
      commitFaction(await cecJoinFaction(token, code));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleFound = async () => {
    setBusy(true);
    setError('');
    try {
      commitFaction(await cecFoundFaction(token));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cec-faction-overlay" role="dialog" aria-modal="true" aria-labelledby="cec-faction-title">
      <section className="cec-faction-panel">
        <button type="button" className="cec-faction-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <p className="cec-faction-kicker">Catholic eCloud</p>
        <h2 id="cec-faction-title">Congregations</h2>

        {busy && !faction ? <p>Opening the parish books…</p> : null}

        {faction?.joined ? (
          <div className="cec-faction-summary">
            <p className={`cec-faction-status cec-faction-status--${faction.status}`}>
              {faction.status === 'frozen' ? 'Frozen congregation' : 'Active congregation'}
            </p>
            <p>
              Supreme line: <strong>{faction.founder.displayName}</strong>
            </p>
            {faction.sponsor ? (
              <p>
                You follow <strong>{faction.sponsor.displayName}</strong>
              </p>
            ) : (
              <p>You founded this congregation.</p>
            )}
            <div className="cec-faction-stats">
              <span>
                <strong>{faction.directFollowers}</strong> direct followers
              </span>
              <span>
                <strong>{faction.descendantFollowers}</strong> total followers
              </span>
              <span>
                <strong>{faction.factionSize}</strong> congregation members
              </span>
              <span>
                <strong>{faction.smiteChancePercent}%</strong> smite chance
              </span>
            </div>
            <p className="cec-faction-code">
              Your recruitment code is your character name: <strong>{faction.recruitmentCode}</strong>
            </p>
            {faction.status === 'frozen' && (
              <p className="cec-faction-warning">
                The founder has five days to return to 3,000 PP. Grace ends {formatDate(faction.frozenUntil)}.
              </p>
            )}
          </div>
        ) : null}

        {faction?.canFound ? (
          <button type="button" className="cec-faction-primary" onClick={handleFound} disabled={busy}>
            {faction.joined ? 'Branch into your own congregation' : 'Found a congregation'}
          </button>
        ) : null}

        {faction && (!faction.joined || (!faction.isFounder && faction.canSwitch)) ? (
          <form className="cec-faction-join" onSubmit={handlePreview}>
            <label htmlFor="cec-sponsor-code">Follow someone by character name</label>
            <div>
              <input
                id="cec-sponsor-code"
                value={code}
                onChange={(event) => {
                  setCode(event.target.value);
                  setPreview(null);
                }}
                maxLength={24}
                autoComplete="off"
                placeholder="Character name"
                required
              />
              <button type="submit" disabled={busy}>
                Look up
              </button>
            </div>
          </form>
        ) : null}

        {faction?.joined && !faction.isFounder && !faction.canSwitch ? (
          <p className="cec-faction-cooldown">
            Your whole follower branch can move again {formatDate(faction.canSwitchAt)}.
          </p>
        ) : null}

        {preview ? (
          <div className="cec-faction-preview">
            <p>
              Follow <strong>{preview.displayName}</strong> in{' '}
              <strong>{preview.founderName}</strong>&rsquo;s congregation?
            </p>
            <p>Your current followers will move with you.</p>
            <button type="button" className="cec-faction-primary" onClick={handleJoin} disabled={busy}>
              Confirm
            </button>
          </div>
        ) : null}

        {error ? (
          <p className="cec-faction-error" role="alert">
            {error}
          </p>
        ) : null}
      </section>
    </div>
  );
}

export default CecFactionPanel;
