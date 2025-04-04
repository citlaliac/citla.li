import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/PhotoCollectionPage.css';

const NaturalPage = () => {
  const photos = [
    'DSC_0522.jpg', 'DSC_0517.jpg', 'DSC_0472.jpg', 'DSC_0566.jpg',
    'DSC_0362+2.jpg', 'DSC_0345.jpg', 'DSC_0336.jpg', 'DSC_0344.jpg',
    'DSC_0419.jpg', 'DSC_0473.jpg', 'DSC_0499.jpg', 'DSC_0234.jpg',
    'DSC_0554.jpg', 'DSC_0425.jpg', 'DSC_0233.jpg', 'DSC_0647.jpg',
    'DSC_0636.jpg', 'DSC_0624.jpg', 'DSC_0581.jpg', 'DSC_0611.jpg',
    'DSC_0593.jpg', 'DSC_0535.jpg', 'DSC_0557.jpg', 'DSC_0592.jpg',
    'DSC_0588.jpg', 'DSC_0646.jpg'
  ];

  return (
    <div className="photo-collection-page">
      <Header />
      <h1 className="collection-title">natural</h1>
      <div className="photo-grid">
        {photos.map((photo, index) => (
          <div key={index} className="photo-item">
            <img
              src={`/assets/photos/natural/${photo}`}
              alt={`Photo ${index + 1} from Natural Collection`}
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

export default NaturalPage; 