import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

/**
 * AIPage Component
 * Displays information about Trust & Safety and Ethical AI work
 * Includes sections for harmful and healthy behaviors
 */
function AIPage() {
  return (
    <div className="app-container">
      <Header />
      <div className="page-container">
        <div className="content-section">
          <h2>Trust & Safety & Ethical AI</h2>
          
          <div className="ai-intro">
            <p>Through leading workshops with heads of T&S departments <em>and</em> their end-user moderators I've come to understand the particularly demanding challenges that go into thoughtful moderation. I know what world-class T&S teams do right; what guiding principles and tools help their brands, communities, and moderators stay safe. To my absolute pleasure, I've been able to consult these teams and design solutions with them, leveraging AI tools, analytics dashboards, and moderation queue systems that make their workflows safer, and more effective.</p>
            
            <p>Through my work I've learned how many behaviors, harmful and healthy, manifest online and worked with T&S researchers and policy owners to create the most thoughtful ways to take action on them. Content moderation is brutal <em>and</em> delicate, and each platform deserves a nuanced approach that fits their community. It is critical to strive to provide T&S that does not create more pain for users, or further harm already marginalized groups. When this balance is achieved you'll quickly see a value, retention, and revenue return on your investment.</p>
            
            <p>By labeling data, working with researchers, and creating solutions that support identifying, taking-action on, and appealing at both the content and user level, I've gained expertise in creating moderation strategies for the areas below. I am also able to help as a guide for identifying, reporting, and storing content to comply with the EU Digital Services Act (DSA).</p>
          </div>

          <div className="behaviors-section">
            <h3>Click to explore common behaviors</h3>
            
            <div className="behaviors-grid">
              <div className="behaviors-column">
                <h4>Harmful</h4>
                <ul>
                  <li>Hate speech</li>
                  <li>Insulting and bullying content</li>
                  <li>Profanity</li>
                  <li>Spam</li>
                  <li>Sexual content</li>
                  <li>Solicitation of sex and drugs</li>
                  <li>Radicalization and white supremacy</li>
                  <li>Threats and physical violence</li>
                  <li>Child grooming</li>
                  <li>CSAM discussion</li>
                  <li>Violent misogyny</li>
                </ul>
              </div>

              <div className="behaviors-column">
                <h4>Healthy</h4>
                <ul>
                  <li>Teaching</li>
                  <li>Encourage</li>
                  <li>Invite and acknowledge</li>
                  <li>Friendship</li>
                  <li>Trust</li>
                  <li>Rapport building</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="ai-conclusion">
            <p>A former Solution Engineer at a Trust and Safety vendor, I've had the unique opportunity to see into what are generally "locked" rooms. I've worked with prospective customers in gaming, dating, e-commerce, and social media to learn their T&S workflows and help them improve their ability to protect their communities. If you'd like to learn more about T&S or contact me about T&S consulting and best practices, please contact me.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIPage; 