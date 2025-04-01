import React from 'react';
import { Link } from 'react-router-dom';

function Header() {
  return (
    <header className="header">
      <div className="header-nav">
        <Link to="/" className="nav-icon">
          <div className="icon-wrapper small">
            <img src="/assets/gifs/home.gif" alt="Home" />
          </div>
        </Link>
        <Link to="/contact" className="nav-icon">
          <div className="icon-wrapper small">
            <img src="/assets/gifs/contact.gif" alt="Contact" />
          </div>
        </Link>
      </div>
    </header>
  );
}

export default Header; 