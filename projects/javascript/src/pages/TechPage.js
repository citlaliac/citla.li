import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

/**
 * TechPage Component
 * Displays three large, clickable icons for GitHub, AI work, and Resume
 * Matches the style of the main page with floating animation and hover effects
 */
function TechPage() {
  const techItems = [
    {
      id: 'github',
      title: 'GitHub',
      path: '/tech/github',
      icon: '/assets/gifs/github.gif'
    },
    {
      id: 'ai',
      title: 'Ethical Trust & Safety AI',
      path: '/tech/ai',
      icon: '/assets/gifs/ai.gif'
    },
    {
      id: 'resume',
      title: 'Resume',
      path: '/tech/resume',
      icon: '/assets/gifs/resume.gif'
    }
  ];

  return (
    <div className="app-container">
      <Header />
      <main className="main-content" style={{ background: 'linear-gradient(to right, #FF0000, #FF69B4)' }}>
        <div className="title-section">
          <h1 className="main-title">tech</h1>
          <p className="welcome-text">Explore my technical work and experience</p>
        </div>
        <div className="icon-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '2rem', 
          maxWidth: '1200px', 
          width: '100%', 
          margin: '0 auto' 
        }}>
          {techItems.map(item => (
            <Link to={item.path} key={item.id} className="icon-item">
              <div className="icon-wrapper">
                <img src={item.icon} alt={item.title} />
              </div>
              <span>{item.title}</span>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default TechPage; 