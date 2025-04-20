import React, { useState, useEffect } from 'react';
import GuestBookEntries from '../components/GuestBookEntries';
import VisitorMap from '../components/VisitorMap';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/GuestBook.css';

/**
 * GuestBookPage Component
 * 
 * Displays a guestbook with entries, visitor count, and a visitor map.
 * Features pagination for guestbook entries and real-time visitor tracking.
 * 
 * @returns {JSX.Element} The rendered guestbook page
 */
const GuestBookPage = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalVisitors, setTotalVisitors] = useState(0);

    /**
     * Fetches the total number of visitors from the server
     * Updates the totalVisitors state with the count
     */
    useEffect(() => {
        const fetchTotalVisitors = async () => {
            try {
                const response = await fetch('/visitor-count.php');
                if (!response.ok) {
                    throw new Error('Failed to fetch visitor count');
                }
                const data = await response.json();
                if (data.success) {
                    setTotalVisitors(data.count);
                }
            } catch (err) {
                console.error('Error fetching visitor count:', err);
            }
        };

        fetchTotalVisitors();
    }, []);

    return (
        <div className="guestbook-page">
            <div className="background-gif">
                <img src="/assets/gifs/space.gif" alt="Background" />
            </div>
            <Header />
            <div className="guestbook-container">

                <h1 className="guestbook-title">~･ﾟ:✧･ guest book *:･ﾟ✧~</h1>
                <div className="guestbook-visitor-count">
                    <p>*✧･ﾟ:* you're visitor #{totalVisitors} this month *✧･ﾟ:*</p>
                    <p style={{ fontSize: '1rem' }}>need to sign still? click <a href="https://www.citla.li/signGuestbook">here</a></p>
                </div>
                <div className="guestbook-content">
                    <div className="guestbook-entries-section">
                        <GuestBookEntries 
                            currentPage={currentPage}
                            onPageChange={setCurrentPage}
                            totalPages={totalPages}
                            setTotalPages={setTotalPages}
                        />
                    </div>

                    <div className="visitor-map-section">
                        <h2 className="map-title">visitor map</h2>
                        <div className="visitor-map-container">
                            <VisitorMap />
                        </div>
                    </div>
                </div>

                <div className="guestbook-footer">
                    <p>✧･ﾟ: **✧･ﾟ:*thanks for visiting!✧･ﾟ:✧･ﾟ:</p>
                </div>
                <Footer />
            </div>
        </div>
    );
};

export default GuestBookPage; 