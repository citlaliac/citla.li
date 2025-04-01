///////////////////////
// Welcome to Cursor //
///////////////////////

/*
Step 1: Try generating a react component that lets you play tictactoe with Cmd+K or Ctrl+K on a new line.
  - Then integrate it into the code below and run with npm start

Step 2: Try highlighting all the code with your mouse, then hit Cmd+k or Ctrl+K. 
  - Instruct it to change the game in some way (e.g. add inline styles, add a start screen, make it 4x4 instead of 3x3)

Step 3: Hit Cmd+L or Ctrl+L and ask the chat what the code does

Step 4: To try out cursor on your own projects, go to the file menu (top left) and open a folder.
*/


import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import './styles.css';

// Main page component
function MainPage() {
  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        <div className="title-section">
          <h1 className="main-title">Hi, I'm Citlali</h1>
          <p className="welcome-text">Welcome to my website. Click around and get to know me.</p>
        </div>
        <div className="icon-grid">
          <Link to="/listen" className="icon-item">
            <div className="icon-wrapper">
              <img src="/assets/gifs/listen.gif" alt="Listen" />
            </div>
            <span>LISTEN</span>
          </Link>
          <Link to="/laugh" className="icon-item">
            <div className="icon-wrapper">
              <img src="/assets/gifs/laugh.gif" alt="Laugh" />
            </div>
            <span>LAUGH</span>
          </Link>
          <Link to="/read" className="icon-item">
            <div className="icon-wrapper">
              <img src="/assets/gifs/read.gif" alt="Read" />
            </div>
            <span>READ</span>
          </Link>
          <Link to="/see" className="icon-item">
            <div className="icon-wrapper">
              <img src="/assets/gifs/see.gif" alt="See" />
            </div>
            <span>SEE</span>
          </Link>
          <Link to="/tech" className="icon-item">
            <div className="icon-wrapper">
              <img src="/assets/gifs/tech.gif" alt="Tech" />
            </div>
            <span>TECH</span>
          </Link>
          <Link to="/shop" className="icon-item">
            <div className="icon-wrapper">
              <img src="/assets/gifs/shop.gif" alt="Shop" />
            </div>
            <span>SHOP</span>
          </Link>
          <Link to="/tour" className="icon-item">
            <div className="icon-wrapper">
              <img src="/assets/gifs/tour.gif" alt="Tour" />
            </div>
            <span>TOUR</span>
          </Link>
          <Link to="/surprise" className="icon-item">
            <div className="icon-wrapper">
              <img src="/assets/gifs/surprise.gif" alt="Surprise" />
            </div>
            <span>SURPRISE ME</span>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// Placeholder pages
function ListenPage() {
  return (
    <div className="app-container">
      <Header />
      <div className="page-container">Listen Page</div>
      <Footer />
    </div>
  );
}

function LaughPage() {
  return (
    <div className="app-container">
      <Header />
      <div className="page-container">Laugh Page</div>
      <Footer />
    </div>
  );
}

function ReadPage() {
  return (
    <div className="app-container">
      <Header />
      <div className="page-container">Read Page</div>
      <Footer />
    </div>
  );
}

function SeePage() {
  return (
    <div className="app-container">
      <Header />
      <div className="page-container">See Page</div>
      <Footer />
    </div>
  );
}

function TechPage() {
  return (
    <div className="app-container">
      <Header />
      <div className="page-container">Tech Page</div>
      <Footer />
    </div>
  );
}

function ShopPage() {
  return (
    <div className="app-container">
      <Header />
      <div className="page-container">Shop Page</div>
      <Footer />
    </div>
  );
}

function TourPage() {
  return (
    <div className="app-container">
      <Header />
      <div className="page-container">Tour Page</div>
      <Footer />
    </div>
  );
}

function SurprisePage() {
  return (
    <div className="app-container">
      <Header />
      <div className="page-container">Surprise Page</div>
      <Footer />
    </div>
  );
}

function ContactPage() {
  return (
    <div className="app-container">
      <Header />
      <div className="page-container">Contact Page</div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/listen" element={<ListenPage />} />
        <Route path="/laugh" element={<LaughPage />} />
        <Route path="/read" element={<ReadPage />} />
        <Route path="/see" element={<SeePage />} />
        <Route path="/tech" element={<TechPage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/tour" element={<TourPage />} />
        <Route path="/surprise" element={<SurprisePage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Routes>
    </Router>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);