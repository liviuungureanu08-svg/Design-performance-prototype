// B8 — Remove Asset: ascunde ilustrațiile (firul din hero și desenele preparatelor) și capturează pagina.
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
  await p.goto('http://127.0.0.1:4174/', { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: '.hero-thread, .hero-glow, .dish-art { display: none !important; }' });
  await p.screenshot({ path: `../evidence/anti-template/remove-asset-${w}x${h}.png`, fullPage: true });
  await p.close();
}
await b.close();
console.log('ok');
