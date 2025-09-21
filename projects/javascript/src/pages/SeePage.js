import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useSEO } from '../hooks/useSEO';
import '../styles/SeePage.css';

/**
 * SeePage Component
 * Displays a grid of photography collections
 * Each collection is represented by a large image with an overlay title
 * Clicking a collection navigates to its dedicated page
 */
const SeePage = () => {
  // SEO configuration for photography page
  useSEO({
    title: 'Citlali Photography Portfolio - Portrait, Urban, Natural Photography | citla.li/see',
    description: 'Explore Citlali Aguilar Canamar\'s photography portfolio. Professional photographer specializing in portrait, urban, natural, and moody photography collections. View stunning photo galleries from NYC and beyond.',
    keywords: 'Citlali photography, Citlali photographer, portrait photography, urban photography, natural photography, NYC photographer, photography portfolio, photo collections, professional photographer',
    canonicalUrl: 'https://citla.li/see',
    ogTitle: 'Citlali Photography Portfolio - Professional Photographer',
    ogDescription: 'Explore Citlali\'s photography portfolio. Professional photographer specializing in portrait, urban, natural, and moody photography.',
    ogImage: 'https://citla.li/assets/photos/portrait/DSC_0544.jpg',
    twitterTitle: 'Citlali Photography Portfolio - Professional Photographer',
    twitterDescription: 'Explore Citlali\'s stunning photography portfolio. Portrait, urban, natural, and moody photography collections.',
    twitterImage: 'https://citla.li/assets/photos/portrait/DSC_0544.jpg',
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": "Citlali Aguilar Canamar",
      "jobTitle": "Photographer",
      "description": "Professional photographer specializing in portrait, urban, natural, and moody photography",
      "url": "https://citla.li/see",
      "image": "https://citla.li/assets/photos/portrait/DSC_0544.jpg",
      "knowsAbout": ["Photography", "Portrait Photography", "Urban Photography", "Natural Photography", "Photo Editing"],
      "hasOccupation": {
        "@type": "Occupation",
        "name": "Photographer",
        "occupationLocation": {
          "@type": "City",
          "name": "New York City"
        }
      }
    }
  });

  // Define the available photography collections
  const collections = [
    {
      title: 'summer 2023',
      path: '/photos/summer-2023',
      image: '/assets/photos/summer-2023/DSC_0708.jpg'
    },
    {
      title: 'spring 2023',
      path: '/photos/spring-2023',
      image: '/assets/photos/spring-2023/DSC_0535.jpg'
    },
    {
      title: 'spring 2024',
      path: '/photos/spring-2024',
      image: '/assets/photos/spring-2024/DSC_0387.jpg'
    },
    {
      title: 'portrait',
      path: '/photos/portrait',
      image: '/assets/photos/portrait/DSC_0544.jpg'
    },
    {
      title: 'moody',
      path: '/photos/moody',
      image: '/assets/photos/moody/DSC_0552.jpg'
    },
    {
      title: 'natural',
      path: '/photos/natural',
      image: '/assets/photos/natural/DSC_0646.jpg'
    },
    {
      title: 'urban',
      path: '/photos/urban',
      image: '/assets/photos/urban/DSC_0565.jpg'
    },
    {
      title: 'espionner',
      path: '/photos/espionner',
      image: '/assets/photos/espionner/DSC_0462.jpg'
    }
  ];

  return (
    <div className="see-page">
      <div className="background-gif">
        <img src="/assets/imgs/see-bkg.jpg" alt="Background" />
      </div>
      <Header />
      <h1 className="see-page-title">see</h1>
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