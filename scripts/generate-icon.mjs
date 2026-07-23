/**
 * MoodMap AI — App Icon Generator
 * Pure-Node RGB PNG writer. No canvas dependency.
 * Outputs 1024×1024 RGB (color type 2, no alpha) — required by Apple.
 */

import { createWriteStream, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'assets', 'images');
mkdirSync(OUT_DIR, { recursive: true });

const SIZE = 1024;

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function hex(h) {
  const n = parseInt(h.replace('#', ''), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

const CENTER_COLOR = hex('#5BA4E6');
const EDGE_COLOR   = hex('#2E6DB4');

function isInPin(x, y, cx, cy, r) {
  // Circle top of pin
  if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) return true;
  // Teardrop tail
  const tipY = cy + r + r * 1.3;
  if (y < cy || y > tipY) return false;
  const t = (y - cy) / (tipY - cy);
  const halfW = r * (1 - t);
  return Math.abs(x - cx) <= halfW;
}

function isInHeart(x, y, cx, cy, s) {
  const nx = (x - cx) / s;
  const ny = -(y - cy) / s; // flip y so heart points up
  const val = (nx*nx + ny*ny - 1) ** 3 - nx*nx * ny*ny*ny;
  return val <= 0;
}

function buildPixels(size, pinScale) {
  const pixels = Buffer.alloc(size * size * 3);
  const half = size / 2;
  const cx = half;
  const cy = size * 0.40;
  const r  = size * 0.18 * pinScale;
  const heartCx = cx;
  const heartCy = cy - r * 0.05;
  const heartS  = r * 0.42;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const idx = (row * size + col) * 3;
      const dx = col - half;
      const dy = row - half;
      const dist = Math.sqrt(dx*dx + dy*dy) / (half * 0.9);
      const t = clamp(dist, 0, 1);

      // Background gradient
      let pr = lerp(CENTER_COLOR[0], EDGE_COLOR[0], t);
      let pg = lerp(CENTER_COLOR[1], EDGE_COLOR[1], t);
      let pb = lerp(CENTER_COLOR[2], EDGE_COLOR[2], t);

      // White pin
      if (isInPin(col, row, cx, cy, r)) {
        pr = 255; pg = 255; pb = 255;
      }

      // Heart cutout (bg color punched through pin)
      if (isInHeart(col, row, heartCx, heartCy, heartS)) {
        pr = lerp(CENTER_COLOR[0], EDGE_COLOR[0], t);
        pg = lerp(CENTER_COLOR[1], EDGE_COLOR[1], t);
        pb = lerp(CENTER_COLOR[2], EDGE_COLOR[2], t);
      }

      pixels[idx]     = Math.round(pr);
      pixels[idx + 1] = Math.round(pg);
      pixels[idx + 2] = Math.round(pb);
    }
  }
  return pixels;
}

function makeCRCTable() {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
}
const CRC_TABLE = makeCRCTable();

function crc32(buf) {
  let crc = 0xffffffff;
  for (const byte of buf) crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ byte) & 0xff];
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const combined = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(combined), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function writePNG(filePath, pixels, width, height) {
  return new Promise((resolve, reject) => {
    const sig = Buffer.from([137,80,78,71,13,10,26,10]);

    const ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(width, 0);
    ihdrData.writeUInt32BE(height, 4);
    ihdrData[8]  = 8; // bit depth
    ihdrData[9]  = 2; // color type: RGB (no alpha)
    ihdrData[10] = 0;
    ihdrData[11] = 0;
    ihdrData[12] = 0;
    const ihdr = makeChunk('IHDR', ihdrData);

    const rowSize = 1 + width * 3;
    const rawRows = Buffer.alloc(height * rowSize);
    for (let row = 0; row < height; row++) {
      rawRows[row * rowSize] = 0; // filter: None
      pixels.copy(rawRows, row * rowSize + 1, row * width * 3, (row + 1) * width * 3);
    }

    zlib.deflate(rawRows, { level: 6 }, (err, compressed) => {
      if (err) return reject(err);
      const idat = makeChunk('IDAT', compressed);
      const iend = makeChunk('IEND', Buffer.alloc(0));
      const png  = Buffer.concat([sig, ihdr, idat, iend]);
      const ws   = createWriteStream(filePath);
      ws.write(png);
      ws.end();
      ws.on('finish', resolve);
      ws.on('error', reject);
    });
  });
}

// icon.png — full bleed 1024×1024
const iconPixels = buildPixels(SIZE, 1.0);
await writePNG(join(OUT_DIR, 'icon.png'), iconPixels, SIZE, SIZE);
console.log('✓ icon.png written (RGB, no alpha)');

// adaptive-icon.png — content scaled to 66% safe zone
const adaptivePixels = buildPixels(SIZE, 0.82);
await writePNG(join(OUT_DIR, 'adaptive-icon.png'), adaptivePixels, SIZE, SIZE);
console.log('✓ adaptive-icon.png written (RGB, no alpha)');

console.log('Done!');
