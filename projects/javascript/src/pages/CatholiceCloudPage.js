import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useSEO } from '../hooks/useSEO';
import CecBrandTitle from '../cec/CecBrandTitle';
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
import CecRotateOverlay from '../cec/CecRotateOverlay';
import CecFactionPanel from '../cec/CecFactionPanel';
import {
  useCecLandscapeLockOnPlay,
  useCecRotateGate,
} from '../cec/useCecMobileOrientation';
import {
  getCecSeasonTheme,
  getSeasonBackgroundPhotos,
  getSeasonSkyOverlay,
  readSeasonThemeOverride,
} from '../cec/cecSeasonTheme';
import EcclesiasticalClock from '../ecclesiasticalTime/EcclesiasticalClock';
import { useEcclesiasticalTime } from '../ecclesiasticalTime/useEcclesiasticalTime';
import { canAwardAmenDiscovery, SEDE_VACANTE_LABEL } from '../cec/cecConfig';
import {
  awardAmenDiscovery,
  awardPoints,
  addWheelPoints,
  loadWorshiper,
  registerWorshiper,
  applyAccountWorshiper,
  applyReigningPope,
  getAuthToken,
  setAuthToken,
  saveWorshiperLocal,
  normalizeWorshiper,
  receivePortraitCommunion,
  clearAuth,
  setReigningPope,
  setAccountSyncHandler,
} from '../cec/worshiperStorage';
import {
  cecRegisterAccount,
  cecLoginAccount,
  cecFetchAccount,
  cecFetchReigningPope,
  cecCheckUsernameAvailable,
  cecClaimReward,
} from '../cec/cecApi';
import '../styles/CatholiceCloudPage.css';

const PUB = process.env.PUBLIC_URL || '';
// Local guests can inspect congregation UI without connecting to production MySQL.
const CEC_LOCAL_UI_PREVIEW =
  process.env.NODE_ENV === 'development' ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost');
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
  const [authChecking, setAuthChecking] = useState(() => !!getAuthToken());
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [activeLocation, setActiveLocation] = useState(null);
  const [amenSparkle, setAmenSparkle] = useState(false);
  const [showWheel, setShowWheel] = useState(false);
  const [bulletinOpen, setBulletinOpen] = useState(false);
  const [rewardToast, setRewardToast] = useState(null);
  const [reigningPope, setReigningPopeState] = useState(null);
  const [, setPendingReward] = useState(null);
  const [aspergillumSplash, setAspergillumSplash] = useState(false);
  const pendingAspergillumSplashRef = useRef(false);
  const [portraitCommunion, setPortraitCommunion] = useState(null);
  const [faction, setFaction] = useState(null);
  const [showFaction, setShowFaction] = useState(false);
  const [smiteNotice, setSmiteNotice] = useState(null);
  const [gameError, setGameError] = useState('');
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
  const inPlay = Boolean(worshiper);
  const { showRotateGate, tryLandscape, continuePortrait } = useCecRotateGate(inPlay);
  useCecLandscapeLockOnPlay(inPlay && !showRotateGate);

  const mergeReward = (prev, { awarded = 0, rankUp, papacyLost }) => ({
    pp: (prev?.pp || 0) + awarded,
    rankUp: rankUp || prev?.rankUp || null,
    papacyLost: papacyLost || prev?.papacyLost || null,
  });

  const showRankToast = useCallback((toast) => {
    if (!toast?.rankUp && !toast?.papacyLost && !toast?.pp) return;
    setRewardToast(toast);
  }, []);

  const applyWorshiper = useCallback((next, reward, deferToast = false) => {
    setWorshiper(next);
    if (!reward) return;
    const hasReward = !!reward.rankUp || !!reward.papacyLost;
    if (!hasReward) return;
    if (deferToast) {
      setPendingReward((prev) => mergeReward(prev, reward));
      return;
    }
    showRankToast(mergeReward(null, reward));
  }, [showRankToast]);

  const handleGuestEnter = async (name, skinId) => {
    setAuthBusy(true);
    setAuthError('');
    try {
      // Local preview has no MySQL — skip the availability check so guests can enter.
      if (!CEC_LOCAL_UI_PREVIEW) {
        const available = await cecCheckUsernameAvailable(name);
        if (!available) {
          setAuthError('That name belongs to a registered worshiper — pick another');
          return;
        }
      }
      setWorshiper(registerWorshiper(name, skinId));
    } catch (err) {
      setAuthError(err.message || 'Could not enter the cloud');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleRegister = async (email, password, username, skinId) => {
    setAuthBusy(true);
    setAuthError('');
    try {
      const {
        token,
        worshiper: accountWorshiper,
        reigningPope: pope,
        faction: accountFaction,
      } = await cecRegisterAccount({ email, password, username, avatarId: skinId });
      setAuthToken(token);
      if (pope !== undefined) {
        setReigningPope(pope);
        setReigningPopeState(pope);
      }
      // Registration PP is already present in the authoritative account response.
      const w = applyAccountWorshiper(accountWorshiper, pope);
      setWorshiper(saveWorshiperLocal(w));
      setFaction(accountFaction || null);
    } catch (err) {
      setAuthError(err.message || 'Could not create account');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogout = useCallback(() => {
    clearAuth();
    setWorshiper(null);
    setReigningPopeState(null);
    setRewardToast(null);
    setBulletinOpen(false);
    setShowWheel(false);
    setActiveLocation(null);
    setFaction(null);
    setShowFaction(false);
    setSmiteNotice(null);
    setGameError('');
  }, []);

  const handleLogin = async (email, password) => {
    setAuthBusy(true);
    setAuthError('');
    try {
      const {
        token,
        worshiper: accountWorshiper,
        reigningPope: pope,
        faction: accountFaction,
        smite,
      } = await cecLoginAccount({ email, password });
      setAuthToken(token);
      if (pope !== undefined) {
        setReigningPope(pope);
        setReigningPopeState(pope);
      }
      const w = applyAccountWorshiper(accountWorshiper, pope);
      setWorshiper(saveWorshiperLocal(w));
      setFaction(accountFaction || null);
      if (smite?.smote) setSmiteNotice(smite);
    } catch (err) {
      setAuthError(err.message || 'Could not log in');
    } finally {
      setAuthBusy(false);
    }
  };

  const applyServerReward = useCallback(
    (data, deferToast = false) => {
      if (!data?.worshiper || !worshiper) return { awarded: 0 };
      if (data.reigningPope !== undefined) {
        setReigningPope(data.reigningPope);
        setReigningPopeState(data.reigningPope);
      }
      const next = saveWorshiperLocal(
        applyAccountWorshiper(data.worshiper, data.reigningPope)
      );
      const rankUp =
        next.rank.id !== worshiper.rank.id && next.rank.id !== 'cantor' ? next.rank : null;
      const papacyLost =
        worshiper.rank.id === 'pope' && next.rank.id !== 'pope'
          ? {
              reigningPopeName: data.reigningPope?.displayName || 'another worshiper',
              pointsNeeded: Math.max(
                0,
                (data.reigningPope?.pontifexPoints || 3000) - next.pontifexPoints + 1
              ),
            }
          : null;
      const awarded = data.reward?.awarded || 0;
      setFaction(data.faction || null);
      applyWorshiper(next, { awarded, rankUp, papacyLost }, deferToast);
      return { awarded, rankUp, papacyLost, rewardKind: data.reward?.rewardKind };
    },
    [worshiper, applyWorshiper]
  );

  const handleAward = useCallback(
    async (actionId, { deferToast } = {}) => {
      if (!worshiper) return { awarded: 0 };
      const token = getAuthToken();
      if (worshiper.accountId && token) {
        try {
          const data = await cecClaimReward(token, 'action', actionId);
          return applyServerReward(data, deferToast);
        } catch (err) {
          setGameError(err.message || 'Could not record reward');
          return { awarded: 0 };
        }
      }
      // Local guests keep the existing non-competitive reward experience.
      const { worshiper: next, awarded, rankUp, papacyLost } = awardPoints(
        worshiper,
        actionId
      );
      applyWorshiper(next, { awarded, rankUp, papacyLost }, deferToast);
      return { awarded, rankUp, papacyLost };
    },
    [worshiper, applyServerReward, applyWorshiper]
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

  const dismissAmen = async () => {
    if (!activeLocation) return;
    const playAspergillumSplash =
      pendingAspergillumSplashRef.current && activeLocation.id === 'aspergillum';
    if (playAspergillumSplash) {
      pendingAspergillumSplashRef.current = false;
    }
    setAmenSparkle(true);
    let amenPart = { awarded: 0, rankUp: null, papacyLost: null };
    try {
      const token = getAuthToken();
      if (worshiper.accountId && token) {
        const data = await cecClaimReward(token, 'amen', activeLocation.id);
        amenPart = applyServerReward(data, true);
      } else if (canAwardAmenDiscovery(worshiper, activeLocation.id)) {
        const result = awardAmenDiscovery(worshiper, activeLocation.id);
        setWorshiper(result.worshiper);
        amenPart = result;
      }
    } catch (err) {
      setGameError(err.message || 'Could not record Amen');
    }
    setPendingReward((prev) => {
      const flush = mergeReward(prev, amenPart);
      window.setTimeout(() => {
        setActiveLocation(null);
        setAmenSparkle(false);
        if (playAspergillumSplash) {
          setAspergillumSplash(true);
        }
        if (flush.rankUp || flush.papacyLost) {
          showRankToast(flush);
        }
      }, AMEN_BURST_MS);
      return null;
    });
  };

  const handleWheelResult = (result) => {
    if (!worshiper) return;
    if (result.worshiper) {
      applyServerReward({ ...result, reward: { awarded: result.points } });
      return;
    }
    const { worshiper: next, rankUp, papacyLost } = addWheelPoints(
      worshiper,
      result.points
    );
    applyWorshiper(next, { awarded: result.points, rankUp, papacyLost });
  };

  const handlePortraitCommunion = async () => {
    if (!worshiper || portraitCommunion) return;
    let result;
    const token = getAuthToken();
    if (worshiper.accountId && token) {
      try {
        const data = await cecClaimReward(token, 'communion');
        const applied = applyServerReward(data);
        result = {
          kind: applied.rewardKind,
          awarded: applied.awarded,
          // The authoritative response already handled any rank transition.
          rankUp: null,
          papacyLost: null,
        };
      } catch (err) {
        setGameError(err.message || 'Could not receive communion');
        return;
      }
    } else {
      result = receivePortraitCommunion(worshiper);
      setWorshiper(result.worshiper);
    }
    setPortraitCommunion({
      kind: result.kind,
      awarded: result.awarded,
      rankUp: result.rankUp,
      papacyLost: result.papacyLost,
    });
  };

  const dismissPortraitCommunion = () => {
    if (!portraitCommunion) return;
    const { awarded, rankUp, papacyLost } = portraitCommunion;
    setPortraitCommunion(null);
    if (awarded > 0 || rankUp || papacyLost) {
      showRankToast({ pp: awarded, rankUp: rankUp || null, papacyLost: papacyLost || null });
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

  useEffect(() => {
    let cancelled = false;
    cecFetchReigningPope()
      .then((pope) => {
        if (cancelled) return;
        setReigningPope(pope);
        setReigningPopeState(pope);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setReigningPope(reigningPope);
    setWorshiper((w) => {
      if (!w) return w;
      const next = normalizeWorshiper(w);
      return next.rank.id === w.rank.id ? w : next;
    });
  }, [reigningPope]);

  useEffect(() => {
    setAccountSyncHandler((data) => {
      if (data.reigningPope !== undefined) {
        setReigningPopeState(data.reigningPope);
      }
      if (data.faction !== undefined) {
        setFaction(data.faction);
      }
      setWorshiper((w) => {
        let next = w;
        if (data.worshiper && w?.accountId) {
          next = saveWorshiperLocal(applyAccountWorshiper(data.worshiper, data.reigningPope));
        }
        if (data.reigningPope === undefined) return next;
        const result = applyReigningPope(next, data.reigningPope);
        if (result.papacyLost) {
          showRankToast({ pp: 0, papacyLost: result.papacyLost });
        } else if (result.rankUp) {
          showRankToast({ pp: 0, rankUp: result.rankUp });
        }
        return saveWorshiperLocal(result.worshiper);
      });
    });
    return () => setAccountSyncHandler(null);
  }, [showRankToast]);

  useEffect(() => {
    if (!worshiper?.accountId) return undefined;
    let cancelled = false;
    const poll = () => {
      cecFetchReigningPope()
        .then((pope) => {
          if (cancelled) return;
          setReigningPopeState((prevPope) => {
            const sameHolder =
              prevPope?.accountId === pope?.accountId &&
              prevPope?.pontifexPoints === pope?.pontifexPoints;
            if (sameHolder) return prevPope ?? pope;
            setWorshiper((w) => {
              if (!w) return w;
              const result = applyReigningPope(w, pope);
              if (result.papacyLost) {
                showRankToast({ pp: 0, papacyLost: result.papacyLost });
              } else if (result.rankUp) {
                showRankToast({ pp: 0, rankUp: result.rankUp });
              }
              return result.worshiper;
            });
            return pope;
          });
        })
        .catch(() => {});
    };
    const id = window.setInterval(poll, 45000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [worshiper?.accountId, showRankToast]);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setAuthChecking(false);
      return undefined;
    }
    let cancelled = false;
    cecFetchAccount(token)
      .then(({ worshiper: accountWorshiper, reigningPope: pope, faction: accountFaction, smite }) => {
        if (cancelled) return;
        if (pope !== undefined) {
          setReigningPope(pope);
          setReigningPopeState(pope);
        }
        setWorshiper(saveWorshiperLocal(applyAccountWorshiper(accountWorshiper, pope)));
        setFaction(accountFaction || null);
        if (smite?.smote) setSmiteNotice(smite);
      })
      .catch(() => {
        if (!cancelled) setAuthToken(null);
      })
      .finally(() => {
        if (!cancelled) setAuthChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (authChecking) {
    return (
      <div className="cec-page cec-page--register" style={CEC_PAGE_STYLE}>
        <Header />
        <p className="cec-register-auth-loading">Loading your worshiper…</p>
        <Footer />
      </div>
    );
  }

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
        <CecWorshiperRegister
          onGuestEnter={handleGuestEnter}
          onRegister={handleRegister}
          onLogin={handleLogin}
          authError={authError}
          authBusy={authBusy}
        />
        <Footer />
      </div>
    );
  }

  return (
    <div className="cec-page cec-page--play" style={CEC_PAGE_STYLE}>
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
          <CecBrandTitle as="h1" className="cec-title cec-brand-title" />
          <p className="cec-subtitle">A cool online space for Catholics to hang out.</p>
        </header>

        <div className="cec-play-row">
          <CecWorshiperStage
            worshiper={worshiper}
            reigningPope={reigningPope}
            faction={faction}
            starPalette={seasonTheme.starPalette}
            onPortraitClick={handlePortraitCommunion}
            onCongregationClick={
              worshiper.accountId || CEC_LOCAL_UI_PREVIEW
                ? () => setShowFaction(true)
                : undefined
            }
            onLogout={worshiper.accountId ? handleLogout : undefined}
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
            <div className="cec-layout-foot">
              <p
                className={`cec-ecclesiastical-season cec-map-current-pope${
                  reigningPope ? '' : ' cec-map-current-pope--vacant'
                }`}
                aria-live="polite"
                aria-label={
                  reigningPope
                    ? `Supreme Pope: ${reigningPope.displayName}`
                    : `Supreme Pope: ${SEDE_VACANTE_LABEL}`
                }
              >
                Supreme Pope:{' '}
                {reigningPope ? (
                  <strong>{reigningPope.displayName}</strong>
                ) : (
                  <em className="cec-map-sede-vacante">{SEDE_VACANTE_LABEL}</em>
                )}
              </p>
            </div>
          </div>
        </div>
        <p className="cec-bottom-tagline">Heaven on earth? This is heaven online.</p>
        <Link className="cec-rules-link" to="/catholicecloud/rules">
          Rules
        </Link>
      </main>

      <Footer />

      {rewardToast && (
        <CecRankToast
          worshiper={worshiper}
          pp={rewardToast.pp}
          rank={rewardToast.rankUp}
          papacyLost={rewardToast.papacyLost}
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
          onActionDone={async () => {
            const { awarded } = await handleAward(activeLocation.actionId, {
              deferToast: true,
            });
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
          onSpinResult={handleWheelResult}
        />
      )}

      {showFaction && (
        <CecFactionPanel
          initialFaction={
            faction ||
            (CEC_LOCAL_UI_PREVIEW
              ? {
                  joined: false,
                  canFound: true,
                  recruitmentCode: worshiper.displayName,
                }
              : null)
          }
          onChange={setFaction}
          onClose={() => setShowFaction(false)}
        />
      )}

      {smiteNotice && (
        <div className="cec-smite-notice" role="alert">
          <strong>You were smote.</strong> You lost {smiteNotice.lostPP} PP and rewards are
          weakened for 48 hours.
          <button type="button" onClick={() => setSmiteNotice(null)}>
            Amen
          </button>
        </div>
      )}

      {gameError && (
        <div className="cec-game-error" role="alert">
          {gameError}
          <button type="button" onClick={() => setGameError('')} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      {portraitCommunion && (
        <CecPortraitCommunionPopup
          kind={portraitCommunion.kind}
          bonusPP={portraitCommunion.awarded}
          onDismiss={dismissPortraitCommunion}
        />
      )}

      {showRotateGate && (
        <CecRotateOverlay
          onTryLandscape={tryLandscape}
          onContinuePortrait={continuePortrait}
        />
      )}

    </div>
  );
}

export default CatholiceCloudPage;
