import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import '../../styles/photos/PhotoCollectionPage.css';

const UrbanPage = () => {
  const photos = [
    'DSC_0609.jpg', 'DSC_0355.jpg', 'DSC_0565.jpg', 'DSC_0608.jpg',
    'DSC_0549.jpg', 'DSC_0037.jpg', 'DSC_0421.jpg', 'DSC_0491.jpg',
    'DSC_0503.jpg', 'DSC_0682.jpg', 'DSC_0104.jpg', 'DSC_0561.jpg',
    'DSC_0413.jpg', 'DSC_0890.jpg', 'DSC_0440.jpg', 'DSC_0843.jpg',
    'DSC_0749.jpg', 'DSC_0081.jpg', 'DSC_0554.jpg', 'DSC_0119.jpg',
    'DSC_0264.jpg', 'DSC_0341.jpg', 'DSC_0622.jpg', 'DSC_0369+3.jpg',
    'DSC_0587.jpg', 'DSC_0186.jpg', 'DSC_0537.jpg', 'DSC_0528.jpg',
    'DSC_0568.jpg', 'DSC_0585.jpg', 'DSC_0322.jpg', 'DSC_0369.jpg',
    'DSC_0154.jpg', 'DSC_0101.jpg', 'DSC_0497+2.jpg', 'DSC_0313.jpg',
    'DSC_0148.jpg', 'DSC_0529.jpg', 'DSC_0813.jpg', 'DSC_0335.jpg',
    'DSC_0626.jpg', 'DSC_0288.jpg', 'DSC_0133.jpg', 'DSC_0409.jpg',
    'DSC_0302.jpg', 'DSC_0550.jpg', 'DSC_0347.jpg', 'DSC_0475.jpg',
    'DSC_0922.jpg', 'DSC_0589.jpg', 'DSC_0552.jpg', 'DSC_0414.jpg'
  ];

  return (
    <div className="photo-collection-page">
      <Header />
      <h1 className="photo-collection-title-section">urban</h1>
      <div className="photo-grid">
        {photos.map((photo, index) => (
          <div key={index} className="photo-item">
            <img
              src={`${process.env.PUBLIC_URL || ''}/assets/photos/urban/${photo}`}
              alt={`${index + 1} from Urban Collection`}
              loading="lazy"
              style={{ width: '100%', height: 'auto', display: 'block' }}
              onError={(e) => {
                console.error(`Error loading image: ${photo}`);
                e.target.style.display = 'none';
              }}
              onLoad={(e) => {
                console.log(`Successfully loaded image: ${photo}`);
              }}
            />
          </div>
        ))}
      </div>
      <Footer />
    </div>
  );
};

export default UrbanPage; 