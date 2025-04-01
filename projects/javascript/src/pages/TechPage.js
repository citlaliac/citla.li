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
      <div className="page-container">
        <div className="content-section">
          <h2>Tech & Projects</h2>
          <p className="subtitle">Explore my technical work and experience</p>

          <div className="icon-grid">
            {techItems.map(item => (
              <Link to={item.path} key={item.id} className="icon-item">
                <div className="icon-wrapper">
                  <img src={item.icon} alt={item.title} />
                </div>
                <span>{item.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default TechPage; 