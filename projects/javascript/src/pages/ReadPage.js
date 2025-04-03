import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ScratchCard from '../components/ScratchCard';
import '../styles/ReadPage.css';

const ReadPage = () => {
  const poems = [
    {
      title: "The Lowlands",
      text: "In the lowlands where shadows play,\nWhere misty mornings drift away,\nThe earth is soft, the air is sweet,\nWhere nature's heart and soul meet.\n\nThrough marshes green and fields of gold,\nStories of old are gently told,\nBy rustling reeds and whispering trees,\nCarried on the evening breeze.",
      position: { x: 5, y: 15, rotation: -8 }
    },
    {
      title: "The Fox",
      text: "Swift and cunning, the fox appears,\nThrough the brush, it disappears,\nA flash of red in morning light,\nThen gone again, out of sight.\n\nIts eyes are bright, its mind is sharp,\nIn the forest, it leaves its mark,\nA creature wild, yet somehow wise,\nThat sees through nature's thin disguise.",
      position: { x: 25, y: 45, rotation: 12 }
    },
    {
      title: "The Owl",
      text: "In the darkness of the night,\nThe owl takes its silent flight,\nWith eyes that pierce the blackest sky,\nIt watches as the world goes by.\n\nA guardian of ancient trees,\nIt sees what others cannot see,\nIts wisdom spans the ages past,\nA knowledge that will always last.",
      position: { x: 65, y: 25, rotation: -15 }
    },
    {
      title: "The River",
      text: "The river flows with endless grace,\nThrough valleys, forests, open space,\nIts waters tell a thousand tales,\nOf journeys through the hills and dales.\n\nIt carries secrets from the source,\nFollowing its winding course,\nUntil it reaches distant seas,\nWhere stories drift on evening breeze.",
      position: { x: 85, y: 65, rotation: 7 }
    },
    {
      title: "The Deer",
      text: "In dappled light beneath the trees,\nThe deer moves with practiced ease,\nIts ears alert, its eyes so wide,\nAs it grazes with quiet pride.\n\nA creature of the forest deep,\nWhere shadows dance and secrets keep,\nIt knows the paths that others miss,\nThrough nature's wild, untamed bliss.",
      position: { x: 15, y: 85, rotation: -5 }
    },
    {
      title: "The Lowlands at Dawn",
      text: "As morning breaks across the land,\nThe lowlands stretch, a golden band,\nOf light that filters through the mist,\nWhere nature's beauty can't be missed.\n\nBirds awaken with joyful song,\nAs the day begins to dawn,\nThe lowlands come alive with light,\nA magical, wondrous sight.",
      position: { x: 45, y: 105, rotation: 10 }
    },
    {
      title: "The Badger",
      text: "In the earth, the badger digs,\nThrough soil, roots, and ancient twigs,\nCreating tunnels deep below,\nWhere secrets of the earth it knows.\n\nA creature of the night and dark,\nIt leaves its mark upon the bark,\nOf trees that stand in silent watch,\nAs the badger comes and goes, non-stop.",
      position: { x: 75, y: 125, rotation: -12 }
    },
    {
      title: "The Lowlands in Autumn",
      text: "When autumn comes to the lowlands fair,\nThe colors change in the crisp air,\nFrom green to gold, from gold to red,\nAs summer's warmth begins to shed.\n\nThe lowlands wear a different face,\nAs autumn brings its gentle grace,\nA time of change, a time of rest,\nBefore the winter's cold request.",
      position: { x: 105, y: 145, rotation: 8 }
    },
    {
      title: "The Hawk",
      text: "High above the lowlands wide,\nThe hawk soars with graceful pride,\nIts wings outstretched against the sky,\nAs it watches from on high.\n\nWith eyes that see what others miss,\nIt glides through air with practiced bliss,\nA master of the open air,\nThat knows no boundaries, no despair.",
      position: { x: 135, y: 165, rotation: -7 }
    },
    {
      title: "The Lowlands at Dusk",
      text: "As evening falls across the land,\nThe lowlands take a different stand,\nShadows lengthen, colors fade,\nAs night begins its gentle raid.\n\nThe lowlands whisper ancient songs,\nAs darkness slowly comes along,\nUntil the stars begin to shine,\nAnd moonlight makes the lowlands mine.",
      position: { x: 165, y: 185, rotation: 5 }
    }
  ];

  return (
    <div className="read-page">
      <Header />
      <div className="read-container">
        <h1 className="page-title">Read</h1>
        <div className="scratch-cards-container">
          {poems.map((poem, index) => (
            <ScratchCard
              key={index}
              title={poem.title}
              content={poem.text}
              position={poem.position}
            />
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ReadPage; 