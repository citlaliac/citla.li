import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

/**
 * SeePage Component
 * Displays a grid of photography collections
 * Each collection is represented by a large image with an overlay title
 * Clicking a collection navigates to its dedicated page
 */
function SeePage() {
  // Define the available photography collections
  const collections = [
    { id: 'nature', title: 'Nature', path: '/see/nature' },
    { id: 'urban', title: 'Urban', path: '/see/urban' },
    { id: 'portraits', title: 'Portraits', path: '/see/portraits' },
    { id: 'street', title: 'Street', path: '/see/street' },
    { id: 'abstract', title: 'Abstract', path: '/see/abstract' },
    { id: 'travel', title: 'Travel', path: '/see/travel' },
    { id: 'events', title: 'Events', path: '/see/events' },
    { id: 'experimental', title: 'Experimental', path: '/see/experimental' }
  ];

  return (
    <div className="app-container">
      <Header />
      <div className="page-container">
        <div className="content-section">
          <h2>Photography Collections</h2>
          <p className="subtitle">Explore my visual stories through different lenses</p>
          
          <div className="photo-collections-grid">
            {collections.map(collection => (
              <Link to={collection.path} key={collection.id} className="collection-item">
                <div className="collection-image">
                  <img 
                    src={`/assets/photos/${collection.id}/cover.jpg`} 
                    alt={collection.title}
                    loading="lazy"
                  />
                  <div className="collection-overlay">
                    <h3>{collection.title}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default SeePage; 