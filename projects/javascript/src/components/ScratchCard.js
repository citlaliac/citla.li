import React, { useRef, useEffect, useState } from 'react';
import '../styles/ScratchCard.css';

const ScratchCard = ({ title, content, position }) => {
  const canvasRef = useRef(null);
  const cardRef = useRef(null);
  const [isScratching, setIsScratching] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [revealPercentage, setRevealPercentage] = useState(0);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  const [totalPixels, setTotalPixels] = useState(0);
  const [scratchedPixels, setScratchedPixels] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(position);
  const [isScratchMode, setIsScratchMode] = useState(false);
  const [isScratched, setIsScratched] = useState(false);
  const [lastPoint, setLastPoint] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Create shiny gradient overlay
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');

    // Draw the scratch surface
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add shiny gradient overlay
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add light reflection
    const reflection = ctx.createRadialGradient(
      canvas.width * 0.7, canvas.height * 0.3, 0,
      canvas.width * 0.7, canvas.height * 0.3, canvas.width * 0.5
    );
    reflection.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
    reflection.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = reflection;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate total pixels for reveal percentage
    setTotalPixels(canvas.width * canvas.height);
    
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
    if (isDragging) return;
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
    if (!isScratching || isDragging) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Draw the scratch effect
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = 60;
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
    
    // If more than 30% is scratched, reveal the content
    if (percentage > 30 && !isRevealed) {
      setIsRevealed(true);
    }
  };

  const startDragging = (e) => {
    // Only start dragging if we're not in scratch mode
    if (isScratchMode) return;
    
    setIsDragging(true);
    setDragStartX(e.clientX - currentPosition.x);
    setDragStartY(e.clientY - currentPosition.y);
    
    // Bring card to front when dragging
    if (cardRef.current) {
      cardRef.current.style.zIndex = 20;
    }
  };

  const drag = (e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStartX;
    const newY = e.clientY - dragStartY;
    
    setCurrentPosition({
      ...currentPosition,
      x: newX,
      y: newY
    });
  };

  const stopDragging = () => {
    setIsDragging(false);
    
    // Reset z-index after dragging
    if (cardRef.current) {
      cardRef.current.style.zIndex = isRevealed ? 10 : 5;
    }
  };

  const toggleScratchMode = (e) => {
    e.stopPropagation();
    setIsScratchMode(!isScratchMode);
  };

  const handleMouseDown = (e) => {
    setIsScratching(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setLastPoint({ x, y });
  };

  const handleMouseMove = (e) => {
    if (!isScratching) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (lastPoint) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 60; // Increased from 20 to 60
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    setLastPoint({ x, y });

    // Check if enough has been scratched
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const scratchedPixels = Array.from(imageData.data).filter((pixel, index) => 
      index % 4 === 3 && pixel === 0
    ).length;
    const totalPixels = canvas.width * canvas.height;
    const scratchedPercentage = (scratchedPixels / totalPixels) * 100;

    if (scratchedPercentage > 30) {
      setIsScratched(true);
    }
  };

  return (
    <div 
      ref={cardRef}
      className={`scratch-card ${isDragging ? 'dragging' : ''}`}
      style={{
        transform: `translate(${currentPosition.x}px, ${currentPosition.y}px) rotate(${currentPosition.rotation}deg)`,
        zIndex: isDragging ? 20 : (isRevealed ? 10 : 5),
        cursor: isDragging ? 'grabbing' : (isScratchMode ? 'url("/assets/gifs/cursor.gif") 16 16, auto' : 'grab')
      }}
      onMouseDown={startDragging}
      onMouseMove={drag}
      onMouseUp={stopDragging}
      onMouseLeave={stopDragging}
      onTouchStart={(e) => {
        e.preventDefault();
        const touch = e.touches[0];
        startDragging(touch);
      }}
      onTouchMove={(e) => {
        e.preventDefault();
        const touch = e.touches[0];
        drag(touch);
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        stopDragging();
      }}
    >
      <div className="scratch-content">
        <h3>{title}</h3>
        <p>{content}</p>
      </div>
      <canvas
        ref={canvasRef}
        className="scratch-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopScratching}
        onMouseLeave={stopScratching}
        onTouchStart={(e) => {
          e.preventDefault();
          if (isScratchMode) {
            const touch = e.touches[0];
            startScratching(touch);
          }
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          stopScratching();
        }}
        onTouchMove={(e) => {
          e.preventDefault();
          if (isScratchMode) {
            const touch = e.touches[0];
            scratch(touch);
          }
        }}
      />
      <button 
        className="mode-toggle"
        onClick={toggleScratchMode}
        style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          background: isScratchMode ? '#4CAF50' : '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '20px',
          padding: '5px 10px',
          fontSize: '12px',
          cursor: 'pointer',
          zIndex: 4
        }}
      >
        {isScratchMode ? 'Scratching' : 'Move'}
      </button>
    </div>
  );
};

export default ScratchCard; 