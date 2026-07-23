import { readFileSync } from 'fs';
for (const f of ['assets/images/icon.png', 'assets/images/adaptive-icon.png']) {
  const buf = readFileSync(f);
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  const colorType = buf[25];
  const ok = colorType === 2 ? '✓ RGB (Apple-safe)' : '✗ NOT RGB (colorType=' + colorType + ')';
  console.log(f + ': ' + w + 'x' + h + ' ' + ok);
}
