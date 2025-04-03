import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/PhotoCollectionPage.css';

const Summer2023Page = () => {
  const photos = [
    'DSC_0708.jpg', 'DSC_0704.jpg', 'DSC_0634.jpg', 'DSC_0641.jpg',
    'DSC_0608.jpg', 'DSC_0633.jpg', 'DSC_0605.jpg', 'DSC_0597.jpg',
    'DSC_0560.jpg', 'DSC_0565.jpg', 'DSC_0559.jpg', 'DSC_0552.jpg',
    'DSC_0552-1.jpg', 'DSC_0550.jpg', 'DSC_0551.jpg', 'DSC_0538.jpg',
    'DSC_0549.jpg', 'DSC_0523.jpg', 'DSC_0522.jpg', 'DSC_0519.jpg',
    'DSC_0517.jpg', 'DSC_0515.jpg', 'DSC_0481.jpg', 'DSC_0475.jpg',
    'DSC_0455.jpg', 'DSC_0355.jpg', 'DSC_0437.jpg', 'DSC_0355+2.jpg',
    'DSC_0311.jpg', 'DSC_0306.jpg', 'DSC_0295+2.jpg', 'DSC_0282.jpg',
    'DSC_0262.jpg', 'DSC_0250.jpg', 'DSC_0246.jpg', 'DSC_0236.jpg',
    'DSC_0204.jpg', 'DSC_0208.jpg', 'DSC_0116.jpg', 'DSC_0126.jpg',
    'DSC_0189.jpg', 'DSC_0056.jpg', 'DSC_0043.jpg', 'DSC_0006.jpg',
    'DSC_0005.jpg'
  ];

  return (
    <div className="photo-collection-page">
      <Header />
      <h1 className="collection-title">Summer 2023</h1>
      <div className="photo-grid">
        {photos.map((photo, index) => (
          <div key={index} className="photo-item">
            <img
              src={`/assets/photos/summer-2023/${photo}`}
              alt={`Photo ${index + 1} from Summer 2023`}
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

export default Summer2023Page; 