import React, { useState, useEffect } from 'react';
import '../../styles/tech/AIPage.css';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

/**
 * AIPage Component
 * Displays information about Trust & Safety and Ethical AI work
 * Includes sections for harmful and healthy behaviors
 */
const AIPage = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="ai-page">
      <div 
        className="flashlight"
        style={{
          left: mousePosition.x,
          top: mousePosition.y,
          transform: 'translate(-50%, -50%)'
        }}
      />
      <div className="content">
        <Header />
        <h1 className="page-title">What is AI?</h1>
        <div className="ai-text">
        <h6 >A Solution Engineer at a Trust and Safety vendor, I’ve had the unique opportunity to see into what are generally “locked” rooms. Use the flashlight to illuminate some of what I've learned.</h6>
        </div>
        <div className="ai-text">
          <p>Through leading workshop with heads of T&S departments and end-user moderators at gaming, dating, e-commerce, and social media I've gotten to understand the particularly demanding challenges that go into thoughtful moderation. Understaning your tools, your community, and you moderators T&S workflows is the first step toward solutioning a way improve your ability  to protect their community. I know what world-class T&S teams do right; what guiding principles and tools help their brands, communities, and moderators stay safe. To my absolute pleasure, I’ve been able to consult these teams and design solutions with them, leveraging AI tools, analytics dashboards, and moderation queue systems that make their workflows safer, and more effective.

Through my work I’ve learned how behaviors, both harmful and healthy, manifest online and I've worked with T&S researchers and policy owners to create the meaningful ways to take action on them. Content moderation is brutal and delicate, and each platform deserves a nuanced approach that fits their community. It is critical to strive to provide T&S that does not create more pain for users, or further harm already marginalized groups. When this balance is achieved you’ll quickly see a value, retention, and revenue return on your investment. 

By labeling data, working with researchers, and creating solutions that support identifying, taking-action on, and appealing at both the content and user level, I’ve gained expertise in creating moderation strategies for the areas below. I am also able to help as a guide for identifying, reporting, and storing content to comply with the EU Digital Services Act (DSA). </p>    
         </div>
         <h6>If you’d like to learn more about T&S or contact me about T&S consulting for a moderation walk through and best practices, please contact me.</h6>
      </div>
      <Footer />
    </div>
  );
};

export default AIPage; 