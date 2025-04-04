import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/TechPage.css';

/**
 * TechPage Component
 * Displays three large, clickable icons for GitHub, AI work, and Resume
 * Matches the style of the main page with floating animation and hover effects
 */
function TechPage() {
  const techItems = [
    {
      id: 'github',
      title: 'github',
      path: '/tech/GitHubPage',
      icon: '/assets/gifs/github.gif'
    },
    {
      id: 'ai',
      title: 'trust & safety AI',
      path: '/tech/AIPage',
      icon: '/assets/gifs/ai.gif'
    },
    {
      id: 'resume',
      title: 'resume',
      path: '/tech/resume',
      icon: '/assets/gifs/resume.gif'
    }
  ];

  return (
    <div className="app-container">
    {/* Background gif */}
      <div className="background-gif">
        <img src="/assets/gifs/tech-bkg.gif" alt="Background" />
      </div>
      <Header />
      <main className="main-content">
        <div className="title-section">
          <h1 className="main-title">tech</h1>
          <p className="welcome-text">Explore my technical work and experience</p>
        </div>
        <div className="icon-grid-tech">
          {techItems.map(item => (
            <Link 
              to={item.path} 
              key={item.id} 
              className="icon-item"
              target={item.path.startsWith('http') ? '_blank' : undefined}
              rel={item.path.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              <div className="icon-wrapper">
                <img src={item.icon} alt={item.title} />
              </div>
              <h2>{item.title}</h2>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default TechPage; 