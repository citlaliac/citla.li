import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/Header.css';

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const isMainPage = location.pathname === '/';
  const isPhotoPage = location.pathname.startsWith('/photos/');

  const handleBack = (e) => {
    e.preventDefault();
    if (isPhotoPage) {
      navigate('/see');
    } else {
      // Get the parent path by removing the last segment
      const parentPath = location.pathname.split('/').slice(0, -1).join('/') || '/';
      navigate(parentPath);
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        {!isMainPage && (
          <a href="/" className="nav-icon" style={{ alignItems: 'left' }} onClick={handleBack}>
            <div className=".back-button img">
              <img src="/assets/gifs/back_dog.gif" alt="Back" />
            </div>
            <span>BACK</span>
          </a>
        )}
      </div>
      <nav className="header-nav">
        <a href="/" className="nav-icon">
          <div className="icon-wrapper small">
            <img src="/assets/gifs/home.gif" alt="Home" />
          </div>
          <span>HOME</span>
        </a>
        <a href="/contact" className="nav-icon">
          <div className="icon-wrapper small">
            <img src="/assets/gifs/contact.gif" alt="Contact" />
          </div>
          <span>CONTACT</span>
        </a>
      </nav>
    </header>
  );
}

export default Header; 