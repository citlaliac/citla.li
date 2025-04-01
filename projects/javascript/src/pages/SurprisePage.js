import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

function SurprisePage() {
  const navigate = useNavigate();
  const pages = ['/listen', '/laugh', '/read', '/see', '/tech', '/shop', '/tour'];

  React.useEffect(() => {
    const randomPage = pages[Math.floor(Math.random() * pages.length)];
    const timer = setTimeout(() => {
      navigate(randomPage);
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="app-container">
      <Header />
      <div className="page-container">
        <div className="content-section">
          <div className="loading-text">Taking you somewhere special...</div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default SurprisePage; 