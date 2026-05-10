import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useSEO } from '../hooks/useSEO';
import '../styles/KudosPage.css';

function KudosPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useSEO({
    title: 'Kudos hall of fame | citla.li/kudos',
    description:
      'Thank you to everyone who showed up — how they saved my ass, celebrated publicly.',
    keywords: 'citla.li, kudos, thanks',
    canonicalUrl: 'https://citla.li/kudos',
    ogTitle: 'Kudos hall of fame',
    ogDescription: 'Celebrate the people who saved my ass.',
    ogImage: 'https://citla.li/og-image.gif',
    twitterTitle: 'Kudos hall of fame',
    twitterDescription: 'Celebrate the people who showed up.',
    twitterImage: 'https://citla.li/og-image.gif',
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/kudos-display.php');
        const data = await res.json();
        if (cancelled) return;
        if (data.success && Array.isArray(data.entries)) {
          setEntries(data.entries);
          setError(null);
        } else {
          setEntries([]);
          setError(data.error || 'Could not load kudos.');
        }
      } catch (e) {
        if (!cancelled) {
          setEntries([]);
          setError('Could not load kudos.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="kudos-page">
      <Header />
      <main className="kudos-main">
        <section className="kudos-hero">
          <h1 className="kudos-title">THANK YOU FOR SAVING MY A$$!</h1>
          <p className="kudos-lede">
            This is a space to celebrate YOU! Send it to friends, coworkers, and put me as a
            reference for any interviews because you officially saved my ass!
          </p>
        </section>

        <section className="kudos-hof" aria-labelledby="hof-heading">
          <h2 id="hof-heading" className="kudos-hof-heading">
            Hall of fame
          </h2>

          {loading && (
            <p className="kudos-status">Loading…</p>
          )}
          {!loading && error && (
            <p className="kudos-status kudos-status--error">{error}</p>
          )}
          {!loading && !error && entries.length === 0 && (
            <p className="kudos-empty">
              Entries will appear here once they&apos;re added. Check back soon.
            </p>
          )}

          <ul className="kudos-list">
            {entries.map((entry) => (
              <li key={entry.id} className="kudos-card">
                <div className="kudos-card-header">
                  <span className="kudos-card-name">{entry.name}</span>
                  <span className="kudos-card-date">{entry.date}</span>
                </div>
                <p className="kudos-card-reason-label">How they saved me</p>
                <p className="kudos-card-reason">{entry.reason}</p>
              </li>
            ))}
          </ul>
        </section>

        <p className="kudos-owner-note">
          <Link to="/makekudos" className="kudos-owner-link">
            Add an entry (Citlali)
          </Link>
        </p>
      </main>
      <Footer />
    </div>
  );
}

export default KudosPage;
