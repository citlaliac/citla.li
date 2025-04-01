import React from 'react';
import { useNavigate } from 'react-router-dom';

function RandomPageNavigator() {
  const navigate = useNavigate();
  const pages = [
    '/see',
    '/hear',
    '/read',
    '/laugh',
    '/tech',
    '/shop',
    '/tour',
    '/contact'
  ];

  const navigateToRandomPage = () => {
    const randomPage = pages[Math.floor(Math.random() * pages.length)];
    navigate(randomPage);
  };

  return (
    <div className="icon-item" onClick={navigateToRandomPage}>
      <div className="icon-wrapper">
        <img src="/assets/imgs/surprise.gif" alt="Surprise Me" />
      </div>
      <span>Surprise Me</span>
    </div>
  );
}

export default RandomPageNavigator; 