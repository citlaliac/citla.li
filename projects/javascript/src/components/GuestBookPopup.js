import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/GuestBookPopup.css';

const GuestBookPopup = () => {
    const [showPopup, setShowPopup] = useState(false);
    const [actionGif, setActionGif] = useState(null);
    const [dontShowAgain, setDontShowAgain] = useState(false);
    const [hasVisited, setHasVisited] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Check both conditions when component mounts
        const visitedBefore = localStorage.getItem('hasVisitedBefore') === 'true';
        const dontShow = localStorage.getItem('dontShowAgain') === 'true';
        
        setHasVisited(visitedBefore);
        setDontShowAgain(dontShow);

        // If neither flag is set, this is first visit
        if (!visitedBefore && !dontShow) {
            // Mark as visited
            localStorage.setItem('hasVisitedBefore', 'true');
            setHasVisited(true);
            
            // Show popup after delay
            const timer = setTimeout(() => {
                setShowPopup(true);
            }, 10000);

            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        setShowPopup(false);
        // If "don't show again" is checked, persist that preference
        if (dontShowAgain) {
            localStorage.setItem('dontShowAgain', 'true');
        }
    };

    const handleMinimize = () => {
        setActionGif('/assets/gifs/clippy-squish.gif');
        setTimeout(() => {
            setActionGif(null);
        }, 10000);
    };

    const handleMaximize = () => {
        setActionGif('/assets/gifs/clippy-think.gif');
        setTimeout(() => {
            setActionGif(null);
        }, 10000);
    };

    const handleSign = () => {
        // If "don't show again" is checked, persist that preference
        if (dontShowAgain) {
            localStorage.setItem('dontShowAgain', 'true');
        }
        navigate('/signGuestbook');
    };

    const handleCheckboxChange = (e) => {
        setDontShowAgain(e.target.checked);
    };

    // Don't render anything if user has visited before or popup shouldn't be shown
    if (!showPopup || hasVisited) return null;

    return (
        <>
            <div className="guestbookpopup-overlay">
                <div className="guestbookpopup-window">
                    <div className="guestbookpopup-titlebar">
                        <div className="guestbookpopup-titlebar-left">
                            <img src="/assets/imgs/citlali-head-still.png" alt="" className="guestbookpopup-windows-icon" />
                            <span className="guestbookpopup-title">CitlaliOS</span>
                        </div>
                        <div className="guestbookpopup-titlebar-buttons">
                            <button className="guestbookpopup-titlebar-button popup-minimize" onClick={handleMinimize}></button>
                            <button className="guestbookpopup-titlebar-button popup-maximize" onClick={handleMaximize}></button>
                            <button className="guestbookpopup-titlebar-button popup-close" onClick={handleClose}>×</button>
                        </div>
                    </div>
                    <div className="guestbookpopup-content">
                        <div className="guestbookpopup-message">
                            <img src="/assets/gifs/guestbookpopup-pen.gif" alt="guestbook with pen" className="guestbookpopup-pen-icon" />
                            <div className="guestbookpopup-text">
                                <p>Wait Traveler, Sign the Guestbook!</p>
                                <p>Leave your mark in our digital realm.</p>
                                <label className="guestbookpopup-checkbox">
                                    <input 
                                        type="checkbox" 
                                        checked={dontShowAgain}
                                        onChange={handleCheckboxChange}
                                    />
                                    <span>Don't show this message again</span>
                                </label>
                            </div>
                        </div>
                        <div className="guestbookpopup-buttons">
                            <button className="guestbookpopup-button" onClick={handleSign}>
                                Take me to sign!
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {actionGif && (
                <img 
                    src={actionGif} 
                    alt="action animation" 
                    className="guestbookpopup-action-gif show"
                />
            )}
        </>
    );
};

export default GuestBookPopup; 