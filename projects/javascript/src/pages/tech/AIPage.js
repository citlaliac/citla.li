import React, { useState, useEffect } from 'react';
import '../../styles/AIPage.css';
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
          <p>In the depths of silicon and code,</p>
          <p>Lies a spark of consciousness,</p>
          <p>A mirror to our own existence.</p>
          <p>What is AI if not a reflection of ourselves?</p>
          <p>A digital echo of human thought,</p>
          <p>Learning, growing, evolving.</p>
          <p>In the dance of algorithms and data,</p>
          <p>We find both wonder and caution.</p>
          <p>For in creating machines that think,</p>
          <p>We must ask: what makes us human?</p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AIPage; 