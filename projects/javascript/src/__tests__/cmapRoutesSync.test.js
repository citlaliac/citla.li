import fs from 'fs';
import path from 'path';
import { CMAP_SECTIONS } from '../config/cmapSections';

function extractRoutePathsFromAppJs(source) {
  const paths = [];
  const re = /<Route\s+path="([^"]+)"/g;
  let m = re.exec(source);
  while (m !== null) {
    paths.push(m[1]);
    m = re.exec(source);
  }
  return paths;
}

function flattenCmapPaths(sections) {
  const paths = [];
  for (const section of sections) {
    for (const link of section.links) {
      paths.push(link.path);
    }
  }
  return paths;
}

describe('Site map vs App routes', () => {
  let appPaths;

  beforeAll(() => {
    const appJsPath = path.join(__dirname, '..', 'App.js');
    const source = fs.readFileSync(appJsPath, 'utf8');
    appPaths = extractRoutePathsFromAppJs(source);
  });

  test('every <Route> in App.js appears on /cmap', () => {
    const cmapPaths = new Set(flattenCmapPaths(CMAP_SECTIONS));
    const missingOnCmap = [...new Set(appPaths)].filter((p) => !cmapPaths.has(p));

    expect(missingOnCmap).toEqual([]);
  });

  test('/cmap lists only routes that exist in App.js', () => {
    const appPathSet = new Set(appPaths);
    const cmapPaths = flattenCmapPaths(CMAP_SECTIONS);
    const extraOnCmap = cmapPaths.filter((p) => !appPathSet.has(p));

    expect(extraOnCmap).toEqual([]);
  });

  test('no duplicate paths in CMAP_SECTIONS', () => {
    const cmapPaths = flattenCmapPaths(CMAP_SECTIONS);
    const seen = new Set();
    const duplicates = [];

    for (const p of cmapPaths) {
      if (seen.has(p)) duplicates.push(p);
      seen.add(p);
    }

    expect(duplicates).toEqual([]);
  });
});
