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
      image: "/assets/imgs/collections/summer-2023.jpg"
    },
    {
      title: "spring 2023 - sakura, cherry blossoms",
      path: "/collection/spring-2023",
      image: "/assets/imgs/collections/spring-2023.jpg"
    },
    {
      title: "spring 2024 - the sunshine",
      path: "/collection/spring-2024",
      image: "/assets/imgs/collections/spring-2024.jpg"
    },
    {
      title: "espionner",
      path: "/collection/espionner",
      image: "/assets/imgs/collections/espionner.jpg"
    },
    {
      title: "urban",
      path: "/collection/urban",
      image: "/assets/imgs/collections/urban.jpg"
    },
    {
      title: "natural",
      path: "/collection/natural",
      image: "/assets/imgs/collections/natural.jpg"
    },
    {
      title: "moody",
      path: "/collection/moody",
      image: "/assets/imgs/collections/moody.jpg"
    },
    {
      title: "portrait",
      path: "/collection/portrait",
      image: "/assets/imgs/collections/portrait.jpg"
    }
  ];

  return (
    <div className="app-container">
      <Header />
      <div className="page-container">
        <div className="content-section">
          <h2>Click an image below to explore ✨</h2>
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
      <Footer />
    </div>
  );
}

export default SeePage; 