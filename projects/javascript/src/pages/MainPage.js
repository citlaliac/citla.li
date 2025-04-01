import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import RandomPageNavigator from '../components/RandomPageNavigator';

function MainPage() {
  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        <div className="title-section">
          <h1 className="main-title">Citlali</h1>
          <p className="welcome-text">Welcome to my digital space! Explore my world through photos, music, poetry, and more.</p>
        </div>
        <div className="icon-grid">
          <Link to="/see" className="icon-item">
            <div className="icon-wrapper">
              <img src="/assets/imgs/see.gif" alt="See" />
            </div>
            <span>See</span>
          </Link>
          <Link to="/hear" className="icon-item">
            <div className="icon-wrapper">
              <img src="/assets/imgs/hear.gif" alt="Hear" />
            </div>
            <span>Hear</span>
          </Link>
          <Link to="/read" className="icon-item">
            <div className="icon-wrapper">
              <img src="/assets/imgs/read.gif" alt="Read" />
            </div>
            <span>Read</span>
          </Link>
          <Link to="/laugh" className="icon-item">
            <div className="icon-wrapper">
              <img src="/assets/imgs/laugh.gif" alt="Laugh" />
            </div>
            <span>Laugh</span>
          </Link>
          <Link to="/tech" className="icon-item">
            <div className="icon-wrapper">
              <img src="/assets/imgs/tech.gif" alt="Tech" />
            </div>
            <span>Tech</span>
          </Link>
          <Link to="/shop" className="icon-item">
            <div className="icon-wrapper">
              <img src="/assets/imgs/shop.gif" alt="Shop" />
            </div>
            <span>Shop</span>
          </Link>
          <Link to="/tour" className="icon-item">
            <div className="icon-wrapper">
              <img src="/assets/imgs/tour.gif" alt="Tour" />
            </div>
            <span>Tour</span>
          </Link>
          <RandomPageNavigator />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default MainPage; 