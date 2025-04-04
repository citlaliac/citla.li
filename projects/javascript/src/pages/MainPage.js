import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/MainPage.css';

function MainPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const smoothPosition = useRef({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight
      });
    };
  
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);
  
  useEffect(() => {
    const updatePosition = () => {
      smoothPosition.current.x += (mousePosition.x - smoothPosition.current.x) * 0.05;
      smoothPosition.current.y += (mousePosition.y - smoothPosition.current.y) * 0.05;
      
      requestAnimationFrame(updatePosition);
    };
  
    requestAnimationFrame(updatePosition);
  }, [mousePosition]);
  
  const backgroundStyle = {
    background: `radial-gradient(circle at ${smoothPosition.current.x * 100}% ${smoothPosition.current.y * 100}%,rgb(255, 0, 0) 0%,rgb(194, 0, 145) 90%)`,
  };

  return (
    <div className="main-page-container" style={backgroundStyle}>
      <Header />
      <main className="main-page-content">
        <div className="main-page-title-section">
          <img 
            src="/assets/imgs/hiImCitlali.png" 
            alt="hi I'm citlali" 
            className="main-page-title-image"
          />
          <p className="main-page-welcome-text">Welcome to my website. Click around and get to know me.</p>
        </div>
        <div className="main-page-icon-grid">
          <Link to="/listen" className="main-page-icon-item">
            <div className="main-page-icon-wrapper">
              <img src="/assets/gifs/listen.gif" alt="Listen" />
            </div>
            <span className="main-page-icon-text">listen</span>
          </Link>
          <Link to="/laugh" className="main-page-icon-item">
            <div className="main-page-icon-wrapper">
              <img src="/assets/gifs/laugh.gif" alt="Laugh" />
            </div>
            <span className="main-page-icon-text">laugh</span>
          </Link>
          <Link to="/read" className="main-page-icon-item">
            <div className="main-page-icon-wrapper">
              <img src="/assets/gifs/read.gif" alt="read" />
            </div>
            <span className="main-page-icon-text">read</span>
          </Link>
          <Link to="/see" className="main-page-icon-item">
            <div className="main-page-icon-wrapper">
              <img src="/assets/gifs/see.gif" alt="See" />
            </div>
            <span className="main-page-icon-text">see</span>
          </Link>
          <Link to="/tech" className="main-page-icon-item">
            <div className="main-page-icon-wrapper">
              <img src="/assets/gifs/tech.gif" alt="Tech" />
            </div>
            <span className="main-page-icon-text">tech</span>
          </Link>
          <Link to="/shop" className="main-page-icon-item" target="_blank" rel="noopener noreferrer">
            <div className="main-page-icon-wrapper">
              <img src="/assets/gifs/shop.gif" alt="Shop" />
            </div>
            <span className="main-page-icon-text">shop</span>
          </Link>
          <Link to="/tour" className="main-page-icon-item">
            <div className="main-page-icon-wrapper">
              <img src="/assets/gifs/tour.gif" alt="Tour" />
            </div>
            <span className="main-page-icon-text">tour</span>
          </Link>
          <Link to="/surprise" className="main-page-icon-item">
            <div className="main-page-icon-wrapper">
              <img src="/assets/gifs/surprise.gif" alt="Surprise" />
            </div>
            <span className="main-page-icon-text">surprise</span>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default MainPage; 