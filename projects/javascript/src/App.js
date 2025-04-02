import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import MainPage from './pages/MainPage';
import ListenPage from './pages/ListenPage';
import LaughPage from './pages/LaughPage';
import ReadPage from './pages/ReadPage';
import SeePage from './pages/SeePage';
import TechPage from './pages/TechPage';
import ShopPage from './pages/ShopPage';
import TourPage from './pages/TourPage';
import ContactPage from './pages/ContactPage';
import SurprisePage from './pages/SurprisePage';
import CollectionPage from './pages/CollectionPage';
import ResumePage from './pages/ResumePage';
import ResumeSuccessPage from './pages/ResumeSuccessPage';
import './styles.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Header />
        <div className="router-container">
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/tour" element={<TourPage />} />
            <Route path="/listen" element={<ListenPage />} />
            <Route path="/laugh" element={<LaughPage />} />
            <Route path="/read" element={<ReadPage />} />
            <Route path="/see" element={<SeePage />} />
            <Route path="/tech" element={<TechPage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/surprise" element={<SurprisePage />} />
            <Route path="/collection/:id" element={<CollectionPage />} />
            <Route path="/resume" element={<ResumePage />} />
            <Route path="/resume-success" element={<ResumeSuccessPage />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App; 