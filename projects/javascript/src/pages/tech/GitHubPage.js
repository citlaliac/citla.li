import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

/**
 * GitHubPage Component
 * Displays a collection of tech projects and experiments
 * Includes interactive elements and project descriptions
 */
function GitHubPage() {
  return (
    <div className="app-container">
      <div className="background-gif" >
        <img src="/assets/gifs/github-bkg.gif" alt="Background"/>
      </div>
      <Header />
      <div className="page-container">
        <div className="content-section">
          <h2>What is tech if not kinda magic?</h2>
          <p className="subtitle">what does your future hold? click to see 🔮</p>

          <div className="tech-projects-grid">
            {/* Coin-Boy Project */}
            <div className="tech-project">
              <h3>Are you a Coin-Boy?</h3>
              <p>Grab your phone and get flippy!</p>
              <a href="#" className="project-link">Try it out →</a>
            </div>

            {/* Sexist Robot Project */}
            <div className="tech-project">
              <h3>Want to make a sexist robot rewrite songs for you?</h3>
              <p>Click the link!</p>
              <a href="#" className="project-link">Try it out →</a>
            </div>

            {/* Past Lover Project */}
            <div className="tech-project">
              <h3>Tell off a past lover, give them a hint.</h3>
              <a href="#" className="project-link">Try it out →</a>
            </div>

            {/* Song Categorization Project */}
            <div className="tech-project">
              <h3>Categorize a song with Hugging Face transformers.</h3>
              <a href="#" className="project-link">Try it out →</a>
            </div>
          </div>

          <div className="github-section">
            <h3>Take a minute and click around my public Github.</h3>
            <a href="https://github.com/yourusername" target="_blank" rel="noopener noreferrer" className="github-link">
              Visit GitHub →
            </a>
          </div>

          <div className="portfolio-section">
            <h3>Check out these projects</h3>
            <p>Want to see my password protected portfolio? Assets I've created and the like? Ask for the password and then go here: ✨_portfolio_✨</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GitHubPage; 