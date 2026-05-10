import React, { useEffect, useRef, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useSEO } from '../hooks/useSEO';
import coinFlipper, {
  CoinType,
  COIN_IMAGE_URL,
  COIN_FLIP_DURATION_MS,
} from '../logic/coinFlipper';
import '../styles/CoinBoysPage.css';

function getCoinResultText(nextCoinType) {
  if (nextCoinType === CoinType.headsCoin) return 'Heads';
  if (nextCoinType === CoinType.tailsCoin) return 'Tails';
  return 'Edge hit! Flip again';
}

function runFlipAnimation(imgEl) {
  if (!imgEl) {
    return Promise.resolve();
  }
  if (typeof imgEl.animate !== 'function') {
    return new Promise((resolve) => {
      setTimeout(resolve, COIN_FLIP_DURATION_MS);
    });
  }

  const animation = imgEl.animate(
    [
      {
        transform:
          'perspective(1000px) translateY(0) rotateY(0deg) scale(1)',
      },
      {
        transform:
          'perspective(1000px) translateY(-14px) rotateY(720deg) scale(1.08)',
      },
      {
        transform:
          'perspective(1000px) translateY(0) rotateY(1440deg) scale(1)',
      },
    ],
    {
      duration: COIN_FLIP_DURATION_MS,
      easing: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
    }
  );

  return animation.finished.then(() => {
    animation.cancel();
    imgEl.style.transform = '';
  });
}

function CoinBoysPage() {
  const [coinType, setCoinType] = useState(CoinType.freshCoin);
  const [isSpinning, setIsSpinning] = useState(false);
  const [resultText, setResultText] = useState(
    'Tap the coin or button to flip'
  );
  const coinImgRef = useRef(null);

  useSEO({
    title: 'Coin Boys — flip a coin | citla.li/coinboys',
    description:
      'Coin Boys coin flipper — tap the coin or Coin me. Heads, tails, or a rare edge.',
    keywords: 'coin flip, Coin Boys, citla.li',
    canonicalUrl: 'https://citla.li/coinboys',
    ogTitle: 'Coin Boys | citla.li',
    ogDescription:
      'Flip a coin. Tap the coin or Coin me — Heads, Tails, or edge.',
    ogImage: 'https://citla.li/assets/coin-boys/coin-side.png',
    twitterTitle: 'Coin Boys | citla.li',
    twitterDescription:
      'Flip a coin on the web — same vibe as the Coin Boys app.',
    twitterImage: 'https://citla.li/assets/coin-boys/coin-side.png',
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const coinFlipAndSet = () => {
    if (isSpinning) return;

    const imgEl = coinImgRef.current;
    setIsSpinning(true);
    setResultText('Flipping...');

    runFlipAnimation(imgEl).then(() => {
      const nextCoinType = coinFlipper();
      setCoinType(nextCoinType);
      setResultText(getCoinResultText(nextCoinType));
      setIsSpinning(false);
    });
  };

  return (
    <div className="coinboys-page">
      <Header />
      <main className="coinboys-main">
        <h1 className="coinboys-title">Coin Boys</h1>
        <p className="coinboys-tagline">
          from the hit app{' '}
          <a
            href="https://github.com/citlaliac/coin-boys"
            target="_blank"
            rel="noreferrer"
          >
            Coin Boys
          </a>
        </p>
        <div className="coinboys-stage">
          <button
            type="button"
            className="coinboys-coin-hitbox"
            onClick={coinFlipAndSet}
            disabled={isSpinning}
            aria-label="Flip coin"
          >
            <img
              ref={coinImgRef}
              src={COIN_IMAGE_URL[coinType]}
              alt=""
              className="coinboys-coin-img"
              width={225}
              height={220}
              draggable={false}
            />
          </button>
          <p className="coinboys-result" data-testid="coin-result-text">
            {resultText}
          </p>
          <div className="coinboys-btn-wrap">
            <button
              type="button"
              className={`coinboys-coinme ${isSpinning ? 'coinboys-coinme--spinning' : ''}`}
              onClick={coinFlipAndSet}
              disabled={isSpinning}
              data-testid="coin-me-button"
            >
              Coin me
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default CoinBoysPage;
