import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/PhotoCollectionPage.css';

const Spring2023Page = () => {
  const photos = [
    'DSC_0535.jpg', 'DSC_0328.jpg', 'DSC_0537.jpg', 'DSC_0331.jpg',
    'DSC_0528.jpg', 'DSC_0336.jpg', 'DSC_0554.jpg'
  ];

  return (
    <div className="photo-collection-page">
      <Header />
      <h1 className="collection-title">spring 2023</h1>
      <div className="photo-grid">
        {photos.map((photo, index) => (
          <div key={index} className="photo-item">
            <img
              src={`/assets/photos/spring-2023/${photo}`}
              alt={`Photo ${index + 1} from Spring 2023`}
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

export default Spring2023Page; 