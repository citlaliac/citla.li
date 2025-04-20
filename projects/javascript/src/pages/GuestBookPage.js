import React, { useState, useEffect } from 'react';
import GuestBookEntries from '../components/GuestBookEntries';
import VisitorMap from '../components/VisitorMap';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/GuestBook.css';

const GuestBookPage = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalVisitors, setTotalVisitors] = useState(0);

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

                <h1 className="guestbook-title">･ﾟ:✧･ guest book *:･ﾟ✧</h1>
                <div className="guestbook-visitor-count">
                    <p>Thanks for visiting! ✧･ﾟ:</p>
                    <p>*✧･ﾟ:* you're visitor #{totalVisitors}</p>
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
                    <p>✧･ﾟ: *✧･ﾟ:*</p>
                </div>
                <Footer />
            </div>
        </div>
    );
};

export default GuestBookPage; 