import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';


const SurprisePage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const pages = [
      '/tech',
      '/laugh',
      '/listen',
      '/see',
      '/read',
      '/tour',
      '/shop',
      '/contact',
      '/tech/github',
      '/tech/AIPage',
      '/tech/resume',
      '/photos/summer-2023',
      '/photos/spring-2023',
      '/photos/spring-2024',
      '/photos/portrait',
      '/photos/moody',
      '/photos/natural',
      '/photos/urban',
      '/photos/espionner',
      '/guestbook',
      '/signguestbook',
      '/hintgiver',
      '/birthday'
    ];

    const randomPage = pages[Math.floor(Math.random() * pages.length)];
    
    // Special handling for shop pages
    if (randomPage === '/shop' || randomPage === '/shop/redirect') {
      window.open('http://localhost:3000/shop', '_blank');
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } else {
      navigate(randomPage);
    }
  }, [navigate]);

  return (
    <div className="surprise-page">
      <div className="surprise-content">
        <h1>Surprise!</h1>
        <div className="loading-animation">
          <div className="spinning-circle"></div>
          <div className="bouncing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurprisePage; 