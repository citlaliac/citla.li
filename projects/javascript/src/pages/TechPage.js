import React, { useEffect } from 'react';
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
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const techItems = [
    {
      id: 'github',
      title: 'github',
      path: '/tech/github',
      icon: '/assets/gifs/github.gif'
    },
    {
      id: 'ai',
      title: 'trust & safety AI',
      path: '/tech/ai',
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
    <div className="tech-page">
      {/* Background gif */}
      <div className="background-gif">
        <img src="/assets/gifs/tech-bkg.gif" alt="Background" />
      </div>
      <Header />
      <main className="main-content">
        <div className="title-section">
          <h1 className="tech-page-title">tech</h1>
        </div>
        <div className="tech-page-icon-grid">
          {techItems.map(item => (
            <Link 
              to={item.path} 
              key={item.id} 
              className="tech-page-icon-item"
              target={item.path.startsWith('http') ? '_blank' : undefined}
              rel={item.path.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              <div className="tech-page-icon-wrapper">
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