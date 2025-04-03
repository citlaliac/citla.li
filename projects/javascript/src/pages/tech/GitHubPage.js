import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import '../../styles/GitHubPage.css';

/**
 * GitHubPage Component
 * Displays a collection of tech projects and experiments
 * Includes interactive elements and project descriptions
 */
const GitHubPage = () => {
  return (
    <div className="github-page">
      <Header />
      <div className="terminal-container">
        <div className="terminal-header">
          <h1 className="terminal-title">Tech Stuff</h1>
          <div className="terminal-controls">
            <button className="terminal-button close"></button>
            <button className="terminal-button minimize"></button>
            <button className="terminal-button maximize"></button>
          </div>
        </div>
        <div className="terminal-content">
          <div className="terminal-line">
            <span className="terminal-prompt">$</span>
            <span className="terminal-command">cat README.md</span>
          </div>
          <div className="terminal-line terminal-output">
            What is tech if not kinda magic?
          </div>
          
          <div className="terminal-section">
            <div className="terminal-section-title">Projects</div>
            <div className="terminal-line">
              <span className="terminal-prompt">$</span>
              <span className="terminal-command">ls ~/projects</span>
            </div>
            <div className="terminal-line terminal-output">
              <a href="https://github.com/citlaliac" target="_blank" rel="noopener noreferrer" className="terminal-link">
                github.com/citlali
              </a>
            </div>
            <div className="terminal-line terminal-output">
              • Coin-Boy: Grab your phone and <a href="https://github.com/citlaliac/coin-boys" target="_blank">get flippy!</a>
              <br />
              • Want to make a sexist robot rewrite songs for you? <a href="https://github.com/citlaliac/sexist-robot" target="_blank">Click this link!</a>
              <br />
              • Tell off a past lover, <a href="https://www.citla.li/hintgiver" target="_blank">Give them a hint.</a>. 
              <br />
              • <a href="https://github.com/citlaliac/song-classifier" target="_blank">Categorize</a> a song with Hugging Face transformers.
            </div>
          </div>

          <div className="terminal-section">
            <div className="terminal-section-title">Portfolio</div>
            <div className="terminal-line">
              <span className="terminal-prompt">$</span>
              <span className="terminal-command">cat portfolio/README.md</span>
            </div>
            <div className="terminal-line terminal-output">
              Want to see my password protected portfolio? Assets I've created and the like?
              <br />
              Ask for the password and then go here: ✨_portfolio_✨
            </div>
          </div>

          <div className="terminal-line">
            <span className="terminal-prompt">$</span>
            <span className="terminal-command"></span>
            <span className="cursor"></span>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default GitHubPage; 