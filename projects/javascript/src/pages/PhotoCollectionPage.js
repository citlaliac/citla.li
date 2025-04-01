import React from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

/**
 * PhotoCollectionPage Component
 * Displays a grid of photos for a specific collection
 * Uses URL parameters to determine which collection to show
 * Each photo has a hover effect revealing its title
 */
function PhotoCollectionPage() {
  const { collectionId } = useParams();
  
  // Collection data structure - would be replaced with actual data from your collections
  const collectionData = {
    nature: {
      title: 'Nature',
      description: 'Capturing the beauty of the natural world',
      photos: [
        { id: 1, src: '/assets/photos/nature/1.jpg', title: 'Forest Path' },
        { id: 2, src: '/assets/photos/nature/2.jpg', title: 'Mountain View' },
        // Add more photos as needed
      ]
    },
    // Add other collections as needed
  };

  // Get collection data or fallback to not found state
  const collection = collectionData[collectionId] || {
    title: 'Collection Not Found',
    description: 'This collection does not exist.',
    photos: []
  };

  return (
    <div className="app-container">
      <Header />
      <div className="page-container">
        <div className="content-section">
          <h2>{collection.title}</h2>
          <p className="subtitle">{collection.description}</p>
          
          <div className="photo-grid">
            {collection.photos.map(photo => (
              <div key={photo.id} className="photo-item">
                <img 
                  src={photo.src} 
                  alt={photo.title}
                  loading="lazy"
                />
                <div className="photo-overlay">
                  <h3>{photo.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default PhotoCollectionPage; 