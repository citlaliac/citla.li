import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useSEO } from '../hooks/useSEO';
import '../styles/TechPage.css';

/**
 * TechPage Component
 * Displays three large, clickable icons for GitHub, AI work, and Resume
 * Matches the style of the main page with floating animation and hover effects
 */
function TechPage() {
  // SEO configuration for tech page
  useSEO({
    title: 'Citlali Tech Portfolio - GitHub, AI, Resume | citla.li/tech',
    description: 'Explore Citlali Aguilar Canamar\'s tech portfolio. Trust & Safety AI professional, GitHub projects, and professional resume. View technical work and professional experience.',
    keywords: 'Citlali tech, Citlali AI, Citlali GitHub, trust and safety AI, tech professional, software engineer, AI engineer, GitHub portfolio, tech resume, professional resume',
    canonicalUrl: 'https://citla.li/tech',
    ogTitle: 'Citlali Tech Portfolio - AI Professional & Developer',
    ogDescription: 'Explore Citlali\'s tech portfolio. Trust & Safety AI professional, GitHub projects, and professional resume.',
    ogImage: 'https://citla.li/assets/gifs/tech.gif',
    twitterTitle: 'Citlali Tech Portfolio - AI Professional & Developer',
    twitterDescription: 'Explore Citlali\'s tech work. Trust & Safety AI professional with GitHub projects and professional experience.',
    twitterImage: 'https://citla.li/assets/gifs/tech.gif',
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": "Citlali Aguilar Canamar",
      "jobTitle": "Tech Professional",
      "description": "Trust & Safety AI professional and software developer with expertise in AI, machine learning, and software engineering",
      "url": "https://citla.li/tech",
      "image": "https://citla.li/assets/gifs/tech.gif",
      "knowsAbout": ["Trust and Safety AI", "Software Engineering", "Machine Learning", "GitHub", "Programming", "AI Ethics"],
      "hasOccupation": {
        "@type": "Occupation",
        "name": "Tech Professional",
        "occupationLocation": {
          "@type": "City",
          "name": "New York City"
        }
      }
    }
  });

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
      path: '/tech/ts',
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