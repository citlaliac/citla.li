import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/Book.css';

const Book = () => {
  const [selectedBook, setSelectedBook] = useState(null);

  const poems = [
    {
        title: "CAT HAIKU 1: CAT'S DANCE",
        author: "Catlali",
        content: `I do not feel good
  I wretch, writhe, paws out stretched
  Dance of the hair ball`
      },
      {
        title: "CAT HAIKU 2: CAT'S VENGEANCE",
        author: "Catlali",
        content: `You left me alone
  
  I'm gonna piss everywhere
  
  And shit in the tub`
      },
    {
      title: "WINSOME WETLANDS",
      author: "Dr. Citlali, PhD (Wetland Studies)",
      content: `Lead laced lashes limp lower

Lower

Lower

Lenses lided

Listening

Loon's lowly loo lands loftily, lingering

Lover's lute-like laughs lavishly leaking life

Lush leaves lay laden

Lukewarm light leisurely lusters

Luscious little lowlands litter lakelocked Louisiana.`
    },
    {
      title: "RAY",
      author: "Citlali, Esq. (Marine Law)",
      content: `The water swept me into the sand!

I nearly died, I really did.

A rip and a rush

A child pushed me back to the tides

I writhed at his warm wiggling digits smushing into my smooth slimy skin

I am not a play doh version of your beanie baby

I am ray!

You'd think I've learned my lesson

I hated every second of it

But here I am

rushing ashore again.`
    },
    {
      title: "SWAN",
      author: "Citswani",
      content: `I see your ice cream,

Just out of reach of my long neck.

As you appreciate my white feathers

And my black thieve's mask

The ice cream becomes closer?

Two great flaps and a mighty webbed step later

I appreciate your ice cream.`
    },
    {
      title: "TOAD",
      author: "Citlali, Esquire",
      content: `I normally make no noise at all

My dark, rough body just barely discernible from a rock

But after the moonlight fills the sky

And the other animals fall tranquil

I think maybe

I will make noise for eight hours or so

My time to shine`
    },
    {
      title: "BIRD",
      author: "Citlali, Bird Attorney",
      content: `I drag my eyes open

My pupils adjust to the dewy light

...

Ah

I know

I will start to sort of chatter

And scream`
    }
  ];

  const handleBookClick = (index) => {
    setSelectedBook(index);
  };

  const handleClosePoem = () => {
    setSelectedBook(null);
  };

  return (
    <div className="book-container">
      <div className="background-gif">
        <img src="/assets/imgs/book-bkg.jpg" alt="Background" />
      </div>
      <Header />
      <div className="bookshelf">
      <div className="background-gif">
        <img src="/assets/imgs/book-bkg.jpg" alt="Background" />
      </div>
        <div className="bookshelf-title"><mark>Poetry Collection</mark></div>
        <div className="instructions">Click a book to read</div>
        <div className="books">
          {poems.map((poem, index) => (
            <div 
              key={index} 
              className="book-item"
              onClick={() => handleBookClick(index)}
            >
              <div className="book-cover">
                <div className="book-title">{poem.title}</div>
                <div className="book-author">{poem.author}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedBook !== null && (
        <div className="poem-overlay" onClick={handleClosePoem}>
          <div className="poem-content" onClick={e => e.stopPropagation()}>
            <h2>{poems[selectedBook].title}</h2>
            <h3>{poems[selectedBook].author}</h3>
            <div className="poem-text">
              {poems[selectedBook].content.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
            <button className="close-button" onClick={handleClosePoem}>×</button>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default Book; 