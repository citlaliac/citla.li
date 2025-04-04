import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';  
import '../styles/PhotoCollectionPage.css';

const MoodyPage = () => {
  const photos = [
    'DSC_0378.jpg', 'DSC_0475.jpg', 'DSC_0306.jpg', 'DSC_0597.jpg',
    'DSC_0355.jpg', 'DSC_0552.jpg', 'DSC_0559.jpg', 'DSC_0549.jpg',
    'DSC_0565.jpg', 'DSC_0550.jpg', 'DSC_0608.jpg', 'DSC_0605.jpg',
    'DSC_0005.jpg', 'DSC_0088.jpg', 'DSC_0191.jpg', 'DSC_0569.jpg',
    'DSC_0409.jpg', 'DSC_0884.jpg', 'DSC_0613.jpg', 'DSC_0814.jpg',
    'DSC_0119.jpg', 'DSC_0587.jpg', 'DSC_0148.jpg', 'DSC_0303.jpg',
    'DSC_0232.jpg', 'DSC_0133.jpg', 'DSC_0649.jpg', 'DSC_0400.jpg',
    'DSC_0646.jpg', 'DSC_0799.jpg', 'DSC_0554.jpg', 'DSC_0500.jpg',
    'DSC_0797.jpg', 'DSC_0462.jpg', 'DSC_0126.jpg', 'DSC_0233.jpg',
    'DSC_0328.jpg'
  ];

  return (
    <div className="photo-collection-page">
      <Header />
      <h1 className="photo-collection-title-section">moody</h1>
      <div className="photo-grid">
        {photos.map((photo, index) => (
          <div key={index} className="photo-item">
            <img
              src={`/assets/photos/moody/${photo}`}
              alt={`Photo ${index + 1} from Moody Collection`}
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

export default MoodyPage; 