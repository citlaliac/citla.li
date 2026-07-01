import { useCallback, useEffect, useState } from 'react';

const PORTRAIT_MQ = '(max-width: 900px) and (orientation: portrait)';
const TOUCH_MQ = '(hover: none) and (pointer: coarse)';
const PORTRAIT_OK_KEY = 'cec_allow_portrait';

export function readPortraitPlayAllowed() {
  try {
    return sessionStorage.getItem(PORTRAIT_OK_KEY) === '1';
  } catch {
    return false;
  }
}

export function allowPortraitPlay() {
  try {
    sessionStorage.setItem(PORTRAIT_OK_KEY, '1');
  } catch {
    /* ignore */
  }
}

export async function requestCecLandscapeLock() {
  try {
    const { orientation } = window.screen;
    if (orientation?.lock) {
      await orientation.lock('landscape');
      return true;
    }
  } catch {
    /* iOS Safari and most in-tab browsers block lock without fullscreen */
  }
  return false;
}

export function useCecMobilePortrait() {
  const [portraitMobile, setPortraitMobile] = useState(false);

  useEffect(() => {
    const portraitMq = window.matchMedia(PORTRAIT_MQ);
    const touchMq = window.matchMedia(TOUCH_MQ);

    const update = () => {
      setPortraitMobile(portraitMq.matches && touchMq.matches);
    };

    update();
    portraitMq.addEventListener('change', update);
    touchMq.addEventListener('change', update);
    return () => {
      portraitMq.removeEventListener('change', update);
      touchMq.removeEventListener('change', update);
    };
  }, []);

  return portraitMobile;
}

export function useCecLandscapeLockOnPlay(active) {
  useEffect(() => {
    if (!active) return undefined;
    requestCecLandscapeLock();
    return undefined;
  }, [active]);
}

export function useCecRotateGate(active) {
  const portraitMobile = useCecMobilePortrait();
  const [dismissed, setDismissed] = useState(() => readPortraitPlayAllowed());

  const showRotateGate = active && portraitMobile && !dismissed;

  const tryLandscape = useCallback(async () => {
    await requestCecLandscapeLock();
  }, []);

  const continuePortrait = useCallback(() => {
    allowPortraitPlay();
    setDismissed(true);
  }, []);

  return { showRotateGate, tryLandscape, continuePortrait };
}
