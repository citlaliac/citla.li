import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useSEO } from '../hooks/useSEO';
import '../styles/NotFoundPage.css';

function NotFoundPage() {
  useSEO({
    title: 'Page not found | citla.li',
    description: 'This page does not exist on citla.li.',
    canonicalUrl: 'https://citla.li/',
    ogTitle: 'Page not found',
    ogDescription: 'This page does not exist.',
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="notfound-page">
      <Header />
      <main className="notfound-main">
        <h1 className="notfound-title">Page not found</h1>
        <p className="notfound-text">
          If you just deployed a new page, try a hard refresh (
          <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd>) so your browser loads
          the latest site bundle.
        </p>
        <p className="notfound-text">
          <Link to="/" className="notfound-link">
            Back to home
          </Link>
          {' · '}
          <Link to="/cmap" className="notfound-link">
            Site map
          </Link>
        </p>
      </main>
      <Footer />
    </div>
  );
}

export default NotFoundPage;
