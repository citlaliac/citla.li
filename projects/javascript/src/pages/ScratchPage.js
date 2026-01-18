import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ScratchCard from '../components/ScratchCard';
import '../styles/ScratchPage.css';

const ScratchPage = () => {
  const [backgroundGif, setBackgroundGif] = useState('');
  
  // useEffect(() => {
  //   // Select a random background GIF
  //   const gifs = [
  //     'hint-bkg1.gif',
  //     'hint-bkg2.gif',
  //     'hint-bkg3.gif',
  //     'hint-bkg4.gif',
  //     'hint-bkg5.gif'
  //   ];
  //   const randomGif = gifs[Math.floor(Math.random() * gifs.length)];
  //   setBackgroundGif(`/assets/gifs/hintgiverGifs/${randomGif}`);
  // }, []);

  const poems = [
    {
      title: "WINSOME WETLANDS",
      content: "Lead laced lashes limp lower\n\nLower\n\nLower\n\nLenses lided\n\nListening\n\nLoon's lowly loo lands loftily, lingering\n\nLover's lute-like laughs lavishly leaking life\n\nLush leaves lay laden\n\nLukewarm light leisurely lusters\n\nLuscious little lowlands litter lakelocked Louisiana.",
      position: { x: 500, y: 450, rotation: -4 }
    },
    {
      title: "RAY",
      content: "The water swept me into the sand!\n\nI nearly died, I really did.\n\nA rip and a rush\n\nA child pushed me back to the tides\n\nI writhed at his warm wiggling digits smushing into my smooth slimy skin\n\nI am not a play doh version of your beanie baby\n\nI am ray!\n\nYou'd think I've learned my lesson\n\nI hated every second of it\n\nBut here I am\n\nrushing ashore again.",
      position: { x: 200, y: 300, rotation: -2 }
    },
    {
      title: "SWAN",
      content: "I see your ice cream,\n\nJust out of reach of my long neck.\n\nAs you appreciate my white feathers\n\nAnd my black thieve's mask\n\nThe ice cream becomes closer?\n\nTwo great flaps and a mighty webbed step later\n\nI appreciate your ice cream.",
      position: { x: 600, y: 250, rotation: 4 }
    },
    {
      title: "TOAD",
      content: "I normally make no noise at all\n\nMy dark, rough body just barely discernible from a rock\n\nBut after the moonlight fills the sky\n\nAnd the other animals fall tranquil\n\nI think maybe\n\nI will make noise for eight hours or so\n\nMy time to shine",
      position: { x: 350, y: 400, rotation: -3 }
    },
    {
      title: "BIRD",
      content: "I drag my eyes open\n\nMy pupils adjust to the dewy light\n\n...\n\nAh\n\nI know\n\nI will start to sort of chatter\n\nAnd scream",
      position: { x: 150, y: 500, rotation: 2 }
    },
    {
      title: "CAT HAIKU ONE - CAT'S DANCE",
      content: "I do not feel good\nI wretch, writhe, paws out stretched\nDance of the hair ball",
      position: { x: 50, y: 100, rotation: -5 }
    },
    {
      title: "CAT HAIKU TWO - CAT'S VENGEANCE",
      content: "You left me alone\n\nI'm gonna piss everywhere\n\nAnd shit in the tub",
      position: { x: 400, y: 150, rotation: 3 }
    }
  ];

  return (
    <div className="scratch-page">
      <div className="background-gif">
        <img src="/assets/imgs/scratch-bkg3.png" alt="Background" />
      </div>
      <Header />
      <div className="scratch-container">
        <h1 className="scratch-page-title"><mark>Every Poem's a Winner</mark></h1>
        <div className="scratch-cards-container">
          {poems.map((poem, index) => (
            <ScratchCard
              key={index}
              title={poem.title}
              content={poem.content}
              position={poem.position}
            />
          ))}
        </div>
        <div className="scratch-instructions">
          Click cards to drag them around. Click the button to switch between moving and scratching modes to  the poems.
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ScratchPage; 