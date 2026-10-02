// One self-contained review file (inline CSS/JS, font as data URI; opens from file:// with no server). usage: node qa/pack.mjs
import { readFileSync, writeFileSync } from 'node:fs';
const strip = (f) => readFileSync(f, 'utf8').replace(/^import .*$/gm, '').replace(/^export (const|class|function)/gm, '$1').replace(/^\/\/ @ts-check$/m, '');
const font = readFileSync('fonts/inter-latin-wght-normal.woff2').toString('base64');
const css = readFileSync('style.css', 'utf8').replace(/url\('fonts\/inter-latin-wght-normal\.woff2'\)/g, `url(data:font/woff2;base64,${font})`);
const js = [strip('data.js'), strip('field.js'), strip('main.js')].join('\n');
if (/<\/script/i.test(js)) throw new Error('</script in bundle');
let html = readFileSync('index.html', 'utf8')
  .replace(/<link rel="preload"[^>]*>\s*/, '')
  .replace('<link rel="stylesheet" href="style.css" />', () => `<style>${css}</style>`)
  .replace('<script type="module" src="main.js"></script>', () => `<script type="module">${js}</script>`);
writeFileSync('INBOUND_review.html', html);
console.log('INBOUND_review.html', (html.length / 1024).toFixed(0) + ' kB');
