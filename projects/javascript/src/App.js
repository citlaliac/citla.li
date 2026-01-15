import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { initializeTracking } from './visitor-tracking';

// Main navigation pages
import HomePage from './pages/MainPage';
import SeePage from './pages/SeePage';
import ListenPage from './pages/ListenPage';
import LaughPage from './pages/LaughPage';
import TourPage from './pages/TourPage';
import TechPage from './pages/TechPage';
import ContactPage from './pages/ContactPage';
import ScratchPage from './pages/ScratchPage';
import BookPage from './pages/BookPage';
import ShopRedirectPage from './pages/ShopRedirectPage';
import SurprisePage from './pages/SurprisePage';

// Tech section pages
import ResumePage from './pages/tech/ResumePage';
import ResumePDFPage from './pages/tech/ResumePDFPage';
import ResumeSuccessPage from './pages/tech/ResumeSuccessPage';
import GitHubPage from './pages/tech/GitHubPage';
import AIPage from './pages/tech/AIPage';
import HintGiverPage from './pages/HintGiverPage';

// Photo collection pages
import Summer2023Page from './pages/photos/Summer2023Page';
import Spring2023Page from './pages/photos/Spring2023Page';
import Spring2024Page from './pages/photos/Spring2024Page';
import PortraitPage from './pages/photos/PortraitPage';
import MoodyPage from './pages/photos/MoodyPage';
import NaturalPage from './pages/photos/NaturalPage';
import UrbanPage from './pages/photos/UrbanPage';
import EspionnerPage from './pages/photos/EspionnerPage';

//Other pages
import BirthdayPage from './pages/BirthdayPage';
import GuestbookPage from './pages/GuestBookPage';
import SignGuestBookPage from './pages/SignGuestBookPage';
import KaraokePage from './pages/KaraokePage';
import WeatherPage from './pages/WeatherPage';

import './styles.css';

function App() {
  const isMobile = window.innerWidth <= 768;

  useEffect(() => {
    // Initialize visitor tracking
    initializeTracking();
  }, []);

  return (
    <Router>
      <div className="app-container">
        <Routes>
          {/* Main navigation routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/see" element={<SeePage />} />
          <Route path="/listen" element={<ListenPage />} />
          <Route path="/laugh" element={<LaughPage />} />
          <Route path="/tour" element={<TourPage />} />
          <Route path="/tech" element={<TechPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/read" element={isMobile ? <BookPage /> : <ScratchPage />} />
          <Route path="/book" element={<BookPage />} />
          <Route path="/shop" element={<ShopRedirectPage />} />
          <Route path="/surprise" element={<SurprisePage />} />

          {/* Tech section routes */}
          <Route path="/tech/resume" element={<ResumePage />} />
          <Route path="/tech/resume-pdf" element={<ResumePDFPage />} />
          <Route path="/tech/resume-success" element={<ResumeSuccessPage />} />
          <Route path="/tech/github" element={<GitHubPage />} />
          <Route path="/tech/ai" element={<AIPage />} />
          <Route path="/hintgiver" element={<HintGiverPage />} />

          {/* Photo collection routes */}
          <Route path="/photos/summer-2023" element={<Summer2023Page />} />
          <Route path="/photos/spring-2023" element={<Spring2023Page />} />
          <Route path="/photos/spring-2024" element={<Spring2024Page />} />
          <Route path="/photos/portrait" element={<PortraitPage />} />
          <Route path="/photos/moody" element={<MoodyPage />} />
          <Route path="/photos/natural" element={<NaturalPage />} />
          <Route path="/photos/urban" element={<UrbanPage />} />
          <Route path="/photos/espionner" element={<EspionnerPage />} />

          {/* Guestbook pages */}
          <Route path="/signGuestbook" element={<SignGuestBookPage />} />
          <Route path="/guestbook" element={<GuestbookPage />} />

          {/* Other pages */}
          <Route path="/birthday" element={<BirthdayPage />} />
          <Route path="/karaoke" element={<KaraokePage />} />
          <Route path="/weather" element={<WeatherPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 