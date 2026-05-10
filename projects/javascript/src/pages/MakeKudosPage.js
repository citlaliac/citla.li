import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useSEO } from '../hooks/useSEO';
import '../styles/MakeKudosPage.css';

function MakeKudosPage() {
  const [formData, setFormData] = useState({
    name: '',
    reason: '',
    writeKey: '',
  });
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useSEO({
    title: 'Add kudos | citla.li/makekudos',
    description: 'Owner entry form for the kudos hall of fame.',
    canonicalUrl: 'https://citla.li/makekudos',
    ogTitle: 'Add kudos',
    ogDescription: 'Owner entry form.',
    ogImage: 'https://citla.li/og-image.gif',
    twitterTitle: 'Add kudos',
    twitterDescription: 'Owner entry form.',
    twitterImage: 'https://citla.li/og-image.gif',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    const payload = {
      name: formData.name.trim(),
      reason: formData.reason.trim(),
    };
    if (formData.writeKey.trim()) {
      payload.writeKey = formData.writeKey.trim();
    }

    try {
      const url = `${window.location.origin}/submit-kudos.php`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(formData.writeKey.trim()
            ? { 'X-Kudos-Key': formData.writeKey.trim() }
            : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Could not save entry.');
      }

      window.location.href = '/kudos';
    } catch (err) {
      setSubmitError(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="makekudos-page">
      <Header />
      <main className="makekudos-main">
        <div className="makekudos-panel">
          <h1 className="makekudos-title">Add kudos</h1>
          <p className="makekudos-note">
            Entries show on{' '}
            <Link to="/kudos">/kudos</Link>. If your server uses{' '}
            <code className="makekudos-code">KUDOS_WRITE_KEY</code> in{' '}
            <code className="makekudos-code">.env</code>, paste the same value below or it will be
            rejected.
          </p>

          <form onSubmit={handleSubmit} className="makekudos-form">
            <label className="makekudos-label" htmlFor="makekudos-name">
              Name
            </label>
            <input
              id="makekudos-name"
              type="text"
              name="name"
              className="makekudos-input"
              placeholder="Who saved you?"
              value={formData.name}
              onChange={handleChange}
              required
              maxLength={255}
              autoComplete="off"
            />

            <label className="makekudos-label" htmlFor="makekudos-reason">
              How they saved me
            </label>
            <textarea
              id="makekudos-reason"
              name="reason"
              className="makekudos-textarea"
              placeholder="The story — interviews, pep talks, bailouts, whatever."
              value={formData.reason}
              onChange={handleChange}
              required
              rows={8}
            />

            <label className="makekudos-label" htmlFor="makekudos-key">
              Passphrase <span className="makekudos-optional">(optional)</span>
            </label>
            <input
              id="makekudos-key"
              type="password"
              name="writeKey"
              className="makekudos-input"
              placeholder="Only if KUDOS_WRITE_KEY is set on the server"
              value={formData.writeKey}
              onChange={handleChange}
              autoComplete="off"
            />

            {submitError && (
              <p className="makekudos-error" role="alert">
                {submitError}
              </p>
            )}

            <button
              type="submit"
              className="makekudos-submit"
              disabled={submitting}
            >
              {submitting ? 'Saving…' : 'Save to hall of fame'}
            </button>

            <p className="makekudos-back">
              <Link to="/kudos">← Back to hall of fame</Link>
            </p>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default MakeKudosPage;
