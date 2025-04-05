import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/PhotoCollectionPage.css';

const PortraitPage = () => {
  const photos = [
    'DSC_0194.jpg', 'DSC_0974.jpg', 'DSC_0961.jpg', 'DSC_0959.jpg',
    'DSC_0952.jpg', 'DSC_0930.jpg', 'DSC_0928.jpg', 'DSC_0890.jpg',
    'DSC_0886.jpg', 'DSC_0885.jpg', 'DSC_0879.jpg', 'DSC_0878.jpg',
    'DSC_0874.jpg', 'DSC_0072.jpg', 'DSC_0065.jpg', 'DSC_0056.jpg',
    'DSC_0055.jpg', 'DSC_0050.jpg', 'DSC_0053.jpg', 'DSC_0048.jpg',
    'DSC_0047.jpg', 'DSC_0046.jpg', 'DSC_0043.jpg', 'DSC_0037.jpg',
    'DSC_0024.jpg', 'DSC_0014.jpg', 'DSC_0006.jpg', 'DSC_0698.jpg',
    'DSC_0125.jpg', 'DSC_0882.jpg', 'DSC_0184.jpg', 'DSC_0697.jpg',
    'DSC_0725.jpg', 'DSC_0767.jpg', 'DSC_0839+copy.jpg', 'DSC_0130.jpg',
    'DSC_0763+copy.jpg', 'DSC_0824+copy+2.jpg', 'DSC_0810+2+copy.jpg',
    'DSC_0982.jpg', 'DSC_0926.jpg', 'DSC_0774.jpg', 'DSC_0057.jpg',
    'DSC_0011.jpg', 'DSC_0853+copy.jpg', 'DSC_0881.jpg', 'DSC_0797+copy.jpg',
    'DSC_0600.jpg', 'DSC_0916.jpg', 'DSC_0544.jpg'
  ];

  return (
    <div className="photo-collection-page">
      <Header />
      <h1 className="collection-title">portrait</h1>
      <div className="photo-grid">
        {photos.map((photo, index) => (
          <div key={index} className="photo-item">
            <img
              src={`/assets/photos/portrait/${photo}`}
              alt={`Photo ${index + 1} from Portrait Collection`}
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

export default PortraitPage; 