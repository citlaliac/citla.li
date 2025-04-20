import React, { useState, useEffect } from 'react';

const GuestBookEntries = ({ currentPage, onPageChange, totalPages, setTotalPages }) => {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const entriesPerPage = 10;

    useEffect(() => {
        const fetchEntries = async () => {
            try {
                const response = await fetch('/guestbook-display.php');
                if (!response.ok) {
                    throw new Error('Failed to fetch guestbook entries');
                }
                const data = await response.json();
                
                if (data.success) {
                    setEntries(data.entries);
                    setTotalPages(Math.ceil(data.entries.length / entriesPerPage));
                } else {
                    throw new Error(data.error || 'Failed to fetch entries');
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchEntries();
    }, [setTotalPages]);

    const startIndex = (currentPage - 1) * entriesPerPage;
    const endIndex = startIndex + entriesPerPage;
    const currentEntries = entries.slice(startIndex, endIndex);

    if (loading) {
        return <div className="guestbook-loading">Loading entries... ✧･ﾟ: *✧･ﾟ:*</div>;
    }

    if (error) {
        return <div className="guestbook-error">Error: {error}</div>;
    }

    if (entries.length === 0) {
        return <div className="no-entries">No entries yet. Be the first to sign! ✧･ﾟ: *✧･ﾟ:*</div>;
    }

    return (
        <div className="guestbook-entries">
            <h2 className="guestbook-entries-title">✧･ﾟ: * recent signatures ✧･ﾟ:*</h2>
            <div className="entries-container">
                {currentEntries.map((entry, index) => (
                    <div key={index} className="guestbook-entry">
                        <div className="guestbook-entry-header">
                            <span className="entry-name">{entry.name}</span>
                            <span className="entry-location">from {entry.location}</span>
                            <span className="entry-date">{entry.date}</span>
                        </div>
                        {entry.message && (
                            <div className="guestbook-entry-content">{entry.message}</div>
                        )}
                    </div>
                ))}
            </div>

            {totalPages > 1 && (
                <div className="guestbook-pagination">
                    {Array.from({ length: totalPages }, (_, i) => (
                        <button
                            key={i + 1}
                            onClick={() => onPageChange(i + 1)}
                            className={`guestbook-pagination-button ${currentPage === i + 1 ? 'active' : ''}`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GuestBookEntries; 