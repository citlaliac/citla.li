import React, { useEffect, useState } from 'react';
import { canCompleteAction } from './cecConfig';

const POLL_MS = 12000;

function CecParishBulletin({ worshiper, onPostApproved, expanded, onToggleExpand }) {
  const [entries, setEntries] = useState([]);
  const [body, setBody] = useState('');
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const canPost = canCompleteAction(worshiper, 'bulletin_post');

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
        headers: { 'Content-Type': 'application/json' },
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
        setStatus('Posted to the Parish Bulletin.');
        onPostApproved();
        fetchEntries();
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
    <aside className={`cec-bulletin${expanded ? ' cec-bulletin--open' : ''}`}>
      <button type="button" className="cec-bulletin-toggle" onClick={onToggleExpand}>
        Parish Bulletin {expanded ? '▾' : '▸'}
      </button>
      {expanded && (
        <div className="cec-bulletin-body">
          <p className="cec-bulletin-hint">Shared notes from pilgrims. Names reset when you close this tab.</p>
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
              <button type="submit" className="cec-bulletin-submit" disabled={submitting || !body.trim()}>
                Pin to board
              </button>
            </form>
          ) : (
            <p className="cec-bulletin-cap">Bulletin limit reached this visit.</p>
          )}
          {status && <p className="cec-bulletin-status">{status}</p>}
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
      )}
    </aside>
  );
}

export default CecParishBulletin;
