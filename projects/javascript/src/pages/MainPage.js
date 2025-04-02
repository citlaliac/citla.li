import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

function MainPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const backgroundStyle = {
    background: `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, #FF0000 0%, #FF69B4 100%)`,
    transition: 'background 15s ease'
  };

  return (
    <div className="app-container">
      <Header />
      <main className="main-content" style={backgroundStyle}>
        <div className="title-section">
          <h1 className="main-title">hi I'm</h1>
          <p className="welcome-text">Welcome to my website. Click around and get to know me.</p>
        </div>
        <div className="icon-grid">
          <Link to="/listen" className="icon-item">
            <div className="icon-wrapper">
              <img src="/assets/gifs/listen.gif" alt="Listen" />
            </div>
            <span>listen</span>
          </Link>
          <Link to="/laugh" className="icon-item">
            <div className="icon-wrapper">
              <img src="/assets/gifs/laugh.gif" alt="Laugh" />
            </div>
            <span>laugh</span>
          </Link>
          <Link to="/read" className="icon-item">
            <div className="icon-wrapper">
              <img src="/assets/gifs/read.gif" alt="Read" />
            </div>
            <span>read</span>
          </Link>
          <Link to="/see" className="icon-item">
            <div className="icon-wrapper">
              <img src="/assets/gifs/see.gif" alt="See" />
            </div>
            <span>see</span>
          </Link>
          <Link to="/tech" className="icon-item">
            <div className="icon-wrapper">
              <img src="/assets/gifs/tech.gif" alt="Tech" />
            </div>
            <span>tech</span>
          </Link>
          <Link to="/shop" className="icon-item">
            <div className="icon-wrapper">
              <img src="/assets/gifs/shop.gif" alt="Shop" />
            </div>
            <span>shop</span>
          </Link>
          <Link to="/tour" className="icon-item">
            <div className="icon-wrapper">
              <img src="/assets/gifs/tour.gif" alt="Tour" />
            </div>
            <span>tour</span>
          </Link>
          <Link to="/surprise" className="icon-item">
            <div className="icon-wrapper">
              <img src="/assets/gifs/surprise.gif" alt="Surprise" />
            </div>
            <span>surprise</span>
          </Link>
        </div>
      </main>
      {/* <Footer /> */}
    </div>
  );
}

export default MainPage; 