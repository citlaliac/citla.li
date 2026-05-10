/**
 * Writes public/assets/movethingsaround/manifest.json listing image filenames.
 * Run via prebuild / prestart so /movethingsaround includes every image in that folder.
 */
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../public/assets/movethingsaround');
const IMAGE_EXT = /\.(png|jpe?g|gif|webp)$/i;

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const names = fs.readdirSync(dir).filter((f) => {
  if (f === 'manifest.json' || f === 'PUT_IMAGES_HERE.txt') return false;
  return IMAGE_EXT.test(f);
});

names.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

const outPath = path.join(dir, 'manifest.json');
fs.writeFileSync(outPath, `${JSON.stringify(names)}\n`, 'utf8');
console.log(`movethings manifest: ${names.length} image(s) → ${path.relative(process.cwd(), outPath)}`);
