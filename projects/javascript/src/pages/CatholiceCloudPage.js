import React, { useCallback, useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useSEO } from '../hooks/useSEO';
import CecPilgrimRegister from '../cec/CecPilgrimRegister';
import CecStatsBar from '../cec/CecStatsBar';
import CecParishMap from '../cec/CecParishMap';
import CecLocationPopup, { AMEN_BURST_MS } from '../cec/CecLocationPopup';
import CecParishBulletin from '../cec/CecParishBulletin';
import CecSaintWheel from '../cec/CecSaintWheel';
import CecRankToast from '../cec/CecRankToast';
import { hasAmenDiscovery } from '../cec/cecConfig';
import {
  awardAmenDiscovery,
  awardPoints,
  addWheelPoints,
  loadWorshiper,
  registerWorshiper,
} from '../cec/worshiperStorage';
import '../styles/CatholiceCloudPage.css';

const PUB = process.env.PUBLIC_URL || '';
const BG = {
  cathedral: `${PUB}/assets/catholicecloud/background/cathedral-bkg.jpg`,
  heaven: `${PUB}/assets/catholicecloud/background/heaven-bkg.jpg`,
  forest: `${PUB}/assets/catholicecloud/background/foret_fontainebleu.jpg`,
};

const SPRINKLES = [
  { id: 'sp1', c: '✦', t: '6%', l: '5%', sz: 13, o: 0.5, r: -12 },
  { id: 'sp2', c: '⋆', t: '11%', l: '92%', sz: 16, o: 0.45, r: 8 },
  { id: 'sp3', c: '˖', t: '22%', l: '3%', sz: 18, o: 0.4, r: 0 },
  { id: 'sp4', c: '✧', t: '18%', l: '78%', sz: 12, o: 0.55, r: 22 },
  { id: 'sp5', c: '°', t: '34%', l: '96%', sz: 20, o: 0.35, r: 0 },
  { id: 'sp6', c: '﹡', t: '44%', l: '8%', sz: 14, o: 0.48, r: -6 },
  { id: 'sp7', c: '✶', t: '52%', l: '94%', sz: 15, o: 0.42, r: 15 },
  { id: 'sp8', c: '·', t: '63%', l: '4%', sz: 22, o: 0.38, r: 0 },
  { id: 'sp9', c: '✦', t: '71%', l: '88%', sz: 13, o: 0.52, r: -18 },
  { id: 'sp10', c: '⋆', t: '82%', l: '10%', sz: 17, o: 0.44, r: 6 },
];

function CatholiceCloudPage() {
  const [worshiper, setWorshiper] = useState(() => loadWorshiper());
  const [activeLocation, setActiveLocation] = useState(null);
  const [amenSparkle, setAmenSparkle] = useState(false);
  const [showWheel, setShowWheel] = useState(false);
  const [bulletinOpen, setBulletinOpen] = useState(true);
  const [rankToast, setRankToast] = useState(null);

  const applyWorshiper = useCallback((next, rankUp) => {
    setWorshiper(next);
    if (rankUp) setRankToast(rankUp);
  }, []);

  const handleRegister = (name) => {
    const w = registerWorshiper(name);
    setWorshiper(w);
  };

  const handleAward = useCallback(
    (actionId) => {
      if (!worshiper) return;
      const { worshiper: next, rankUp } = awardPoints(worshiper, actionId);
      applyWorshiper(next, rankUp);
    },
    [worshiper, applyWorshiper]
  );

  const handleSelectLocation = (loc) => {
    if (loc.actionType === 'bulletin') {
      setBulletinOpen(true);
      return;
    }
    if (loc.actionType === 'wheel') {
      setShowWheel(true);
      return;
    }
    setActiveLocation(loc);
  };

  const dismissAmen = () => {
    if (!activeLocation || !worshiper) return;
    if (!hasAmenDiscovery(worshiper, activeLocation.id)) {
      const { worshiper: next, rankUp } = awardAmenDiscovery(worshiper, activeLocation.id);
      applyWorshiper(next, rankUp);
    }
    setAmenSparkle(true);
    window.setTimeout(() => {
      setActiveLocation(null);
      setAmenSparkle(false);
    }, AMEN_BURST_MS);
  };

  const handleWheelResult = (points) => {
    if (!worshiper) return;
    const { worshiper: next, rankUp } = addWheelPoints(worshiper, points);
    applyWorshiper(next, rankUp);
  };

  useSEO({
    title: 'Catholic e Cloud | citla.li/catholicecloud',
    description:
      'Like Neopets, for Catholics — earn Pontifex Points, visit holy buildings, spin the Wheel of Saints.',
    keywords: 'citla.li, catholic e cloud, heaven online',
    canonicalUrl: 'https://citla.li/catholicecloud',
    ogTitle: 'Catholic e Cloud',
    ogDescription: 'Heaven on earth? This is heaven online.',
    ogImage: 'https://citla.li/og-image.gif',
    twitterTitle: 'Catholic e Cloud',
    twitterDescription: 'Like Neopets, for Catholics.',
    twitterImage: 'https://citla.li/og-image.gif',
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!worshiper) {
    return (
      <div className="cec-page">
        <Header />
        <CecPilgrimRegister onRegister={handleRegister} />
        <Footer />
      </div>
    );
  }

  return (
    <div className="cec-page">
      <div className="cec-bg-stack" aria-hidden="true">
        <div className="cec-bg-layer cec-bg-layer--gradient" />
        <div
          className="cec-bg-layer cec-bg-layer--photo cec-bg-layer--photo-cathedral"
          style={{ backgroundImage: `url('${BG.cathedral}')` }}
        />
        <div
          className="cec-bg-layer cec-bg-layer--photo cec-bg-layer--photo-heaven"
          style={{ backgroundImage: `url('${BG.heaven}')` }}
        />
        <div
          className="cec-bg-layer cec-bg-layer--photo cec-bg-layer--photo-forest"
          style={{ backgroundImage: `url('${BG.forest}')` }}
        />
        <div className="cec-bg-layer cec-bg-layer--marble" />
        <div className="cec-bg-layer cec-bg-layer--clouds" />
        <div className="cec-bg-layer cec-bg-layer--gold-dust" />
        <div className="cec-bg-layer cec-bg-layer--vignette" />
      </div>

      <div className="cec-sprinkles" aria-hidden="true">
        {SPRINKLES.map((s) => (
          <span
            key={s.id}
            className="cec-sprinkle"
            style={{
              top: s.t,
              left: s.l,
              fontSize: `${s.sz}px`,
              opacity: s.o,
              transform: s.r !== undefined ? `rotate(${s.r}deg)` : undefined,
            }}
          >
            {s.c}
          </span>
        ))}
      </div>

      <Header />
      <CecStatsBar worshiper={worshiper} onOpenWheel={() => setShowWheel(true)} />

      <main className="cec-main">
        <header className="cec-banner">
          <h1 className="cec-title">catholic e cloud</h1>
          <p className="cec-subtitle">Like Neopets, for Catholics.</p>
          <p className="cec-blurb">
            Heaven online. Earn Pontifex Points, level up from Lector to Priest, and leave notes on the
            Parish Bulletin.
          </p>
        </header>

        <div className="cec-layout">
          <CecParishMap worshiper={worshiper} onSelectLocation={handleSelectLocation} />
          <CecParishBulletin
            worshiper={worshiper}
            expanded={bulletinOpen}
            onToggleExpand={() => setBulletinOpen((o) => !o)}
            onPostApproved={() => handleAward('bulletin_post')}
          />
        </div>
      </main>

      <Footer />

      {rankToast && <CecRankToast rank={rankToast} onDone={() => setRankToast(null)} />}

      {activeLocation && (
        <CecLocationPopup
          location={activeLocation}
          worshiper={worshiper}
          amenSparkle={amenSparkle}
          onDismissAmen={dismissAmen}
          onCommunion={() => handleAward('vatican')}
          onPartake={() => handleAward('fish_fry')}
          onRosaryComplete={() => handleAward('rosary')}
          onLightCandle={() => handleAward('candle')}
          onActionDone={() => handleAward(activeLocation.actionId)}
        />
      )}

      {showWheel && (
        <CecSaintWheel
          worshiper={worshiper}
          onClose={() => setShowWheel(false)}
          onSpinResult={(points) => handleWheelResult(points)}
        />
      )}

    </div>
  );
}

export default CatholiceCloudPage;
