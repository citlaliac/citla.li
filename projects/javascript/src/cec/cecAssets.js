const PUB = process.env.PUBLIC_URL || '';
const BASE = `${PUB}/assets/catholicecloud`;

export const ASSET_DIRS = {
  worshipers: `${BASE}/worshipers`,
  /** Saint portraits live in wheel/ (some in wheel/saints/) */
  wheelSaints: `${BASE}/wheel`,
  wheelDial: `${BASE}/wheel/wheel-dial.png`,
  wheelFrame: `${BASE}/wheel/wheel-frame.png`,
};

function assetUrl(base, file) {
  if (!file) return null;
  const encoded = file
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
  return `${base}/${encoded}`;
}

/** @param {{ id: string, imageFile?: string }} avatar */
export function worshiperAvatarUrl(avatar) {
  return assetUrl(ASSET_DIRS.worshipers, avatar?.imageFile);
}

/** @param {{ id: string, imageFile?: string }} saint */
export function saintImageUrl(saint) {
  return assetUrl(ASSET_DIRS.wheelSaints, saint?.imageFile);
}
