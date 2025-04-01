import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

function ReadPage() {
  const [expandedSection, setExpandedSection] = React.useState(null);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="app-container">
      <Header />
      <div className="read-container">
        <h2>My Poetry</h2>
        <p className="subtitle">A collection of my thoughts and feelings</p>
        
        <div className="poetry-section">
          <h3>Screaming and Chatter Collection</h3>
          <div className="poem-item">
            <div className="poem-header" onClick={() => toggleSection('cat-haiku-1')}>
              <h4>Cat Haiku One - Cat's Dance</h4>
              <span className="expand-icon">{expandedSection === 'cat-haiku-1' ? '−' : '+'}</span>
            </div>
            {expandedSection === 'cat-haiku-1' && (
              <div className="poem-content">
                <p>I do not feel good</p>
                <p>I wretch, writhe, paws out stretched</p>
                <p>Dance of the hair ball</p>
              </div>
            )}
          </div>

          <div className="poem-item">
            <div className="poem-header" onClick={() => toggleSection('cat-haiku-2')}>
              <h4>Cat Haiku Two - Cat's Vengeance</h4>
              <span className="expand-icon">{expandedSection === 'cat-haiku-2' ? '−' : '+'}</span>
            </div>
            {expandedSection === 'cat-haiku-2' && (
              <div className="poem-content">
                <p>You left me alone</p>
                <p>I'm gonna piss everywhere</p>
                <p>And shit in the tub</p>
              </div>
            )}
          </div>

          <div className="poem-item">
            <div className="poem-header" onClick={() => toggleSection('ray')}>
              <h4>Ray</h4>
              <span className="expand-icon">{expandedSection === 'ray' ? '−' : '+'}</span>
            </div>
            {expandedSection === 'ray' && (
              <div className="poem-content">
                <p>The water swept me into the sand!</p>
                <p>I nearly died, I really did.</p>
                <p>A rip and a rush</p>
                <p>A child pushed me back to the tides</p>
                <p>I writhed at his warm wiggling digits smushing into my smooth slimy skin</p>
                <p>I am not a play doh version of your beanie baby</p>
                <p>I am ray!</p>
                <p>You'd think I've learned my lesson</p>
                <p>I hated every second of it</p>
                <p>But here I am</p>
                <p>rushing ashore again.</p>
              </div>
            )}
          </div>

          <div className="poem-item">
            <div className="poem-header" onClick={() => toggleSection('swan')}>
              <h4>Swan</h4>
              <span className="expand-icon">{expandedSection === 'swan' ? '−' : '+'}</span>
            </div>
            {expandedSection === 'swan' && (
              <div className="poem-content">
                <p>I see your ice cream,</p>
                <p>Just out of reach of my long neck.</p>
                <p>As you appreciate my white feathers</p>
                <p>And my black thieve's mask</p>
                <p>The ice cream becomes closer?</p>
                <p>Two great flaps and a mighty webbed step later</p>
                <p>I appreciate your ice cream.</p>
              </div>
            )}
          </div>

          <div className="poem-item">
            <div className="poem-header" onClick={() => toggleSection('toad')}>
              <h4>Toad</h4>
              <span className="expand-icon">{expandedSection === 'toad' ? '−' : '+'}</span>
            </div>
            {expandedSection === 'toad' && (
              <div className="poem-content">
                <p>I normally make no noise at all</p>
                <p>My dark, rough body just barely discernible from a rock</p>
                <p>But after the moonlight fills the sky</p>
                <p>And the other animals fall tranquil</p>
                <p>I think maybe</p>
                <p>I will make noise for eight hours or so</p>
                <p>My time to shine</p>
              </div>
            )}
          </div>

          <div className="poem-item">
            <div className="poem-header" onClick={() => toggleSection('bird')}>
              <h4>Bird</h4>
              <span className="expand-icon">{expandedSection === 'bird' ? '−' : '+'}</span>
            </div>
            {expandedSection === 'bird' && (
              <div className="poem-content">
                <p>I drag my eyes open</p>
                <p>My pupils adjust to the dewy light</p>
                <p>...</p>
                <p>Ah</p>
                <p>I know</p>
                <p>I will start to sort of chatter</p>
                <p>And scream</p>
              </div>
            )}
          </div>
        </div>

        <div className="poetry-section">
          <h3>Winsome Wetlands</h3>
          <div className="poem-item">
            <div className="poem-header" onClick={() => toggleSection('wetlands')}>
              <h4>Lightningbug Land</h4>
              <span className="expand-icon">{expandedSection === 'wetlands' ? '−' : '+'}</span>
            </div>
            {expandedSection === 'wetlands' && (
              <div className="poem-content">
                <p>Lead laced lashes limp lower</p>
                <p>  Lower</p>
                <p>   Lower</p>
                <p>Lenses lided</p>
                <p> Listening</p>
                <p>Loon’s lowly loo lands loftily, lingering</p>
                <p>Lover’s lute-like laughs lavishly leaking life</p>
                <p>Lush leaves lay laden</p>
                <p>Lukewarm light leisurely lusters</p>
                <p>Luscious little lowlands litter lakelocked Louisiana.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default ReadPage; 