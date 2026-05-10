import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSEO } from '../hooks/useSEO';
import '../styles/NiceWorkPage.css';

/**
 * Each popup picks a visual “skin” — messy mix of OS dialogs + sketchy ad spam.
 */
const VARIANTS = [
  {
    id: 'classic',
    titles: [
      'Alert',
      'Warning',
      'Error',
      'Microsoft Windows',
      'Security Alert',
    ],
    ok: 'OK',
  },
  {
    id: 'camspam',
    titles: [
      'LIVE — WebChat',
      'Private message',
      'New notification',
      'Connection request',
      'Someone viewed your profile',
    ],
    ok: 'CONTINUE',
  },
  {
    id: 'antivirus',
    titles: [
      'Windows Defender',
      'CRITICAL THREAT DETECTED',
      'VIRUS ALERT',
      'IMMEDIATE ACTION REQUIRED',
      'SYSTEM INFECTED',
    ],
    ok: 'SCAN NOW',
  },
  {
    id: 'neonclub',
    titles: ['VIP ACCESS', 'Members only', 'Encrypted channel', 'After dark'],
    ok: 'ENTER',
  },
  {
    id: 'chromeFake',
    titles: [
      'citla.li says',
      'This page says',
      'Allow notifications?',
      'Location permission',
    ],
    ok: 'Allow',
  },
  {
    id: 'macos',
    titles: ['Finder', 'Console', 'System Preferences', 'QuickTime Player'],
    ok: 'OK',
  },
  {
    id: 'prize',
    titles: [
      'CONGRATULATIONS!!!',
      'YOU ARE THE 1,000,000th VISITOR',
      'CLAIM YOUR PRIZE',
      'FREE GIFT INSIDE',
    ],
    ok: 'CLAIM',
  },
  {
    id: 'torrent',
    titles: ['µTorrent', 'Seeding complete', 'Peer connected', 'Download ready'],
    ok: 'OPEN',
  },
];

const POPUP_MESSAGES = [
  'nice work dumbass',
  'you really did it this time',
  'ALERT: This person is a dumbass!!',
  'Critical error: competence not found',
  'Brain.exe has stopped responding',
  '404: Intelligence not found',
  'wow. incredible. absolutely mid.',
  'Achievement unlocked: Still an idiot',
  'This incident will be reported.',
  'Task failed successfully.',
  'Warning: High levels of dumbass detected',
  'Recalculating… still bad.',
  'You tried. That is already documented.',
  'Please contact your system administrator (it is you)',
  'Error 0xIDIOT: Operation completed anyway',
  'File not found: shame.exe',
  'Security alert: Unqualified optimism',
  'Have you considered logging off forever?',
  'Technically that counts. Technically you still messed up.',
  'Your crown is in the mail (it says LOSER on it)',
];

/** More concurrent dialogs + faster spawn = fuller screen coverage */
const MAX_ALERTS = 118;

/** Quiet beat before chaos — shows centered text alone first */
const BOOT_DELAY_MS = 4000;

/** Irregular cadence: bursts, normal clicks, occasional long gaps */
function nextSpawnDelayMs() {
  const roll = Math.random();
  if (roll < 0.12) {
    return randomBetween(520, 1400);
  }
  if (roll < 0.38) {
    return randomBetween(160, 480);
  }
  return randomBetween(25, 155);
}

/** Width bounds (px) — wide dialogs eat more of the viewport */
const WIDTH_MIN = 176;
const WIDTH_MAX_CAP = 620;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomSpawnPosition(widthPx, heightGuessPx) {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 900;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 700;
  const pad = 0;
  const maxX = Math.max(pad, vw - widthPx - pad);
  const maxY = Math.max(pad, vh - heightGuessPx - pad);
  return {
    x: Math.random() * maxX,
    y: Math.random() * maxY,
  };
}

function NiceWorkPage() {
  const [alerts, setAlerts] = useState([]);
  const nextIdRef = useRef(0);
  const layerRef = useRef(100);
  const niceworkImagesRef = useRef([]);

  useSEO({
    title: 'nice work | citla.li/nicework',
    description: 'nice work',
    keywords: 'citla.li',
    canonicalUrl: 'https://citla.li/nicework',
    ogTitle: 'nice work',
    ogDescription: 'nice work',
    ogImage: 'https://citla.li/og-image.gif',
    twitterTitle: 'nice work',
    twitterDescription: 'nice work',
    twitterImage: 'https://citla.li/og-image.gif',
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/assets/nicework/manifest.json', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : []))
      .then((files) => {
        if (
          !cancelled &&
          Array.isArray(files) &&
          files.every((f) => typeof f === 'string')
        ) {
          niceworkImagesRef.current = files;
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const spawnOne = useCallback(() => {
    const id = nextIdRef.current++;
    layerRef.current += 1;
    const z = layerRef.current;
    const variant = pick(VARIANTS);

    const vw =
      typeof window !== 'undefined' ? window.innerWidth : 900;
    const maxW = Math.min(WIDTH_MAX_CAP, vw - 4);
    const widthPx = Math.round(randomBetween(WIDTH_MIN, Math.max(WIDTH_MIN + 40, maxW)));

    const imgs = niceworkImagesRef.current;
    const useImg = imgs.length > 0 && Math.random() < 0.82;
    const imageSrc = useImg
      ? `/assets/nicework/${encodeURIComponent(pick(imgs))}`
      : null;
    const imageMaxPx = Math.round(randomBetween(64, 168));

    const heightGuessPx = imageSrc
      ? randomBetween(200, 360)
      : randomBetween(96, 220);

    const pos = randomSpawnPosition(widthPx, heightGuessPx);

    setAlerts((prev) => {
      const next = [
        ...prev,
        {
          id,
          message: pick(POPUP_MESSAGES),
          title: pick(variant.titles),
          variant: variant.id,
          okLabel: variant.ok,
          widthPx,
          imageSrc,
          imageMaxPx,
          left: pos.x,
          top: pos.y,
          zIndex: z,
        },
      ];
      if (next.length > MAX_ALERTS) {
        return next.slice(next.length - MAX_ALERTS);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    let bootTimer = null;
    let spawnLoopTimer = null;

    const scheduleNext = () => {
      spawnLoopTimer = window.setTimeout(() => {
        if (cancelled) return;
        spawnOne();
        scheduleNext();
      }, nextSpawnDelayMs());
    };

    bootTimer = window.setTimeout(() => {
      if (cancelled) return;
      spawnOne();
      scheduleNext();
    }, BOOT_DELAY_MS);

    return () => {
      cancelled = true;
      if (bootTimer) window.clearTimeout(bootTimer);
      if (spawnLoopTimer) window.clearTimeout(spawnLoopTimer);
    };
  }, [spawnOne]);

  const dismiss = useCallback((id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return (
    <div className="nicework-page">
      <p className="nicework-center-line">nice work, dumbass</p>

      {alerts.map((a) => (
        <div
          key={a.id}
          className={`nicework-alert nicework-alert--${a.variant}`}
          style={{
            left: a.left,
            top: a.top,
            zIndex: a.zIndex,
            width: `${a.widthPx}px`,
            maxWidth: 'calc(100vw - 8px)',
          }}
          role="dialog"
          aria-modal="false"
        >
          <div className="nicework-alert-titlebar">
            {a.variant === 'macos' && (
              <div className="nicework-mac-lights" aria-hidden>
                <span className="nicework-mac-light nicework-mac-light--red" />
                <span className="nicework-mac-light nicework-mac-light--yellow" />
                <span className="nicework-mac-light nicework-mac-light--green" />
              </div>
            )}
            {a.variant === 'camspam' && (
              <span className="nicework-live-pill" aria-hidden>
                LIVE
              </span>
            )}
            <span className="nicework-alert-title-text">{a.title}</span>
            <button
              type="button"
              className="nicework-alert-close"
              aria-label="Close"
              onClick={() => dismiss(a.id)}
            >
              ×
            </button>
          </div>
          <div className="nicework-alert-body">
            {a.imageSrc && (
              <div className="nicework-alert-image-frame">
                <img
                  src={a.imageSrc}
                  alt=""
                  className="nicework-alert-image"
                  style={{ maxHeight: a.imageMaxPx }}
                  draggable={false}
                />
              </div>
            )}
            <p className="nicework-alert-message">{a.message}</p>
            <div className="nicework-alert-actions">
              <button
                type="button"
                className="nicework-alert-ok"
                onClick={() => dismiss(a.id)}
              >
                {a.okLabel}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default NiceWorkPage;
