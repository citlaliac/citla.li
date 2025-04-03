import React from 'react';
import { useParams } from 'react-router-dom';
import '../styles/PhotoCollectionPage.css';

/**
 * PhotoCollectionPage Component
 * Displays a grid of photos for a specific collection
 * The collection is determined by the URL parameter
 */
const PhotoCollectionPage = () => {
  const { collection } = useParams();

  const getPhotos = () => {
    switch (collection) {
      case 'summer-2023':
        return [
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
      case 'spring-2023':
        return [
          'DSC_0535.jpg', 'DSC_0328.jpg', 'DSC_0537.jpg', 'DSC_0331.jpg',
          'DSC_0528.jpg', 'DSC_0336.jpg', 'DSC_0554.jpg'
        ];
      case 'spring-2024':
        return [
          'DSC_0616.jpg', 'DSC_0630.jpg', 'DSC_0511+2.jpg', 'DSC_0525.jpg',
          'DSC_0410.jpg', 'DSC_0371.jpg', 'DSC_0374.jpg', 'DSC_0435.jpg',
          'DSC_0465+2.jpg', 'DSC_0540.jpg', 'DSC_0541.jpg', 'DSC_0378.jpg',
          'DSC_0347.jpg', 'DSC_0547.jpg', 'DSC_0462.jpg', 'DSC_0526.jpg',
          'DSC_0388.jpg', 'DSC_0285.jpg', 'DSC_0465.jpg', 'DSC_0516.jpg',
          'DSC_0303.jpg', 'DSC_0325.jpg', 'DSC_0285+2.jpg', 'DSC_0351.jpg',
          'DSC_0387+2.jpg'
        ];
      case 'portrait':
        return [
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
      case 'moody':
        return [
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
      case 'natural':
        return [
          'DSC_0522.jpg', 'DSC_0517.jpg', 'DSC_0472.jpg', 'DSC_0566.jpg',
          'DSC_0362+2.jpg', 'DSC_0345.jpg', 'DSC_0336.jpg', 'DSC_0344.jpg',
          'DSC_0419.jpg', 'DSC_0473.jpg', 'DSC_0499.jpg', 'DSC_0234.jpg',
          'DSC_0554.jpg', 'DSC_0425.jpg', 'DSC_0233.jpg', 'DSC_0647.jpg',
          'DSC_0636.jpg', 'DSC_0624.jpg', 'DSC_0581.jpg', 'DSC_0611.jpg',
          'DSC_0593.jpg', 'DSC_0535.jpg', 'DSC_0557.jpg', 'DSC_0592.jpg',
          'DSC_0588.jpg', 'DSC_0646.jpg'
        ];
      case 'urban':
        return [
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
      case 'espionner':
        return [
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
      default:
        return [];
    }
  };

  const getCollectionTitle = () => {
    switch (collection) {
      case 'summer-2023':
        return 'Summer 2023';
      case 'spring-2023':
        return 'Spring 2023';
      case 'spring-2024':
        return 'Spring 2024';
      case 'portrait':
        return 'Portrait';
      case 'moody':
        return 'Moody';
      case 'natural':
        return 'Natural';
      case 'urban':
        return 'Urban';
      case 'espionner':
        return 'Espionner';
      default:
        return 'Collection';
    }
  };

  return (
    <div className="photo-collection-page">
      <h1 className="collection-title">{getCollectionTitle()}</h1>
      <div className="photo-grid">
        {getPhotos().map((photo, index) => (
          <div key={index} className="photo-item">
            <img
              src={`/assets/photos/${collection}/${photo}`}
              alt={`Photo ${index + 1}`}
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PhotoCollectionPage; 