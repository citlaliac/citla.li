import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useSEO } from '../hooks/useSEO';
import { CMAP_SECTIONS } from '../config/cmapSections';
import '../styles/CmapPage.css';

function CmapPage() {
  useSEO({
    title: 'Site map | citla.li/cmap',
    description: 'Links to every page on citla.li.',
    keywords: 'citla.li, site map, navigation',
    canonicalUrl: 'https://citla.li/cmap',
    ogTitle: 'Site map | citla.li',
    ogDescription: 'Links to every page on citla.li.',
    ogImage: 'https://citla.li/og-image.gif',
    twitterTitle: 'Site map | citla.li',
    twitterDescription: 'Links to every page on citla.li.',
    twitterImage: 'https://citla.li/og-image.gif',
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="cmap-page">
      <Header />
      <main className="cmap-main">
        <h1 className="cmap-title">Site map</h1>
        <p className="cmap-intro">
          Every route on this site.{' '}
          <Link to="/" className="cmap-home-link">
            Back to home
          </Link>
        </p>
        {CMAP_SECTIONS.map((section) => (
          <section key={section.title} className="cmap-section">
            <h2 className="cmap-section-title">{section.title}</h2>
            <ul className="cmap-list">
              {section.links.map((item) => (
                <li key={item.path}>
                  <Link to={item.path} className="cmap-link">
                    {item.label}
                  </Link>
                  <span className="cmap-path">{item.path}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
      <Footer />
    </div>
  );
}

export default CmapPage;
