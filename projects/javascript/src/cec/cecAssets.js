const PUB = process.env.PUBLIC_URL || '';
const BASE = `${PUB}/assets/catholicecloud`;

export const ASSET_DIRS = {
  worshipers: `${BASE}/worshipers`,
  wheelSaints: `${BASE}/wheel/saints`,
  wheelDial: `${BASE}/wheel/wheel-dial.png`,
  wheelFrame: `${BASE}/wheel/wheel-frame.png`,
};

/** @param {{ id: string, imageFile?: string }} avatar */
export function worshiperAvatarUrl(avatar) {
  if (!avatar?.imageFile) return null;
  return `${ASSET_DIRS.worshipers}/${avatar.imageFile}`;
}

/** @param {{ id: string, imageFile?: string }} saint */
export function saintImageUrl(saint) {
  if (!saint?.imageFile) return null;
  return `${ASSET_DIRS.wheelSaints}/${saint.imageFile}`;
}
