import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/GuestBook.css';

function GuestbookDisplay() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const response = await fetch('/guestbook-display.php');
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch guestbook entries');
        }
        
        setEntries(data.entries);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching guestbook entries:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchEntries();
  }, []);

  return (
    <div className="guestbook-display-page">
      <div className="background-gif">
        <img src="/assets/imgs/guestbook.jpg" alt="Background" />
      </div>
      <Header />
      <div className="guestbook-display-content">
        {loading ? (
          <div className="loading">Loading entries...</div>
        ) : error ? (
          <div className="error">Error: {error}</div>
        ) : entries.length === 0 ? (
          <div className="no-entries">No entries yet. Be the first to sign!</div>
        ) : (
          <div className="entries-container">
            {entries.map((entry, index) => (
              <div key={index} className="entry">
                <div className="entry-header">
                  <span className="entry-name">{entry.name}</span>
                  <span className="entry-location">from {entry.location}</span>
                  <span className="entry-date">{entry.date}</span>
                </div>
                {entry.message && (
                  <div className="entry-message">{entry.message}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default GuestbookDisplay; 