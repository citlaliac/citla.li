import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/MainPage';
import SeePage from './pages/SeePage';
import ListenPage from './pages/ListenPage';
import LaughPage from './pages/LaughPage';
import TourPage from './pages/TourPage';
import TechPage from './pages/TechPage';
import ContactPage from './pages/ContactPage';
import ScratchPage from './pages/ScratchPage';
import BookPage from './pages/BookPage';
import ResumePage from './pages/tech/ResumePage';
import ResumePDFPage from './pages/tech/ResumePDFPage';
import ResumeSuccessPage from './pages/tech/ResumeSuccessPage';
import GitHubPage from './pages/tech/GitHubPage';
import AIPage from './pages/tech/AIPage';
import ShopRedirectPage from './pages/ShopRedirectPage';
import SurprisePage from './pages/SurprisePage';
import Summer2023Page from './pages/Summer2023Page';
import Spring2023Page from './pages/Spring2023Page';
import Spring2024Page from './pages/Spring2024Page';
import PortraitPage from './pages/PortraitPage';
import MoodyPage from './pages/MoodyPage';
import NaturalPage from './pages/NaturalPage';
import UrbanPage from './pages/UrbanPage';
import EspionnerPage from './pages/EspionnerPage';
import HintGiverPage from './pages/HintGiverPage';
import './styles.css';

function App() {
  const isMobile = window.innerWidth <= 768;

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/see" element={<SeePage />} />
          <Route path="/listen" element={<ListenPage />} />
          <Route path="/laugh" element={<LaughPage />} />
          <Route path="/tour" element={<TourPage />} />
          <Route path="/tech" element={<TechPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/read" element={isMobile ? <BookPage /> : <ScratchPage />} />
          <Route path="/book" element={<BookPage />} />
          <Route path="/tech/resume" element={<ResumePage />} />
          <Route path="/tech/resume-pdf" element={<ResumePDFPage />} />
          <Route path="/tech/resume-success" element={<ResumeSuccessPage />} />
          <Route path="/tech/GitHubPage" element={<GitHubPage />} />
          <Route path="/tech/AIPage" element={<AIPage />} />
          <Route path="/shop" element={<ShopRedirectPage />} />
          <Route path="/surprise" element={<SurprisePage />} />
          <Route path="/photos/summer-2023" element={<Summer2023Page />} />
          <Route path="/photos/spring-2023" element={<Spring2023Page />} />
          <Route path="/photos/spring-2024" element={<Spring2024Page />} />
          <Route path="/photos/portrait" element={<PortraitPage />} />
          <Route path="/photos/moody" element={<MoodyPage />} />
          <Route path="/photos/natural" element={<NaturalPage />} />
          <Route path="/photos/urban" element={<UrbanPage />} />
          <Route path="/photos/espionner" element={<EspionnerPage />} />
          <Route path="/hintgiver" element={<HintGiverPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 