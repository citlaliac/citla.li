import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/TourPage.css';

/**
 * TourPage Component
 * Displays available tours and customer reviews
 */
function TourPage() {
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentReviewIndex((prev) => (prev + 1) % reviews.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const tours = [
    {
      title: "Daughter for a Day",
      description: "Brand New Tour! Click here for more info. We'll walk around Manhattan for up to 3 hours, I can hold your hand (if it is of normal human moisture/stickiness levels) and generally pretend to be your child. We can take pictures, walk the Highline, you can buy me things, and even give me up to three (3) life lessons. You are not obligated to call me 'sweetheart', but I will call you 'pops'; for an added fee of $14.99 I will call you 'the dadster'.",
      image: "/assets/imgs/daughter-tour.png"
    },
    {
      title: "Liberty & Ellis Island",
      description: "Learn about Lady Liberty, Ellis Island, and how the contributed to America today! Note: This tour does not include tickets to climb the Statue of Liberty (crown/pedestal) but does include your ticket to the ferry. [Meeting point: Castle Clinton. \nEnding Location: Ellis Island, where you can explore the museum and then ferry back to Battery Park, Manhattan.]",
      image: "/assets/imgs/statue-liberty.jpg"
    },
    {
      title: "Hudson Yards",
      description: "Learn about how this massive development came to be, what it's used for, and what it could have been— plus what you can do and eat while you're there! [Meeting point: 20 Hudson Yards, beneath the Vessel, in front of the Shops at Hudson yards. \nEnding Location: The Shed at Hudson Yards.]",
      image: "/assets/imgs/hudson-yards.jpg"
    },
    {
      title: "Greenwich Village",
      description: "Sights new and old, like Cherry Lane Theatre, Stonewall Inn, the Friends Apartment, and more! [Meeting point: Just outside Waverly Diner at 385 6th Ave, New York, NY 10014. Ending Location: 32 Morton St, New York, NY 10014.]",
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

  return (
    <div className="app-container tour-page">
      {/* Background gif */}
      <div className="background-gif">
        <img src="/assets/gifs/tour-bkg.gif" alt="Background" />
      </div>

      <Header />
      <div className="page-container">
        <div className="content-section">
          <h2 className="page-title">tour</h2>
          <div className="tour-header">
            <p className="subtitle">
              As a licensed NYC tour guide, I love showing YOU crazy stuff in a cool, non-touristy way. Take a tour, bring a camelback full of wine. I won't tell.
            </p>
          </div>

          <div className="tours-grid">
            {tours.map((tour, index) => (
              <div key={index} className="tour-item">
                <div className="tour-image">
                  <img src={tour.image} alt={tour.title} style={{ height: '400px', objectFit: 'cover' }} />
                </div>
                <div className="tour-content">
                  <h2>{tour.title}</h2>
                  <p>{tour.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="reviews-section">
            <h2>what people are saying</h2>
            <div className="review-slideshow">
              <div className="review-card">
                <p className="review-text">{reviews[currentReviewIndex].text}</p>
                <div className="review-author">
                  <span className="author-name">{reviews[currentReviewIndex].author}</span>
                  <span className="review-date">{reviews[currentReviewIndex].date}</span>
                </div>
              </div>
              <div className="review-dots">
                {reviews.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentReviewIndex(index)}
                    className={`review-dot ${index === currentReviewIndex ? 'active' : ''}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />  
    </div>
  );
}

export default TourPage; 
