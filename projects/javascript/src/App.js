import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ListenPage from './pages/ListenPage';
import LaughPage from './pages/LaughPage';
import ReadPage from './pages/ReadPage';
import SeePage from './pages/SeePage';
import TechPage from './pages/TechPage';
import ShopPage from './pages/ShopPage';
import TourPage from './pages/TourPage';
import SurprisePage from './pages/SurprisePage';
import ContactPage from './pages/ContactPage';
import PhotoCollectionPage from './pages/PhotoCollectionPage';
import GitHubPage from './pages/tech/GitHubPage';
import AIPage from './pages/tech/AIPage';
import ResumePage from './pages/tech/ResumePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/listen" element={<ListenPage />} />
        <Route path="/laugh" element={<LaughPage />} />
        <Route path="/read" element={<ReadPage />} />
        <Route path="/see" element={<SeePage />} />
        <Route path="/tech" element={<TechPage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/tour" element={<TourPage />} />
        <Route path="/surprise" element={<SurprisePage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/collection/:collectionName" element={<PhotoCollectionPage />} />
        <Route path="/tech/github" element={<GitHubPage />} />
        <Route path="/tech/ai" element={<AIPage />} />
        <Route path="/tech/resume" element={<ResumePage />} />
      </Routes>
    </Router>
  );
}

export default App; 