import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/PhotoCollectionPage.css';

const EspionnerPage = () => {
  const photos = [
    'DSC_0621.jpg', 'DSC_0511+2.jpg', 'DSC_0525.jpg', 'DSC_0616.jpg',
    'DSC_0565.jpg', 'DSC_0547.jpg', 'DSC_0541.jpg', 'DSC_0630.jpg',
    'DSC_0540.jpg', 'DSC_0483.jpg', 'DSC_0410.jpg', 'DSC_0371.jpg',
    'DSC_0493.jpg', 'DSC_0374.jpg', 'DSC_0600.jpg', 'DSC_0599.jpg',
    'DSC_0303.jpg', 'DSC_0347.jpg', 'DSC_0500.jpg', 'DSC_0465+2.jpg',
    'DSC_0435.jpg', 'DSC_0453.jpg', 'DSC_0462.jpg', 'DSC_0408.jpg',
    'DSC_0409.jpg', 'DSC_0407.jpg', 'DSC_0511.jpg', 'DSC_0441.jpg',
    'DSC_0285.jpg', 'DSC_0378.jpg', 'DSC_0430.jpg', 'DSC_0388.jpg',
    'DSC_0526.jpg'
  ];

  return (
    <div className="photo-collection-page">
      <Header />
      <h1 className="collection-title">Espionner</h1>
      <div className="photo-grid">
        {photos.map((photo, index) => (
          <div key={index} className="photo-item">
            <img
              src={`/assets/photos/espionner/${photo}`}
              alt={`Photo ${index + 1} from Espionner Collection`}
              loading="lazy"
              onError={(e) => {
                console.error(`Error loading image: ${photo}`);
                e.target.style.display = 'none';
              }}
            />
          </div>
        ))}
      </div>
      <Footer />
    </div>
  );
};

export default EspionnerPage; 