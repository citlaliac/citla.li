import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

/**
 * TourPage Component
 * Displays available tours and customer reviews
 */
function TourPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const reviewsRef = useRef(null);

  const tours = [
    {
      title: "Daughter for a Day",
      description: "Experience NYC through the eyes of a local! Let me show you the hidden gems, share stories, and make you feel like family in the city that never sleeps.",
      image: "/assets/imgs/daughter-tour.jpg"
    },
    {
      title: "Ellis Island",
      description: "Walk in the footsteps of millions of immigrants who arrived at America's gateway. Discover the stories of hope, struggle, and new beginnings that shaped our nation.",
      image: "/assets/imgs/ellis-island.jpg"
    },
    {
      title: "Statue of Liberty",
      description: "Visit the iconic symbol of freedom and democracy. Learn about Lady Liberty's history, symbolism, and the incredible engineering behind this world-famous monument.",
      image: "/assets/imgs/statue-liberty.jpg"
    },
    {
      title: "Greenwich Village",
      description: "Explore the historic heart of NYC's artistic and cultural scene. From Washington Square Park to the charming brownstones, discover the village's rich history and vibrant present.",
      image: "/assets/imgs/greenwich-village.jpg"
    }
  ];

  const reviews = [
    {
      text: "A great tour, packed with insights and information. We thoroughly enjoyed our visit, hosted by Citlali. Upon arrival we checked & received our tickets and we're away promptly once the group of 21 assembled. Citlali gave us good logistic briefs throughout to keep us all together through security, boarding & disembarking of ferries.",
      author: "ritchiejc",
      date: "Oct 2023"
    },
    {
      text: "Citlali Aguilar Canamar was our tour guide/leader. She was by far the best tour guide I've ever had on a New York tour experience. She watched over us like a mother hen, she made sure we all understood directions, and when she gave her tour information about the Statue of Liberty and Ellis Island, she was so complete in her descriptions.",
      author: "Burton K",
      date: "Aug 2023"
    },
    {
      text: "Great tour on a nice day. I never write reviews but our guide Citlali was very knowledgeable and made learning about the Statue of liberty and Ellis island more fun than I expected. Our son enjoyed guessing at the answers to her questions as well.",
      author: "Carlos B",
      date: "Aug 2023"
    },
    {
      text: "Such an incredible way to see some NYC and American history up close. The tour logistics and ferry were easy to navigate. We had Citlali as our tour guide and she did an incredible job bringing the stories of these locations to life with her descriptions.",
      author: "Nick D",
      date: "Aug 2023"
    }
  ];

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - reviewsRef.current.offsetLeft);
    setScrollLeft(reviewsRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - reviewsRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    reviewsRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="app-container tour-page">
      <Header />
      <div className="page-container">
        <div className="tour-header">
          <h1 className="main-title">Citlali Guides YOU in NYC!</h1>
          <p className="subtitle">
            As a licensed NYC tour guide, I'm passionate about sharing the city's rich history and vibrant culture. 
            Whether you're interested in iconic landmarks or hidden gems, I'll create an unforgettable experience 
            tailored to your interests. Contact me to schedule your perfect NYC adventure!
          </p>
        </div>

        <div className="tours-grid">
          {tours.map((tour, index) => (
            <div key={index} className="tour-item">
              <div className="tour-image">
                <img src={tour.image} alt={tour.title} />
              </div>
              <div className="tour-content">
                <h2>{tour.title}</h2>
                <p>{tour.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="reviews-section" style={{ maxHeight: '20vh' }}>
          <h2>What People Are Saying</h2>
          <div 
            className="reviews-container"
            ref={reviewsRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ display: 'flex', flexDirection: 'row', overflowX: 'auto', gap: '1rem', padding: '1rem' }}
          >
            {reviews.map((review, index) => (
              <div key={index} className="review-card" style={{ minWidth: '300px', maxWidth: '400px', padding: '0.5rem' }}>
                <p className="review-text" style={{ margin: '0', lineHeight: '1.2', maxHeight: '2.4em', overflow: 'hidden' }}>{review.text}</p>
                <div className="review-author" style={{ fontSize: '0.8em', marginTop: '0.5rem' }}>
                  <span className="author-name">{review.author}</span>
                  <span className="review-date">{review.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default TourPage; 
