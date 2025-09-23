import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import GuestBookPopup from '../components/GuestBookPopup';
import { useSEO } from '../hooks/useSEO';
import '../styles/MainPage.css';

function MainPage() {
  // Track mouse position for the cool gradient effect
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const smoothPosition = useRef({ x: 0, y: 0 });

  // SEO configuration
  useSEO({
    title: 'Citlali Aguilar Canamar - NYC Tour Guide, Comedian & Photographer | citla.li',
    description: 'Welcome to Citlali Aguilar Canamar\'s website. Professional NYC tour guide, stand-up comedian, and photographer. Book tours, view comedy videos, explore photography collections, and connect with Citlali.',
    keywords: 'Citlali, Citlali Aguilar Canamar, NYC tour guide, stand up comedy, comedian, photographer, improv, comedy, New York tours, photography portfolio, tech professional',
    canonicalUrl: 'https://citla.li/',
    ogTitle: 'Citlali Aguilar Canamar - NYC Tour Guide, Comedian & Photographer',
    ogDescription: 'Professional NYC tour guide, stand-up comedian, and photographer. Book tours, view comedy videos, explore photography collections.',
    ogImage: 'https://citla.li/og-image.gif',
    twitterTitle: 'Citlali Aguilar Canamar - NYC Tour Guide, Comedian & Photographer',
    twitterDescription: 'Professional NYC tour guide, stand-up comedian, and photographer. Book tours and view comedy videos.',
    twitterImage: 'https://citla.li/og-image.gif',
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": "Citlali Aguilar Canamar",
      "url": "https://citla.li",
      "image": "https://citla.li/og-image.gif",
      "description": "Professional NYC tour guide, stand-up comedian, and photographer",
      "jobTitle": ["NYC Tour Guide", "Stand-up Comedian", "Photographer", "Tech Professional"],
      "knowsAbout": ["New York City Tours", "Stand-up Comedy", "Photography", "Trust and Safety AI"],
      "sameAs": [
        "https://citla.li"
      ]
    }
  });
  
  // Listen for mouse movement and update position
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: e.clientX / window.innerWidth,  // Normalize to 0-1 range
        y: e.clientY / window.innerHeight  // Normalize to 0-1 range
      });
    };
  
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);
  
  // Smooth out the mouse movement for a more fluid effect
  useEffect(() => {
    const updatePosition = () => {
      // Use a smoothing factor of 0.05 for a nice, smooth transition
      smoothPosition.current.x += (mousePosition.x - smoothPosition.current.x) * 0.05;
      smoothPosition.current.y += (mousePosition.y - smoothPosition.current.y) * 0.05;
      
      requestAnimationFrame(updatePosition);
    };
  
    requestAnimationFrame(updatePosition);
  }, [mousePosition]);
  
  // Create the dynamic background gradient based on mouse position
  const backgroundStyle = {
    background: `radial-gradient(circle at ${smoothPosition.current.x * 100}% ${smoothPosition.current.y * 100}%,rgb(255, 0, 0) 0%,rgb(194, 0, 145) 90%)`,
  };

  return (
    <div className="main-page-container" style={backgroundStyle}>
      <GuestBookPopup />
      <Header />
      <main className="main-page-content">
        <div className="main-page-title-section">
          <div className="title-images">
            <Link to="/karaoke">
              <img 
                src="/assets/imgs/hiImCitlali.png" 
                alt="Hi I'm Citlali Aguilar Canamar - NYC Tour Guide, Comedian and Photographer - DEPLOYED SUCCESSFULLY!" 
                className="hi-im"
              />
            </Link>
            <Link to="/signGuestbook">
              <img 
                src="/assets/gifs/og-image.gif" 
                alt="Spinning Citlali head animation - Sign My Guestbook" 
                className="guestbook"
              />
            </Link>
          </div>
          <p className="main-page-welcome-text">!!Welcome to my website. Click around and get to know me.</p>
          {/* Test deployment - this comment should trigger GitHub Actions */}
        </div>
        <div className="main-page-icon-grid">
          {/* Navigation links with floating animation */}
          <Link to="/listen" className="main-page-icon-item">
            <div className="main-page-icon-wrapper">
              <img src="/assets/gifs/listen.gif" alt="Listen to Citlali - Audio content and music" />
            </div>
            <span className="main-page-icon-text">listen</span>
          </Link>
          <Link to="/laugh" className="main-page-icon-item">
            <div className="main-page-icon-wrapper">
              <img src="/assets/gifs/laugh.gif" alt="Laugh with Citlali - Stand-up comedy and improv videos" />
            </div>
            <span className="main-page-icon-text">laugh</span>
          </Link>
          <Link to="/read" className="main-page-icon-item">
            <div className="main-page-icon-wrapper">
              <img src="/assets/gifs/read.gif" alt="Read with Citlali - Books and written content" />
            </div>
            <span className="main-page-icon-text">read</span>
          </Link>
          <Link to="/see" className="main-page-icon-item">
            <div className="main-page-icon-wrapper">
              <img src="/assets/gifs/see.gif" alt="See Citlali's Photography - Portrait, urban, and natural photo collections" />
            </div>
            <span className="main-page-icon-text">see</span>
          </Link>
          <Link to="/tech" className="main-page-icon-item">
            <div className="main-page-icon-wrapper">
              <img src="/assets/gifs/tech.gif" alt="Citlali's Tech Portfolio - GitHub, AI, and professional resume" />
            </div>
            <span className="main-page-icon-text">tech</span>
          </Link>
          <Link to="/shop" className="main-page-icon-item" target="_blank" rel="noopener noreferrer">
            <div className="main-page-icon-wrapper">
              <img src="/assets/gifs/shop.gif" alt="Shop with Citlali - Merchandise and products" />
            </div>
            <span className="main-page-icon-text">shop</span>
          </Link>
          <Link to="/tour" className="main-page-icon-item">
            <div className="main-page-icon-wrapper">
              <img src="/assets/gifs/tour.gif" alt="Book NYC Tours with Citlali - Statue of Liberty, Ellis Island, Hudson Yards" />
            </div>
            <span className="main-page-icon-text">tour</span>
          </Link>
          <Link to="/surprise" className="main-page-icon-item">
            <div className="main-page-icon-wrapper">
              <img src="/assets/gifs/surprise.gif" alt="Surprise with Citlali - Special content and surprises" />
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