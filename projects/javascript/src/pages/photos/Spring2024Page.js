import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import '../../styles/photos/PhotoCollectionPage.css';

const Spring2024Page = () => {
  const photos = [
    'DSC_0616.jpg', 'DSC_0630.jpg', 'DSC_0511+2.jpg', 'DSC_0525.jpg',
    'DSC_0410.jpg', 'DSC_0371.jpg', 'DSC_0374.jpg', 'DSC_0435.jpg',
    'DSC_0465+2.jpg', 'DSC_0540.jpg', 'DSC_0541.jpg', 'DSC_0378.jpg',
    'DSC_0347.jpg', 'DSC_0547.jpg', 'DSC_0462.jpg', 'DSC_0526.jpg',
    'DSC_0388.jpg', 'DSC_0285.jpg', 'DSC_0465.jpg', 'DSC_0516.jpg',
    'DSC_0303.jpg', 'DSC_0325.jpg', 'DSC_0285+2.jpg', 'DSC_0351.jpg',
    'DSC_0387+2.jpg'
  ];

  return (
    <div className="photo-collection-page">
      <Header />
      <h1 className="photo-collection-title-section">spring 2024</h1>
      <div className="photo-grid">
        {photos.map((photo, index) => (
          <div key={index} className="photo-item">
            <img
              src={`/assets/photos/spring-2024/${photo}`}
              alt={`Photo ${index + 1} from Spring 2024`}
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

export default Spring2024Page; 