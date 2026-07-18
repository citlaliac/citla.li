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
  // loading = first fetch; busy = a user action. Only busy should block clicks.
  const [loading, setLoading] = useState(() => !!getAuthToken());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const token = getAuthToken();
  const previewOnly = !token;

  useEffect(() => {
    // A local guest can inspect the complete modal without a production database.
    if (!token) {
      setFaction(initialFaction);
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    // Fetch once when the panel opens — do not re-run when parent faction state updates,
    // or Look up / Confirm stay disabled (cursor: not-allowed) forever.
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
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount/token only
  }, [token]);

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

        {loading && !faction ? <p className="cec-faction-loading">Opening the parish books…</p> : null}

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

        {faction?.canFound && faction.joined ? (
          <button type="button" className="cec-faction-primary" onClick={handleFound} disabled={busy}>
            Branch into your own congregation
          </button>
        ) : null}

        {faction && !faction.joined ? (
          <p className="cec-faction-hint">
            Follow any worshiper with 3,000+ PP by character name. Their congregation starts when you
            become their first follower — they do not need to tap anything.
          </p>
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
            {preview.willAutoFound ? (
              <p>
                They do not have a flock yet — confirming makes you their first follower and opens
                their congregation.
              </p>
            ) : (
              <p>Your current followers will move with you.</p>
            )}
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
