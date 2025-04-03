import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/SeePage.css';

/**
 * SeePage Component
 * Displays a grid of photography collections
 * Each collection is represented by a large image with an overlay title
 * Clicking a collection navigates to its dedicated page
 */
const SeePage = () => {
  // Define the available photography collections
  const collections = [
    {
      title: 'Summer 2023',
      path: '/photos/summer-2023',
      image: '/assets/photos/summer-2023/DSC_0708.jpg'
    },
    {
      title: 'Spring 2023',
      path: '/photos/spring-2023',
      image: '/assets/photos/spring-2023/DSC_0535.jpg'
    },
    {
      title: 'Spring 2024',
      path: '/photos/spring-2024',
      image: '/assets/photos/spring-2024/DSC_0616.jpg'
    },
    {
      title: 'Portrait',
      path: '/photos/portrait',
      image: '/assets/photos/portrait/DSC_0194.jpg'
    },
    {
      title: 'Moody',
      path: '/photos/moody',
      image: '/assets/photos/moody/DSC_0378.jpg'
    },
    {
      title: 'Natural',
      path: '/photos/natural',
      image: '/assets/photos/natural/DSC_0522.jpg'
    },
    {
      title: 'Urban',
      path: '/photos/urban',
      image: '/assets/photos/urban/DSC_0609.jpg'
    },
    {
      title: 'Espionner',
      path: '/photos/espionner',
      image: '/assets/photos/espionner/DSC_0621.jpg'
    }
  ];

  return (
    <div className="see-page">
      <Header />
      <h1 className="page-title">See</h1>
      <div className="collections-grid">
        {collections.map((collection, index) => (
          <Link to={collection.path} key={index} className="collection-item">
            <div className="collection-image">
              <img
                src={collection.image}
                alt={collection.title}
                loading="lazy"
              />
            </div>
            <h2 className="collection-title">{collection.title}</h2>
          </Link>
        ))}
      </div>
      <Footer />
    </div>
  );
};

export default SeePage; 