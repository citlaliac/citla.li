import React, { useEffect, useState } from 'react';
import { ACTIVITY_REWARDS, canCompleteAction, formatActionCooldown, actionCooldownRemainingMs } from './cecConfig';
import { cecAuthHeaders } from './cecApi';

const PUB = process.env.PUBLIC_URL || '';
const HEAVEN_PANEL_BG = `${PUB}/assets/catholicecloud/background/heaven-bkg.jpg`;
const HEAVEN_BTN_BG = `${PUB}/assets/catholicecloud/background/heaven-bkg.jpg`;
const CORK_BOARD_BG = `${PUB}/assets/catholicecloud/bulletin/cork.jpg`;
const PAPER_NOTE_BG = `${PUB}/assets/catholicecloud/bulletin/paper.jpg`;

const POLL_MS = 12000;
const BULLETIN_PP = ACTIVITY_REWARDS.bulletin_post.pp;

function CecParishBulletin({ worshiper, onPostApproved, onClose }) {
  const [entries, setEntries] = useState([]);
  const [body, setBody] = useState('');
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const canPost = canCompleteAction(worshiper, 'bulletin_post');
  const cooldownLeft = formatActionCooldown(actionCooldownRemainingMs(worshiper, 'bulletin_post'));

  const fetchEntries = async () => {
    try {
      const res = await fetch('/cec-bulletin-display.php');
      const data = await res.json();
      if (data.success) setEntries(data.entries);
    } catch {
      /* ignore poll errors */
    }
  };

  useEffect(() => {
    fetchEntries();
    const id = window.setInterval(fetchEntries, POLL_MS);
    return () => window.clearInterval(id);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canPost || !body.trim()) return;
    setSubmitting(true);
    setStatus(null);
    try {
      const res = await fetch('/cec-bulletin-submit.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...cecAuthHeaders() },
        body: JSON.stringify({
          sessionId: worshiper.sessionId,
          displayName: worshiper.displayName,
          rankLabel: worshiper.rank.label,
          body: body.trim(),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Post failed');
      setBody('');
      if (data.approved) {
        const { awarded } = onPostApproved();
        const ppLine =
          awarded > 0 ? ` +${awarded} Pontifex Points` : awarded === 0 ? '' : '';
        setStatus(`Posted to the Parish Bulletin.${ppLine}`);
        fetchEntries();
        onClose();
      } else {
        setStatus('Held for incense review. Check back soon.');
      }
    } catch (err) {
      setStatus(err.message || 'Could not post.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="cec-bulletin-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cec-bulletin-title"
    >
      <aside
        className="cec-bulletin-panel cec-bulletin-panel--heaven"
        style={{ '--cec-heaven-panel-bg': `url('${HEAVEN_PANEL_BG}')` }}
      >
        <div className="cec-bulletin-head">
          <h2 id="cec-bulletin-title" className="cec-bulletin-title cec-bulletin-title--hero">
            Parish Bulletin
          </h2>
        </div>
        <div className="cec-bulletin-body">
          <p className="cec-bulletin-hint">
            Shared notes from worshipers. Pin a note for +{BULLETIN_PP} Pontifex Points (up to{' '}
            once per hour).
          </p>
          {canPost ? (
            <form className="cec-bulletin-form" onSubmit={handleSubmit}>
              <textarea
                className="cec-bulletin-input"
                maxLength={280}
                rows={3}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Leave a note for the cloud…"
              />
              <button
                type="submit"
                className="cec-register-submit cec-bulletin-submit"
                style={{ '--cec-heaven-btn-bg': `url('${HEAVEN_BTN_BG}')` }}
                disabled={submitting || !body.trim()}
              >
                Pin to board (+{BULLETIN_PP} PP)
              </button>
            </form>
          ) : (
            <p className="cec-bulletin-cap">
              {cooldownLeft
                ? `Pin again in ${cooldownLeft}.`
                : 'Bulletin pin on cooldown.'}
            </p>
          )}
          {status && <p className="cec-bulletin-status">{status}</p>}
          <div
            className="cec-bulletin-board"
            style={{
              '--cec-cork-board-bg': `url('${CORK_BOARD_BG}')`,
              '--cec-bulletin-paper-bg': `url('${PAPER_NOTE_BG}')`,
            }}
            aria-label="Cork bulletin board"
          >
            <ul className="cec-bulletin-list">
              {entries.length === 0 ? (
                <li className="cec-bulletin-empty">No posts yet. Be the first.</li>
              ) : (
                entries.map((entry, i) => (
                  <li key={`${entry.date}-${i}`} className="cec-bulletin-item">
                    <div className="cec-bulletin-item-head">
                      <strong>{entry.name}</strong>
                      <span className="cec-bulletin-item-rank">{entry.rank}</span>
                      <time className="cec-bulletin-item-date">{entry.date}</time>
                    </div>
                    <p>{entry.body}</p>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
        <button type="button" className="cec-toast-dismiss cec-bulletin-amen" onClick={onClose}>
          Amen
        </button>
      </aside>
    </div>
  );
}

export default CecParishBulletin;
