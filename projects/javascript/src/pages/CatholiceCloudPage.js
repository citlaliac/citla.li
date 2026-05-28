import React, { useCallback, useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useSEO } from '../hooks/useSEO';
import CecWorshiperRegister from '../cec/CecWorshiperRegister';
import CecWorshiperStage from '../cec/CecWorshiperStage';
import CecParishMap from '../cec/CecParishMap';
import CecLocationPopup, { AMEN_BURST_MS } from '../cec/CecLocationPopup';
import CecParishBulletin from '../cec/CecParishBulletin';
import CecSaintWheel from '../cec/CecSaintWheel';
import CecRankToast from '../cec/CecRankToast';
import CecShootingStars from '../cec/CecShootingStars';
import EcclesiasticalClock from '../ecclesiasticalTime/EcclesiasticalClock';
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

/** Manicule cursor — tip at upper-left; use manicule-cursor.png (≤128px) for browser support */
const CEC_PAGE_STYLE = {
  '--cec-manicule-cursor': `url('${PUB}/assets/catholicecloud/manicule-cursor.png') 0 0, auto`,
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
  const [bulletinOpen, setBulletinOpen] = useState(false);
  const [rewardToast, setRewardToast] = useState(null);
  const [, setPendingReward] = useState(null);

  const mergeReward = (prev, { awarded = 0, rankUp }) => ({
    pp: (prev?.pp || 0) + awarded,
    rankUp: rankUp || prev?.rankUp || null,
  });

  const applyWorshiper = useCallback((next, reward, deferToast = false) => {
    setWorshiper(next);
    if (!reward) return;
    const hasReward = !!reward.rankUp;
    if (!hasReward) return;
    if (deferToast) {
      setPendingReward((prev) => mergeReward(prev, reward));
      return;
    }
    setRewardToast(mergeReward(null, reward));
  }, []);

  const handleRegister = (name, skinId) => {
    const w = registerWorshiper(name, skinId);
    setWorshiper(w);
  };

  const handleAward = useCallback(
    (actionId, { deferToast } = {}) => {
      if (!worshiper) return { awarded: 0 };
      const { worshiper: next, awarded, rankUp } = awardPoints(worshiper, actionId);
      applyWorshiper(next, { awarded, rankUp }, deferToast);
      return { awarded };
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
    setPendingReward(null);
    setActiveLocation(loc);
  };

  const dismissAmen = () => {
    if (!activeLocation) return;
    setAmenSparkle(true);
    setWorshiper((w) => {
      if (!w) return w;
      let next = w;
      let amenPart = { awarded: 0, rankUp: null };
      if (!hasAmenDiscovery(w, activeLocation.id)) {
        const result = awardAmenDiscovery(w, activeLocation.id);
        next = result.worshiper;
        amenPart = { awarded: result.awarded, rankUp: result.rankUp };
      }
      setPendingReward((prev) => {
        const flush = mergeReward(prev, amenPart);
        window.setTimeout(() => {
          setActiveLocation(null);
          setAmenSparkle(false);
          if (flush.rankUp) {
            setRewardToast(flush);
          }
        }, AMEN_BURST_MS);
        return null;
      });
      return next;
    });
  };

  const handleWheelResult = (points) => {
    if (!worshiper) return;
    const { worshiper: next, rankUp } = addWheelPoints(worshiper, points);
    applyWorshiper(next, { awarded: points, rankUp });
  };

  useSEO({
    title: 'Catholic e Cloud | citla.li/catholicecloud',
    description: 'Heaven online — a campy Vatican-cloud hangout. Catholics, enjoy this space.',
    keywords: 'citla.li, catholic e cloud, heaven online',
    canonicalUrl: 'https://citla.li/catholicecloud',
    ogTitle: 'Catholic e Cloud',
    ogDescription: 'Heaven on earth? This is heaven online.',
    ogImage: 'https://citla.li/og-image.gif',
    twitterTitle: 'Catholic e Cloud',
    twitterDescription: 'Heaven online. Catholics, enjoy this space.',
    twitterImage: 'https://citla.li/og-image.gif',
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!worshiper) {
    return (
      <div className="cec-page cec-page--register" style={CEC_PAGE_STYLE}>
        <div className="cec-bg-stack" aria-hidden="true">
          <div className="cec-bg-layer cec-bg-layer--register-scrim" />
          <div
            className="cec-bg-layer cec-bg-layer--photo cec-bg-layer--photo-cathedral cec-bg-layer--register-hero"
            style={{ backgroundImage: `url('${BG.cathedral}')` }}
          />
          <div className="cec-bg-layer cec-bg-layer--vignette" />
        </div>
        <Header />
        <CecWorshiperRegister onRegister={handleRegister} />
        <Footer />
      </div>
    );
  }

  return (
    <div className="cec-page" style={CEC_PAGE_STYLE}>
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

      <CecShootingStars />

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

      <main className="cec-main">
        <header className="cec-banner">
          <h1 className="cec-title">catholic e cloud</h1>
          <p className="cec-subtitle">A cool online space for Catholics to hang out.</p>
        </header>

        <div className="cec-play-row">
          <CecWorshiperStage worshiper={worshiper} />
          <div className="cec-layout">
            <div className="cec-layout-head">
              <EcclesiasticalClock />
            </div>
            <CecParishMap worshiper={worshiper} onSelectLocation={handleSelectLocation} />
          </div>
        </div>
        <p className="cec-bottom-tagline">Heaven on earth? This is heaven online.</p>
      </main>

      <Footer />

      {rewardToast && (
        <CecRankToast
          worshiper={worshiper}
          pp={rewardToast.pp}
          rank={rewardToast.rankUp}
          onDone={() => setRewardToast(null)}
        />
      )}

      {activeLocation && (
        <CecLocationPopup
          location={activeLocation}
          worshiper={worshiper}
          amenSparkle={amenSparkle}
          onDismissAmen={dismissAmen}
          onCommunion={() => handleAward('vatican', { deferToast: true })}
          onPartake={() => handleAward('fish_fry', { deferToast: true })}
          onRosaryComplete={() => handleAward('rosary', { deferToast: true })}
          onLightCandle={() => handleAward('candle', { deferToast: true })}
          onActionDone={() => handleAward(activeLocation.actionId, { deferToast: true })}
        />
      )}

      {bulletinOpen && (
        <CecParishBulletin
          worshiper={worshiper}
          onClose={() => setBulletinOpen(false)}
          onPostApproved={() => handleAward('bulletin_post')}
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
