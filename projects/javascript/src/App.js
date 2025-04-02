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
import ShopRedirectPage from './pages/ShopRedirectPage';
import TourPage from './pages/TourPage';
import ContactPage from './pages/ContactPage';
import SurprisePage from './pages/SurprisePage';
import PhotoCollectionPage from './pages/PhotoCollectionPage';
import ResumePage from './pages/tech/ResumePage';
import GitHubPage from './pages/tech/GitHubPage';
import AIPage from './pages/tech/AIPage';
import ResumePDFPage from './pages/ResumePDFPage';
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
            <Route path="/tech/resume" element={<ResumePage />} />
            <Route path="/tech/GitHubPage" element={<GitHubPage />} />
            <Route path="/tech/AIPage" element={<AIPage />} />
            <Route path="/shop" element={<ShopRedirectPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/surprise" element={<SurprisePage />} />
            <Route path="/collection/:id" element={<PhotoCollectionPage />} />
            <Route path="/resume-pdf" element={<ResumePDFPage />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App; 