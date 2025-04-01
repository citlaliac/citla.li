import React from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

/**
 * PhotoCollectionPage Component
 * Displays a grid of photos for a specific collection
 * The collection is determined by the URL parameter
 */
function PhotoCollectionPage() {
  const { collectionName } = useParams();

  // Define the collection data
  const collectionData = {
    'summer-2023': {
      title: 'summer 2023 - islands, Japan, Hawaii',
      subtitle: 'for full size downloads please visit the have page',
      images: [
        'DSC_0005.JPG',
        'DSC_0552.JPG',
        'DSC_0475.JPG',
        'DSC_0056.JPG',
        'DSC_0189.JPG',
        'DSC_0641.JPG',
        'DSC_0355_2.JPG',
        'DSC_0236.JPG',
        'DSC_0295_2.JPG',
        'DSC_0282.JPG',
        'DSC_0006.JPG',
        'DSC_0043.JPG',
        'DSC_0246.JPG',
        'DSC_0116.JPG',
        'DSC_0126.JPG',
        'DSC_0208.JPG',
        'DSC_0204.JPG',
        'DSC_0250.JPG',
        'DSC_0550.JPG',
        'DSC_0262.JPG',
        'DSC_0306.JPG',
        'DSC_0311.JPG',
        'DSC_0355.JPG',
        'DSC_0515.JPG',
        'DSC_0517.JPG',
        'DSC_0559.JPG',
        'DSC_0565.JPG',
        'DSC_0597.JPG',
        'DSC_0634.JPG',
        'DSC_0522.JPG',
        'DSC_0605.JPG',
        'DSC_0608.JPG',
        'DSC_0633.JPG',
        'DSC_0704.JPG',
        'DSC_0708.JPG',
        'DSC_0455.JPG',
        'DSC_0549.JPG',
        'DSC_0437.JPG',
        'DSC_0519.JPG',
        'DSC_0523.JPG',
        'DSC_0538.JPG',
        'DSC_0552.JPG',
        'DSC_0481.JPG',
        'DSC_0551.JPG',
        'DSC_0560.JPG'
      ]
    },
    'spring-2023': {
      title: 'spring 2023 - sakura, cherry blossoms',
      subtitle: 'for full size downloads please visit the have page',
      images: [] // Add your spring 2023 images here
    },
    'spring-2024': {
      title: 'spring 2024 - the sunshine',
      subtitle: 'for full size downloads please visit the have page',
      images: [] // Add your spring 2024 images here
    },
    'espionner': {
      title: 'espionner',
      subtitle: 'for full size downloads please visit the have page',
      images: [] // Add your espionner images here
    },
    'urban': {
      title: 'urban',
      subtitle: 'for full size downloads please visit the have page',
      images: [] // Add your urban images here
    },
    'natural': {
      title: 'natural',
      subtitle: 'for full size downloads please visit the have page',
      images: [] // Add your natural images here
    },
    'moody': {
      title: 'moody',
      subtitle: 'for full size downloads please visit the have page',
      images: [] // Add your moody images here
    },
    'portrait': {
      title: 'portrait',
      subtitle: 'for full size downloads please visit the have page',
      images: [] // Add your portrait images here
    }
  };

  const collection = collectionData[collectionName];

  if (!collection) {
    return (
      <div className="app-container">
        <Header />
        <div className="page-container">
          <div className="content-section">
            <h2>Collection not found</h2>
            <p>Sorry, this collection doesn't exist.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header />
      <div className="page-container">
        <div className="content-section">
          <h2 className="collection-title">{collection.title}</h2>
          <p className="collection-subtitle">{collection.subtitle}</p>
          <div className="photo-grid">
            {collection.images.map((image, index) => (
              <div key={index} className="photo-item">
                <img 
                  src={`/assets/photos/${collectionName}/${image}`} 
                  alt={`Photo ${index + 1}`}
                  loading="lazy"
                />
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