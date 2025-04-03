import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

/**
 * SeePage Component
 * Displays a grid of photography collections
 * Each collection is represented by a large image with an overlay title
 * Clicking a collection navigates to its dedicated page
 */
function SeePage() {
  // Define the available photography collections
  const collections = [
    {
      title: "summer 2023 - islands",
      path: "/collection/summer-2023",
      image: "/assets/photos/summer-2023/DSC_0549.jpg"
    },
    {
      title: "spring 2023 - sakura, cherry blossoms",
      path: "/collection/spring-2023",
      image: "/assets/photos/summer-2023/DSC_0634.jpg"
    },
    {
      title: "spring 2024 - the sunshine",
      path: "/collection/spring-2024",
      image: "/assets/photos/summer-2023/DSC_0708.jpg"
    },
    {
      title: "espionner",
      path: "/collection/espionner",
      image: "/assets/photos/summer-2023/DSC_0597.jpg"
    },
    {
      title: "urban",
      path: "/collection/urban",
      image: "/assets/photos/summer-2023/DSC_0565.jpg"
    },
    {
      title: "natural",
      path: "/collection/natural",
      image: "/assets/photos/summer-2023/DSC_0523.jpg"
    },
    {
      title: "moody",
      path: "/collection/moody",
      image: "/assets/photos/summer-2023/DSC_0605.jpg"
    },
    {
      title: "portrait",
      path: "/collection/portrait",
      image: "/assets/photos/summer-2023/DSC_0641.jpg"
    }
  ];

  return (
    <div className="app-container">
      <Header />
      <div className="page-container">
        <div className="content-section">
          <h2>click an image below to explore ✨</h2>
          <div className="photo-collections-grid">
            {collections.map((collection, index) => (
              <Link 
                key={index} 
                to={collection.path} 
                className="collection-item"
              >
                <div className="collection-image">
                  <img src={collection.image} alt={collection.title} />
                </div>
                <div className="collection-overlay">
                  <h3>{collection.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SeePage; 