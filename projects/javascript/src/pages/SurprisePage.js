import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header'; 
import Footer from '../components/Footer';

function SurprisePage() {
  const navigate = useNavigate();
  const pages = ['/listen', '/laugh', '/read', '/see', '/tech', '/shop', '/tour'];

  React.useEffect(() => {
    const randomPage = pages[Math.floor(Math.random() * pages.length)];
    navigate(randomPage);
  }, [navigate]);

  return null;
}

export default SurprisePage; 