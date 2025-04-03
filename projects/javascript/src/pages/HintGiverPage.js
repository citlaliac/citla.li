import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/HintGiverPage.css';
import Header from '../components/Header';
import Footer from '../components/Footer';

const HintGiverPage = () => {
  const [showEnvelope, setShowEnvelope] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
  const [backgroundGif, setBackgroundGif] = useState('');
  
  // Select a random background GIF on component mount
  useEffect(() => {
    const gifNames = [
      'hint-bkg1.gif',
      'hint-bkg2.gif',
      'hint-bkg3.gif',
      'hint-bkg4.gif',
    ];
    
    const randomIndex = Math.floor(Math.random() * gifNames.length);
    const selectedGif = `/assets/gifs/hintgiverGifs/${gifNames[randomIndex]}`;
    setBackgroundGif(selectedGif);
  }, []);

  // Hide envelope after 2 seconds
  useEffect(() => {
    const envelopeTimer = setTimeout(() => {
      setShowEnvelope(false);
    }, 2000);

    return () => clearTimeout(envelopeTimer);
  }, []);

  // Show video after 30 seconds
  useEffect(() => {
    const videoTimer = setTimeout(() => {
      setShowVideo(true);
    }, 30000);

    return () => clearTimeout(videoTimer);
  }, []);

  const handleTinderClick = () => {
    window.open('https://tinder.com/download', '_blank');
  };

  const handleVideoClick = () => {
    window.open('https://youtu.be/cZaJYDPY-YQ?si=RqTt2TD2Lb4eseKc&t=46', '_blank');
  };

  return (
    <div className="hint-giver-page">
      {backgroundGif && (
        <div className="background-gif">
          <img src={backgroundGif} alt="Background" />
        </div>
      )}
      <Header />
      <div className="hint-container">
        {showEnvelope && (
          <div className="envelope">
            <div className="envelope-flap"></div>
            <div className="envelope-body"></div>
          </div>
        )}
        
        <div className={`letter-paper ${!showEnvelope ? 'visible' : ''}`}>
          <div className="letter-content">
            <h2>Hello</h2>
            <p>If you've reached this page it is likely because you have simply not gotten the hint. The affiliated party, whom initially tried to clue you in to their disintrest, is trying to give you a very clear, non-ambiguous sign that they are simply <em>not interested</em> :( It is possible they never even were. Does that make them a bad person? No. Does them sending you to this website? Probably, but that's how we know you really need this message. Maybe you just recently met, or perhaps you've been seeing each other for a while, either way there's a hint that you really aren't getting and we'd like to remedy that. I mean come on, you're not a mind reader!</p>
			<p>For whatever reason, the affiliated party feels they have done their due diligence to alert you that your romantic contact is no longer desired, and you are simply not getting it. It's not them, it's you. Or maybe it is them-- they "aren't ready to date right now", or at least they aren't ready to date <em>you</em>. It could be either of you, or both of you. It doesn't matter, it's you now, honey; move on. </p>
			<p>This IS the sign you were looking for. This IS the "stop contacting me" message. <a href="https://tinder.com/" target="on_blank">This</a> IS the link to get Tinder on your phone, okay? You're going to be alright champ, but for now: Get the hint.</p>
			<p>Let this notice serve as a final reminder to please not contact the affiliated party in this capacity again. :) </p>
          </div>
          <button className="tinder-button" onClick={handleVideoClick}>
          thank, u
        </button>
        </div>
        
        
        {showVideo && (
          <div className="video-container">
            <iframe
              width="100%"
              height="100%"
              src="https://youtu.be/iGM18sfsqrk?si=N7BrZB2nGesSRq1D&t=58"
              title="Hint Giver Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default HintGiverPage;