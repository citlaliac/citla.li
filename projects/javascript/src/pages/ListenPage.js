import React, { useEffect, useState, useRef } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/ListenPage.css';

/**
 * ListenPage Component
 * Displays a collection of curated Spotify playlists with alternating layout
 * Each playlist has a description on one side and the Spotify embed on the other
 */
function ListenPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const smoothPosition = useRef({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight
      });
    };
  
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);
  
  useEffect(() => {
    const updatePosition = () => {
      smoothPosition.current.x += (mousePosition.x - smoothPosition.current.x) * 0.05; // Adjust speed here
      smoothPosition.current.y += (mousePosition.y - smoothPosition.current.y) * 0.05;
      
      requestAnimationFrame(updatePosition);
    };
  
    requestAnimationFrame(updatePosition);
  }, [mousePosition]);
  
  const backgroundStyle = {
    background: `radial-gradient(circle at ${smoothPosition.current.x * 100}% ${smoothPosition.current.y * 100}%, #1DB954 0%, #191414 100%)`,
  };

  return (
    <div className="app-container listen-page" style={backgroundStyle}>
      <Header />
      <div className="page-container">
        <div className="content-section-listen">
          <h2 className="listen-page-title">listen</h2>
          <p className="subtitle">Whether its a tropical vacation, a devastating 2005 pop culture break-up, or the back of your babysitter's minivan, these thoughtfully curated playlists <em>take you places.</em></p>
          
          <div className="playlist-container">
            {/* Babysitter's Minivan */}
            <div className="playlist-item">
              <div className="background-img">
                <img src="https://image-cdn-fa.spotifycdn.com/image/ab67706c0000da84a3f0f810b744da2a56e3cc3f" alt="Background" />
              </div>
              <div className="playlist-description">
                <h3>babysitter's minivan</h3>
                <p>Wind blowing on your wispy, oily, bangs, not a thought in your mind. <em>Stuck in the Suburbs</em> just came out and it's like it spoke directly to you. You're cruising the suburbs stuck in your babysitter's minivan, carefree.</p>
              </div>
              <div className="playlist-embed">
                <iframe 
                  title="Spotify Playlist - Citlali's Music"
                  src="https://open.spotify.com/embed/playlist/411YKYQQDCNfZDYJCau8Dm?utm_source=generator&theme=0&wmode=opaque" 
                  width="100%" 
                  height="450" 
                  frameBorder="0" 
                  allowfullscreen="" 
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                  loading="lazy">
                </iframe>
              </div>
            </div>

            {/* This is Your Brain */}
            <div className="playlist-item">
              <div className="playlist-description">
                <div className="background-img">
                  <img src="https://image-cdn-fa.spotifycdn.com/image/ab67706c0000da840830a7063d18128ddfb7fdda" alt="Background" />
                </div>
                <h3>this is your brain</h3>
                <p>This delicious, synthy, psychedelic pop envelops you like a thick haze. Let these sizzling tunes pan across your brain— no consumables needed. Any questions?</p>
              </div>
              <div className="playlist-embed">
                <iframe 
                  src="https://open.spotify.com/embed/playlist/79TOiozjmQsu0kl7XOewzH?utm_source=generator&theme=0&wmode=opaque" 
                  width="100%" 
                  height="450" 
                  frameBorder="0" 
                  allowfullscreen="" 
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                  loading="lazy"
                  title="Spotify Playlist: The Citlali Experience">
                </iframe>
              </div>
            </div>

            {/* Brad and Jen Breakup Mix */}
            <div className="playlist-item">
              <div className="playlist-description">
                <div className="background-img">
                  <img src="https://image-cdn-fa.spotifycdn.com/image/ab67706c0000da849f042558f20731eef40d4636" alt="Background" />
                </div>
                <h3>brad and jen breakup mix</h3>
                <p>Did you have a break up in 2005? Now you've got the playlist to imagine you did. There's no love hangover Michelle Branch and Dido can't get us through. Pity yourself and get drunk on your own sadness.</p>
              </div>
              <div className="playlist-embed">
                <iframe 
                  src="https://open.spotify.com/embed/playlist/0gGJjuKVQXgEVGg64MrZJ6?utm_source=generator&theme=0&wmode=opaque"
                  width="100%" 
                  height="450" 
                  frameBorder="0" 
                  allowfullscreen="" 
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                  loading="lazy"
                  title="Spotify Playlist: Brad and Jen Breakup Mix">
                </iframe>
              </div>
            </div>

            {/* Bus Radio */}
            <div className="playlist-item">
              <div className="playlist-description">
                <div className="background-img">
                  <img src="https://image-cdn-fa.spotifycdn.com/image/ab67706c0000da84351e505b99e7ce895188a9c6" alt="Background" />
                </div>
                <h3>bus radio</h3>
                <p>The hot, humid, metallic stink of other kids fills your snotty nose. You're not even in 6th grade, but your sciatica aches from your heavy book bag. Time to stare out the window and disassociate to the inspired sounds of Bus Radio™️.</p>
              </div>
              <div className="playlist-embed">
                <iframe 
                  src="https://open.spotify.com/embed/playlist/3yBLMnfKUWHxz5YwsoiN9N?utm_source=generator&theme=0&wmode=opaque" 
                  width="100%" 
                  height="450" 
                  frameBorder="0" 
                  allowfullscreen="" 
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                  loading="lazy"
                  title="Spotify Playlist: Bus Radio">
                </iframe>
              </div>
            </div>

            {/* Saccharine */}
            <div className="playlist-item">
              <div className="playlist-description">
                <div className="background-img">
                  <img src="https://image-cdn-ak.spotifycdn.com/image/ab67706c0000da84e4b1c523ee4bad5b86778c3f" alt="Background" />
                </div>
                <h3>saccharine</h3>
                <p>I's a sunny spring day. It's almost sickeningly sweet. It's saccharine and it's rotting your teeth. But you can't stop listening to these mellow, poppy tunes and dreaming of sitting poolside, watermelon aguafresca in hand, a lover's text pinging your phone. Indulge.</p>
              </div>
              <div className="playlist-embed">
                <iframe 
                  src="https://open.spotify.com/embed/playlist/0XSLVKIizEHbpLvVudF7bw?utm_source=generator&theme=0&wmode=opaque"
                  width="100%" 
                  height="450" 
                  frameBorder="0" 
                  allowfullscreen="" 
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                  loading="lazy"
                  title="Spotify Playlist: Saccharine">
                </iframe>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default ListenPage; 