/**
 * MoodMap AI — App Icon Generator
 * Generates 1024×1024 icon.png and adaptive-icon.png using the `canvas` package.
 * Falls back to a pure-Node PNG writer if canvas is unavailable.
 */

import { createWriteStream, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'assets', 'images');

mkdirSync(OUT_DIR, { recursive: true });

// ─── Try canvas approach first ───────────────────────────────────────────────
let canvasAvailable = false;
try {
  const { createCanvas } = await import('canvas');
  canvasAvailable = true;

  function drawIcon(size, padding) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // ── Background: radial gradient #5BA4E6 → #2E6DB4 ──
    const grad = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size * 0.72
    );
    grad.addColorStop(0, '#5BA4E6');
    grad.addColorStop(1, '#2E6DB4');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // ── Subtle white wave at bottom ──
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    const waveY = size * 0.78;
    ctx.moveTo(0, waveY);
    ctx.bezierCurveTo(
      size * 0.25, waveY - size * 0.06,
      size * 0.5,  waveY + size * 0.06,
      size * 0.75, waveY - size * 0.04
    );
    ctx.bezierCurveTo(
      size * 0.875, waveY - size * 0.07,
      size * 0.95,  waveY + size * 0.02,
      size, waveY
    );
    ctx.lineTo(size, size);
    ctx.lineTo(0, size);
    ctx.closePath();
    ctx.fill();

    // Second wave layer
    ctx.globalAlpha = 0.08;
    ctx.beginPath();
    const waveY2 = size * 0.86;
    ctx.moveTo(0, waveY2);
    ctx.bezierCurveTo(
      size * 0.3,  waveY2 - size * 0.05,
      size * 0.6,  waveY2 + size * 0.05,
      size * 0.85, waveY2 - size * 0.03
    );
    ctx.bezierCurveTo(
      size * 0.92, waveY2 - size * 0.04,
      size * 0.97, waveY2 + size * 0.01,
      size, waveY2
    );
    ctx.lineTo(size, size);
    ctx.lineTo(0, size);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // ── Map pin / location marker ──
    const cx = size / 2;
    // Pin center (slightly above center of canvas)
    const pinCenterX = cx;
    const pinCenterY = size * (0.42 - padding * 0.1);
    const pinRadius = size * (0.22 - padding * 0.08);
    const pinTailLen = pinRadius * 1.35;

    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0,0,0,0.18)';
    ctx.shadowBlur = size * 0.025;
    ctx.shadowOffsetY = size * 0.012;

    // Draw teardrop pin shape
    ctx.beginPath();
    // Top arc (circle part of pin)
    ctx.arc(pinCenterX, pinCenterY, pinRadius, Math.PI * 0.15, Math.PI * 0.85, false);
    // Left side curves down to point
    const pinBottom = pinCenterY + pinRadius + pinTailLen;
    ctx.bezierCurveTo(
      pinCenterX - pinRadius * 0.85, pinCenterY + pinRadius * 1.1,
      pinCenterX - pinRadius * 0.3,  pinBottom - pinRadius * 0.3,
      pinCenterX, pinBottom
    );
    // Right side curves back up
    ctx.bezierCurveTo(
      pinCenterX + pinRadius * 0.3,  pinBottom - pinRadius * 0.3,
      pinCenterX + pinRadius * 0.85, pinCenterY + pinRadius * 1.1,
      pinCenterX + pinRadius * Math.cos(Math.PI * 0.15),
      pinCenterY + pinRadius * Math.sin(Math.PI * 0.15)
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // ── Heart inside the pin ──
    const heartCx = pinCenterX;
    const heartCy = pinCenterY - pinRadius * 0.05;
    const heartSize = pinRadius * 0.48;

    ctx.save();
    // Use the gradient color so heart "punches through" the white pin
    const heartGrad = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size * 0.72
    );
    heartGrad.addColorStop(0, '#5BA4E6');
    heartGrad.addColorStop(1, '#2E6DB4');
    ctx.fillStyle = heartGrad;

    ctx.beginPath();
    ctx.moveTo(heartCx, heartCy + heartSize * 0.35);
    // Left lobe
    ctx.bezierCurveTo(
      heartCx - heartSize * 0.05, heartCy + heartSize * 0.1,
      heartCx - heartSize * 0.9,  heartCy - heartSize * 0.5,
      heartCx - heartSize * 0.5,  heartCy - heartSize * 0.85
    );
    ctx.bezierCurveTo(
      heartCx - heartSize * 0.2,  heartCy - heartSize * 1.1,
      heartCx,                     heartCy - heartSize * 0.85,
      heartCx,                     heartCy - heartSize * 0.6
    );
    // Right lobe
    ctx.bezierCurveTo(
      heartCx,                     heartCy - heartSize * 0.85,
      heartCx + heartSize * 0.2,  heartCy - heartSize * 1.1,
      heartCx + heartSize * 0.5,  heartCy - heartSize * 0.85
    );
    ctx.bezierCurveTo(
      heartCx + heartSize * 0.9,  heartCy - heartSize * 0.5,
      heartCx + heartSize * 0.05, heartCy + heartSize * 0.1,
      heartCx,                     heartCy + heartSize * 0.35
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    return canvas;
  }

  // icon.png — full bleed
  const iconCanvas = drawIcon(1024, 0);
  await new Promise((resolve, reject) => {
    const out = createWriteStream(join(OUT_DIR, 'icon.png'));
    iconCanvas.createPNGStream().pipe(out);
    out.on('finish', resolve);
    out.on('error', reject);
  });
  console.log('✓ icon.png written');

  // adaptive-icon.png — same design, content within center 66% safe zone
  const adaptiveCanvas = drawIcon(1024, 0.17);
  await new Promise((resolve, reject) => {
    const out = createWriteStream(join(OUT_DIR, 'adaptive-icon.png'));
    adaptiveCanvas.createPNGStream().pipe(out);
    out.on('finish', resolve);
    out.on('error', reject);
  });
  console.log('✓ adaptive-icon.png written');

} catch (err) {
  console.warn('canvas not available, falling back to pure-Node PNG writer:', err.message);
  canvasAvailable = false;
}

// ─── Pure-Node PNG fallback ───────────────────────────────────────────────────
if (!canvasAvailable) {
  /**
   * Minimal PNG encoder — RGB (no alpha), 1024×1024.
   * Design: radial-ish gradient background + white circle + white map pin.
   */

  const SIZE = 1024;

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  // Parse hex color to [r,g,b]
  function hex(h) {
    const n = parseInt(h.replace('#', ''), 16);
    return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
  }

  const CENTER_COLOR = hex('#5BA4E6');
  const EDGE_COLOR   = hex('#2E6DB4');
  const WHITE        = [255, 255, 255];

  function isInCircle(x, y, cx, cy, r) {
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
  }

  // Simple teardrop pin: circle top + triangle bottom
  function isInPin(x, y) {
    const cx = SIZE / 2;
    const cy = SIZE * 0.40;
    const r  = SIZE * 0.18;
    // Circle part
    if (isInCircle(x, y, cx, cy, r)) return true;
    // Triangle tail
    const tipY = cy + r + r * 1.3;
    if (y < cy || y > tipY) return false;
    const t = (y - cy) / (tipY - cy);
    const halfW = r * (1 - t);
    return Math.abs(x - cx) <= halfW;
  }

  // Heart inside pin (punched out — use bg color)
  function isInHeart(x, y) {
    const cx = SIZE / 2;
    const cy = SIZE * 0.38;
    const s  = SIZE * 0.09;
    // Normalize
    const nx = (x - cx) / s;
    const ny = (y - cy) / s;
    // Heart equation: (x²+y²-1)³ - x²y³ ≤ 0
    const val = (nx*nx + ny*ny - 1) ** 3 - nx*nx * ny*ny*ny;
    return val <= 0;
  }

  // Build raw pixel data
  const pixels = new Uint8Array(SIZE * SIZE * 3);
  const halfSize = SIZE / 2;

  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const idx = (row * SIZE + col) * 3;
      const dx = col - halfSize;
      const dy = row - halfSize;
      const dist = Math.sqrt(dx*dx + dy*dy) / (halfSize * 0.9);
      const t = clamp(dist, 0, 1);

      // Background gradient
      let r = lerp(CENTER_COLOR[0], EDGE_COLOR[0], t);
      let g = lerp(CENTER_COLOR[1], EDGE_COLOR[1], t);
      let b = lerp(CENTER_COLOR[2], EDGE_COLOR[2], t);

      // White pin
      if (isInPin(col, row)) {
        r = WHITE[0]; g = WHITE[1]; b = WHITE[2];
      }

      // Heart cutout (bg color)
      if (isInHeart(col, row)) {
        r = lerp(CENTER_COLOR[0], EDGE_COLOR[0], t);
        g = lerp(CENTER_COLOR[1], EDGE_COLOR[1], t);
        b = lerp(CENTER_COLOR[2], EDGE_COLOR[2], t);
      }

      pixels[idx]     = Math.round(r);
      pixels[idx + 1] = Math.round(g);
      pixels[idx + 2] = Math.round(b);
    }
  }

  function writePNG(filePath, pixelData, width, height) {
    return new Promise((resolve, reject) => {
      // PNG signature
      const sig = Buffer.from([137,80,78,71,13,10,26,10]);

      // IHDR chunk
      function makeChunk(type, data) {
        const typeBuf = Buffer.from(type, 'ascii');
        const len = Buffer.alloc(4);
        len.writeUInt32BE(data.length, 0);
        const crcBuf = Buffer.alloc(4);
        // CRC32 of type + data
        let crc = 0xffffffff;
        const crcTable = makeCRCTable();
        for (const byte of typeBuf) crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff];
        for (const byte of data)    crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff];
        crc = (crc ^ 0xffffffff) >>> 0;
        crcBuf.writeUInt32BE(crc, 0);
        return Buffer.concat([len, typeBuf, data, crcBuf]);
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

      const ihdrData = Buffer.alloc(13);
      ihdrData.writeUInt32BE(width, 0);
      ihdrData.writeUInt32BE(height, 4);
      ihdrData[8]  = 8;  // bit depth
      ihdrData[9]  = 2;  // color type: RGB
      ihdrData[10] = 0;  // compression
      ihdrData[11] = 0;  // filter
      ihdrData[12] = 0;  // interlace
      const ihdr = makeChunk('IHDR', ihdrData);

      // Raw image data: filter byte (0) + RGB row
      const rawRows = Buffer.alloc(height * (1 + width * 3));
      for (let row = 0; row < height; row++) {
        rawRows[row * (1 + width * 3)] = 0; // filter: None
        pixelData.copy(rawRows, row * (1 + width * 3) + 1, row * width * 3, (row + 1) * width * 3);
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

  const pixelBuf = Buffer.from(pixels.buffer);
  await writePNG(join(OUT_DIR, 'icon.png'), pixelBuf, SIZE, SIZE);
  console.log('✓ icon.png written (fallback)');
  await writePNG(join(OUT_DIR, 'adaptive-icon.png'), pixelBuf, SIZE, SIZE);
  console.log('✓ adaptive-icon.png written (fallback)');
}

console.log('Done! Icons saved to assets/images/');
