import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import CecPortraitCommunionPopup from '../cec/CecPortraitCommunionPopup';
import CecShootingStars from '../cec/CecShootingStars';
import CecSeasonAmbience from '../cec/CecSeasonAmbience';
import CecSeasonDebugPicker from '../cec/CecSeasonDebugPicker';
import {
  getCecSeasonTheme,
  getSeasonBackgroundPhotos,
  getSeasonSkyOverlay,
  readSeasonThemeOverride,
} from '../cec/cecSeasonTheme';
import EcclesiasticalClock from '../ecclesiasticalTime/EcclesiasticalClock';
import { useEcclesiasticalTime } from '../ecclesiasticalTime/useEcclesiasticalTime';
import { canAwardAmenDiscovery } from '../cec/cecConfig';
import {
  awardAmenDiscovery,
  awardPoints,
  addWheelPoints,
  loadWorshiper,
  registerWorshiper,
  receivePortraitCommunion,
} from '../cec/worshiperStorage';
import '../styles/CatholiceCloudPage.css';

const PUB = process.env.PUBLIC_URL || '';
const BG = {
  cathedral: `${PUB}/assets/catholicecloud/background/cathedral-bkg.jpg`,
  heaven: `${PUB}/assets/catholicecloud/background/heaven-bkg.jpg`,
  forest: `${PUB}/assets/catholicecloud/background/foret_fontainebleu.jpg`,
  easterCathedral: `${PUB}/assets/catholicecloud/background/easter-cathedral.jpg`,
  christmasCathedral: `${PUB}/assets/catholicecloud/background/christmas-cathedral.jpg`,
  clouds: `${PUB}/assets/catholicecloud/background/clouds.jpg`,
};

const CEC_BG_PHOTO_LAYERS = [
  { id: 'cathedral', className: 'cec-bg-layer--photo-cathedral', src: BG.cathedral },
  { id: 'heaven', className: 'cec-bg-layer--photo-heaven', src: BG.heaven },
  { id: 'forest', className: 'cec-bg-layer--photo-forest', src: BG.forest },
  {
    id: 'easterCathedral',
    className: 'cec-bg-layer--photo-easter-cathedral',
    src: BG.easterCathedral,
  },
  {
    id: 'christmasCathedral',
    className: 'cec-bg-layer--photo-christmas-cathedral',
    src: BG.christmasCathedral,
  },
  { id: 'clouds', className: 'cec-bg-layer--photo-clouds', src: BG.clouds },
];

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
  const [aspergillumSplash, setAspergillumSplash] = useState(false);
  const pendingAspergillumSplashRef = useRef(false);
  const [portraitCommunion, setPortraitCommunion] = useState(null);
  const { data: liturgical } = useEcclesiasticalTime();
  const [seasonOverride, setSeasonOverride] = useState(() => readSeasonThemeOverride());
  const liturgicalThemeId = liturgical.themeId ?? 'ordinary';
  const activeThemeId = seasonOverride ?? liturgicalThemeId;
  const seasonTheme = getCecSeasonTheme(activeThemeId);
  const seasonBgPhotos = getSeasonBackgroundPhotos(activeThemeId);
  const singleBgPhoto = seasonBgPhotos.length === 1;
  const skyOverlay = getSeasonSkyOverlay(activeThemeId);
  const showSkyOverlay = skyOverlay !== null;
  const heavenOnlyBg = skyOverlay === 'heaven' && seasonBgPhotos.length === 0;
  const showProceduralClouds = !seasonBgPhotos.includes('clouds');

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

  const endAspergillumSplash = useCallback(() => setAspergillumSplash(false), []);

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
    pendingAspergillumSplashRef.current = false;
    setActiveLocation(loc);
  };

  const dismissAmen = () => {
    if (!activeLocation) return;
    const playAspergillumSplash =
      pendingAspergillumSplashRef.current && activeLocation.id === 'aspergillum';
    if (playAspergillumSplash) {
      pendingAspergillumSplashRef.current = false;
    }
    setAmenSparkle(true);
    setWorshiper((w) => {
      if (!w) return w;
      let next = w;
      let amenPart = { awarded: 0, rankUp: null };
      if (canAwardAmenDiscovery(w, activeLocation.id)) {
        const result = awardAmenDiscovery(w, activeLocation.id);
        next = result.worshiper;
        amenPart = { awarded: result.awarded, rankUp: result.rankUp };
      }
      setPendingReward((prev) => {
        const flush = mergeReward(prev, amenPart);
        window.setTimeout(() => {
          setActiveLocation(null);
          setAmenSparkle(false);
          if (playAspergillumSplash) {
            setAspergillumSplash(true);
          }
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

  const handlePortraitCommunion = () => {
    if (!worshiper || portraitCommunion) return;
    const result = receivePortraitCommunion(worshiper);
    setWorshiper(result.worshiper);
    setPortraitCommunion({
      kind: result.kind,
      awarded: result.awarded,
      rankUp: result.rankUp,
    });
  };

  const dismissPortraitCommunion = () => {
    if (!portraitCommunion) return;
    const { awarded, rankUp } = portraitCommunion;
    setPortraitCommunion(null);
    if (awarded > 0 || rankUp) {
      setRewardToast({ pp: awarded, rankUp: rankUp || null });
    }
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
      <div
        className={`cec-bg-stack${singleBgPhoto ? ' cec-bg-stack--single-photo' : ''}${
          showSkyOverlay ? ' cec-bg-stack--heaven-overlay' : ''
        }${heavenOnlyBg ? ' cec-bg-stack--heaven-only' : ''}${
          activeThemeId === 'advent' ? ' cec-bg-stack--advent' : ''
        }${activeThemeId === 'epiphany' ? ' cec-bg-stack--epiphany' : ''
        }${activeThemeId === 'holyWeek' ? ' cec-bg-stack--holy-week' : ''
        }${activeThemeId === 'easter' ? ' cec-bg-stack--easter' : ''
        }${activeThemeId === 'christmas' ? ' cec-bg-stack--christmas' : ''
        }`}
        aria-hidden="true"
      >
        <div className="cec-bg-layer cec-bg-layer--gradient" />
        {CEC_BG_PHOTO_LAYERS.filter((layer) => seasonBgPhotos.includes(layer.id)).map((layer) => (
          <div
            key={layer.id}
            className={`cec-bg-layer cec-bg-layer--photo ${layer.className}`}
            style={{ backgroundImage: `url('${layer.src}')` }}
          />
        ))}
        {showSkyOverlay && (
          <div
            className={`cec-bg-layer cec-bg-layer--photo ${
              skyOverlay === 'heaven'
                ? 'cec-bg-layer--photo-heaven cec-bg-layer--photo-heaven-overlay'
                : 'cec-bg-layer--photo-clouds cec-bg-layer--photo-clouds-overlay'
            }`}
            style={{
              backgroundImage: `url('${skyOverlay === 'heaven' ? BG.heaven : BG.clouds}')`,
            }}
          />
        )}
        <div className="cec-bg-layer cec-bg-layer--marble" />
        {showProceduralClouds && <div className="cec-bg-layer cec-bg-layer--clouds" />}
        <div className="cec-bg-layer cec-bg-layer--gold-dust" />
        <div
          className="cec-bg-layer cec-bg-layer--season-tint"
          style={{
            '--cec-season-overlay': seasonTheme.overlay,
            '--cec-season-overlay-opacity': seasonTheme.overlayOpacity,
          }}
        />
        {activeThemeId === 'easter' && (
          <div className="cec-bg-layer cec-bg-layer--easter-frost" aria-hidden />
        )}
        {activeThemeId === 'christmas' && (
          <div className="cec-bg-layer cec-bg-layer--christmas-frost" aria-hidden />
        )}
        <div className="cec-bg-layer cec-bg-layer--vignette" />
      </div>

      <CecShootingStars key={activeThemeId} starPalette={seasonTheme.starPalette} />
      <CecSeasonAmbience themeId={activeThemeId} />

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

      <CecSeasonDebugPicker
        activeThemeId={activeThemeId}
        overrideThemeId={seasonOverride}
        liturgicalThemeId={liturgicalThemeId}
        onSelectOverride={setSeasonOverride}
      />

      <main className="cec-main">
        <header className="cec-banner">
          <h1 className="cec-title">catholic e cloud</h1>
          <p className="cec-subtitle">A cool online space for Catholics to hang out.</p>
        </header>

        <div className="cec-play-row">
          <CecWorshiperStage
            worshiper={worshiper}
            starPalette={seasonTheme.starPalette}
            onPortraitClick={handlePortraitCommunion}
          />
          <div className="cec-layout">
            <div className="cec-layout-head">
              <EcclesiasticalClock themeId={activeThemeId} />
            </div>
            <CecParishMap
              worshiper={worshiper}
              seasonThemeId={activeThemeId}
              hollyMapIds={seasonTheme.hollyMapIds}
              onSelectLocation={handleSelectLocation}
              aspergillumSplash={aspergillumSplash}
              onAspergillumSplashEnd={endAspergillumSplash}
            />
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
          onActionDone={() => {
            const { awarded } = handleAward(activeLocation.actionId, { deferToast: true });
            if (activeLocation.id === 'aspergillum' && awarded > 0) {
              pendingAspergillumSplashRef.current = true;
            }
          }}
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

      {portraitCommunion && (
        <CecPortraitCommunionPopup
          kind={portraitCommunion.kind}
          bonusPP={portraitCommunion.awarded}
          onDismiss={dismissPortraitCommunion}
        />
      )}

    </div>
  );
}

export default CatholiceCloudPage;
