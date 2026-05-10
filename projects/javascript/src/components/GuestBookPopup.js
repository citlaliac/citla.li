import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/GuestBookPopup.css';

/** Time before the popup appears on the home page (first eligible visit in cooldown window). */
const POPUP_DELAY_MS = 8000;

/**
 * After an automatic prompt is shown, wait this long before allowing another.
 * (Stored per browser via localStorage — not tied to IP; that would need a server.)
 */
const POPUP_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

const STORAGE_DONT_SHOW = 'dontShowAgain';
const STORAGE_LAST_PROMPT_MS = 'citla_guestbook_popup_last_prompt_ms';

const GuestBookPopup = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [actionGif, setActionGif] = useState(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let timer;
    try {
      if (localStorage.getItem(STORAGE_DONT_SHOW) === 'true') {
        return undefined;
      }
      const lastPrompt = parseInt(
        localStorage.getItem(STORAGE_LAST_PROMPT_MS) || '0',
        10
      );
      if (
        lastPrompt > 0 &&
        Date.now() - lastPrompt < POPUP_COOLDOWN_MS
      ) {
        return undefined;
      }
    } catch {
      return undefined;
    }

    timer = window.setTimeout(() => {
      setShowPopup(true);
      try {
        localStorage.setItem(
          STORAGE_LAST_PROMPT_MS,
          String(Date.now())
        );
      } catch {
        // ignore quota / private mode
      }
    }, POPUP_DELAY_MS);

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  const handleClose = () => {
    setShowPopup(false);
    if (dontShowAgain) {
      try {
        localStorage.setItem(STORAGE_DONT_SHOW, 'true');
      } catch {
        // ignore
      }
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
    if (dontShowAgain) {
      try {
        localStorage.setItem(STORAGE_DONT_SHOW, 'true');
      } catch {
        // ignore
      }
    }
    navigate('/signGuestbook');
  };

  const handleCheckboxChange = (e) => {
    setDontShowAgain(e.target.checked);
  };

  if (!showPopup) return null;

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
              <button type="button" className="guestbookpopup-titlebar-button popup-minimize" onClick={handleMinimize} aria-label="Minimize" />
              <button type="button" className="guestbookpopup-titlebar-button popup-maximize" onClick={handleMaximize} aria-label="Maximize" />
              <button type="button" className="guestbookpopup-titlebar-button popup-close" onClick={handleClose} aria-label="Close">×</button>
            </div>
          </div>
          <div className="guestbookpopup-content">
            <div className="guestbookpopup-message">
              <img src="/assets/gifs/guestbookpopup-pen.gif" alt="" className="guestbookpopup-pen-icon" />
              <div className="guestbookpopup-text">
                <p>Wait Traveler, Sign the Guestbook!</p>
                <p>Leave your mark in our digital realm.</p>
                <label className="guestbookpopup-checkbox">
                  <input
                    type="checkbox"
                    checked={dontShowAgain}
                    onChange={handleCheckboxChange}
                  />
                  <span>Don&apos;t show this message again</span>
                </label>
              </div>
            </div>
            <div className="guestbookpopup-buttons">
              <button type="button" className="guestbookpopup-button" onClick={handleSign}>
                Take me to sign!
              </button>
            </div>
          </div>
        </div>
      </div>
      {actionGif && (
        <img
          src={actionGif}
          alt=""
          className="guestbookpopup-action-gif show"
        />
      )}
    </>
  );
};

export default GuestBookPopup;
