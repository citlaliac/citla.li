/**
 * Pixel-alpha hit testing for stacked &lt;img&gt; elements.
 *
 * Downsides / caveats:
 * - Work per pointer event: builds or reuses an offscreen canvas, draws the image,
 *   reads one pixel (scaled cap keeps large thumbnails affordable).
 * - Memory: one cached bitmap pipeline per loaded &lt;img&gt; (invalidated on resize/src).
 * - Semi-transparent pixels need a threshold (DEFAULT_ALPHA_THRESHOLD); edge AA may feel fussy.
 * - Cross-origin images without CORS taint the canvas — we treat samples as opaque (drag still works).
 * - Animated GIF/WebP: typically first/decoded frame only (browser-dependent).
 * - Very thin features may be missed when downscaling for the cap (we use a moderate max edge).
 */

export const DEFAULT_ALPHA_THRESHOLD = 40;

/** @type {WeakMap<HTMLImageElement, { canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, dw: number, dh: number, srcKey: string }>} */
const canvasCache = new WeakMap();

const MAX_SAMPLE_EDGE_PX = 520;

export function invalidateImageAlphaCache(img) {
  canvasCache.delete(img);
}

/**
 * @param {HTMLImageElement} img
 * @param {number} clientX
 * @param {number} clientY
 * @returns {number} alpha 0–255; 255 if image not ready (avoid blocking interaction).
 */
export function getAlphaAtImagePixel(img, clientX, clientY) {
  if (!img.complete || img.naturalWidth === 0) return 255;

  const rect = img.getBoundingClientRect();
  const lx = clientX - rect.left;
  const ly = clientY - rect.top;
  if (lx < 0 || ly < 0 || lx >= rect.width || ly >= rect.height) return 0;

  const dw = Math.round(rect.width);
  const dh = Math.round(rect.height);
  const srcKey = img.currentSrc || img.src;

  let entry = canvasCache.get(img);
  if (
    !entry ||
    entry.dw !== dw ||
    entry.dh !== dh ||
    entry.srcKey !== srcKey
  ) {
    const dpr = Math.min(
      typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
      2.5
    );
    let cw = Math.max(1, Math.round(dw * dpr));
    let ch = Math.max(1, Math.round(dh * dpr));
    const maxDim = Math.max(cw, ch);
    if (maxDim > MAX_SAMPLE_EDGE_PX) {
      const s = MAX_SAMPLE_EDGE_PX / maxDim;
      cw = Math.max(1, Math.round(cw * s));
      ch = Math.max(1, Math.round(ch * s));
    }

    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return 255;
    try {
      ctx.drawImage(img, 0, 0, cw, ch);
    } catch {
      return 255;
    }
    entry = { canvas, ctx, dw, dh, srcKey };
    canvasCache.set(img, entry);
  }

  const { canvas, ctx } = entry;
  const px = Math.min(
    canvas.width - 1,
    Math.max(0, Math.floor((lx / rect.width) * canvas.width))
  );
  const py = Math.min(
    canvas.height - 1,
    Math.max(0, Math.floor((ly / rect.height) * canvas.height))
  );

  try {
    const data = ctx.getImageData(px, py, 1, 1).data;
    return data[3];
  } catch {
    return 255;
  }
}

/**
 * Highest z-index item under the point whose sampled alpha meets the threshold.
 *
 * @param {Array<{ id: string, z: number }>} items
 * @param {number} clientX
 * @param {number} clientY
 * @param {(id: string) => HTMLImageElement | undefined} getImg
 * @param {number} [threshold]
 * @returns {{ item: typeof items[0], img: HTMLImageElement } | null}
 */
export function hitTopOpaqueItem(items, clientX, clientY, getImg, threshold) {
  const t = threshold ?? DEFAULT_ALPHA_THRESHOLD;
  const sorted = [...items].sort((a, b) => b.z - a.z);
  for (const item of sorted) {
    const img = getImg(item.id);
    if (!img) continue;
    const rect = img.getBoundingClientRect();
    if (
      clientX < rect.left ||
      clientX >= rect.right ||
      clientY < rect.top ||
      clientY >= rect.bottom
    ) {
      continue;
    }
    const alpha = getAlphaAtImagePixel(img, clientX, clientY);
    if (alpha >= t) {
      return { item, img };
    }
  }
  return null;
}
