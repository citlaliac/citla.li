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
 * Visual language matches the wheel / bulletin map modals.
 */
function CecFactionPanel({ initialFaction, onChange, onClose }) {
  const [faction, setFaction] = useState(initialFaction);
  const [code, setCode] = useState('');
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const token = getAuthToken();
  const previewOnly = !token;

  useEffect(() => {
    // A local guest can inspect the complete modal without a production database.
    if (!token) {
      setFaction(initialFaction);
      return undefined;
    }
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
  }, [initialFaction, onChange, token]);

  const commitFaction = (next) => {
    setFaction(next);
    onChange(next);
    setPreview(null);
    setCode('');
  };

  const handlePreview = async (event) => {
    event.preventDefault();
    if (previewOnly) {
      setPreview({
        displayName: code,
        founderName: 'Sample Pope',
      });
      return;
    }
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
    if (previewOnly) {
      // Local UI preview: pretend the join succeeded so stage affiliation can be checked.
      commitFaction({
        joined: true,
        isFounder: false,
        status: 'active',
        canFound: false,
        canSwitch: true,
        sponsor: { displayName: code.trim() || 'Sample Sponsor' },
        founder: { displayName: preview?.founderName || 'Sample Pope' },
        directFollowers: 0,
        descendantFollowers: 0,
        factionSize: 3,
        smiteChancePercent: 17,
        recruitmentCode: initialFaction?.recruitmentCode || 'Guest',
      });
      return;
    }
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
    if (previewOnly) {
      const name = initialFaction?.recruitmentCode || 'Guest';
      commitFaction({
        joined: true,
        isFounder: true,
        status: 'active',
        canFound: false,
        canSwitch: false,
        sponsor: null,
        founder: { displayName: name },
        directFollowers: 0,
        descendantFollowers: 0,
        factionSize: 1,
        smiteChancePercent: 30,
        recruitmentCode: name,
      });
      return;
    }
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
    <div
      className="cec-faction-overlay cec-wheel-overlay cec-wheel-overlay--map"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cec-faction-title"
    >
      <section className="cec-faction-panel cec-wheel-modal">
        <button type="button" className="cec-faction-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2 id="cec-faction-title" className="cec-wheel-title">
          Congregations
        </h2>
        <p className="cec-wheel-tagline">
          Follow by character name. Your whole follower branch moves with you.
        </p>
        {previewOnly ? (
          <p className="cec-faction-preview-note">Local UI preview · no account changes are saved</p>
        ) : null}

        {busy && !faction ? <p className="cec-faction-loading">Opening the parish books…</p> : null}

        {faction?.joined ? (
          <div className="cec-faction-summary">
            <p className={`cec-faction-status cec-faction-status--${faction.status}`}>
              {faction.status === 'frozen' ? 'Frozen · grace active' : 'Active congregation'}
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
                <strong>{faction.directFollowers}</strong> direct
              </span>
              <span>
                <strong>{faction.descendantFollowers}</strong> followers
              </span>
              <span>
                <strong>{faction.factionSize}</strong> flock
              </span>
              <span>
                <strong>{faction.smiteChancePercent}%</strong> smite
              </span>
            </div>
            <p className="cec-faction-code">
              Recruitment code: your character name, <strong>{faction.recruitmentCode}</strong>
            </p>
            {faction.status === 'frozen' && (
              <p className="cec-faction-warning">
                Grace: founder has until {formatDate(faction.frozenUntil)} to return to 3,000 PP.
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
            Your branch can move again {formatDate(faction.canSwitchAt)}.
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

        <button type="button" className="cec-toast-dismiss cec-wheel-amen" onClick={onClose}>
          Amen
        </button>
      </section>
    </div>
  );
}

export default CecFactionPanel;
