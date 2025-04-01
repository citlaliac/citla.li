import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

function TourPage() {
  return (
    <div className="app-container">
      <Header />
      <div className="page-container">
        <div className="content-section">
          <h2>Tour Dates</h2>
          <div className="tour-dates">
            <div className="tour-date">
              <div className="tour-info">
                <h3>City Name</h3>
                <p>Venue Name</p>
                <p>Date and Time</p>
              </div>
              <button className="submit-button">Get Tickets</button>
            </div>
            <div className="tour-date">
              <div className="tour-info">
                <h3>City Name</h3>
                <p>Venue Name</p>
                <p>Date and Time</p>
              </div>
              <button className="submit-button">Get Tickets</button>
            </div>
            <div className="tour-date">
              <div className="tour-info">
                <h3>City Name</h3>
                <p>Venue Name</p>
                <p>Date and Time</p>
              </div>
              <button className="submit-button">Get Tickets</button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default TourPage; 