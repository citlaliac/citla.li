import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/BirthdayPage.css';

function BirthdayPage() {
  const [showInitialText, setShowInitialText] = useState(true);
  const [showBlowText, setShowBlowText] = useState(false);
  const [showReallyBlowText, setShowReallyBlowText] = useState(false);
  const [candleLit, setCandleLit] = useState(true);
  const [showHappyBirthday, setShowHappyBirthday] = useState(false);

  useEffect(() => {
    // Initial text disappears after 10 seconds
    const initialTimer = setTimeout(() => {
      setShowInitialText(false);
      setShowBlowText(true);
    }, 10000);

    // "Blow" text disappears after 2 seconds
    const blowTimer = setTimeout(() => {
      setShowBlowText(false);
      setShowReallyBlowText(true);
    }, 2000);

    // "Really blow!" text triggers candle blow out
    const reallyBlowTimer = setTimeout(() => {
      setShowReallyBlowText(false);
      setCandleLit(false);
      setShowHappyBirthday(true);
    }, 4000);

    return () => {
      clearTimeout(initialTimer);
      clearTimeout(blowTimer);
      clearTimeout(reallyBlowTimer);
    };
  }, []);

  return (
    <div className="birthday-page">
      <Header />
      <div className="birthday-container">
        <audio autoPlay loop>
          <source src="/assets/audio/happy-birthday.mp3" type="audio/mpeg" />
        </audio>
        
        <div className="cake-container">
          <div className="cake">
            <div className="frosting"></div>
            <div className="candle">
              <div className={`flame ${candleLit ? 'lit' : 'out'}`}></div>
            </div>
          </div>
        </div>

        {showInitialText && (
          <div className="text-container initial-text">
            <h2>Make a wish and blow out the candle</h2>
          </div>
        )}

        {showBlowText && (
          <div className="text-container blow-text">
            <h2>Blow!</h2>
          </div>
        )}

        {showReallyBlowText && (
          <div className="text-container really-blow-text">
            <h2>Really blow!</h2>
          </div>
        )}

        {showHappyBirthday && (
          <div className="text-container happy-birthday-text">
            <h1>Happy Birthday!</h1>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default BirthdayPage; 