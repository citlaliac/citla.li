import React, { useRef, useEffect, useState } from 'react';

const ScratchCard = ({ title, content, position }) => {
  const canvasRef = useRef(null);
  const [isScratching, setIsScratching] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [revealPercentage, setRevealPercentage] = useState(0);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  const [totalPixels, setTotalPixels] = useState(0);
  const [scratchedPixels, setScratchedPixels] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Calculate total pixels for reveal percentage
    setTotalPixels(canvas.width * canvas.height);
    
    // Draw the scratch layer
    ctx.fillStyle = '#888888';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add some texture to the scratch layer
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 2 + 1;
      const opacity = Math.random() * 0.5 + 0.5;
      
      ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Add "Scratch to reveal" text
    ctx.font = '16px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Scratch to reveal', canvas.width / 2, canvas.height / 2);
    
    return () => {
      // Cleanup if needed
    };
  }, []);

  const startScratching = (e) => {
    setIsScratching(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setLastX(x);
    setLastY(y);
    scratch(e);
  };

  const stopScratching = () => {
    setIsScratching(false);
  };

  const scratch = (e) => {
    if (!isScratching) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Draw the scratch effect
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = 30;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    
    // Update last position
    setLastX(x);
    setLastY(y);
    
    // Calculate reveal percentage
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let scratched = 0;
    
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] === 0) { // Check alpha channel
        scratched++;
      }
    }
    
    setScratchedPixels(scratched);
    const percentage = (scratched / totalPixels) * 100;
    setRevealPercentage(percentage);
    
    // If more than 50% is scratched, reveal the content
    if (percentage > 50 && !isRevealed) {
      setIsRevealed(true);
    }
  };

  return (
    <div 
      className="scratch-card"
      style={{
        transform: `translate(${position.x}px, ${position.y}px) rotate(${position.rotation}deg)`,
        zIndex: isRevealed ? 10 : 5
      }}
    >
      <div className="scratch-content">
        <h3>{title}</h3>
        <p>{content}</p>
      </div>
      <canvas
        ref={canvasRef}
        className="scratch-canvas"
        onMouseDown={startScratching}
        onMouseUp={stopScratching}
        onMouseLeave={stopScratching}
        onMouseMove={scratch}
        onTouchStart={(e) => {
          e.preventDefault();
          const touch = e.touches[0];
          startScratching(touch);
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          stopScratching();
        }}
        onTouchMove={(e) => {
          e.preventDefault();
          const touch = e.touches[0];
          scratch(touch);
        }}
      />
    </div>
  );
};

export default ScratchCard; 