// Packs the production build into ONE self-contained HTML fragment (inline CSS + JS, fonts as data: URIs)
// suitable for hosting as a claude.ai Artifact (no external requests needed). Output: artifact/index.html
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';

execSync('npx vite build --outDir dist-inline', { stdio: 'inherit', env: { ...process.env, INLINE: '1' } });
const html = readFileSync('dist-inline/index.html', 'utf8');
const assets = readdirSync('dist-inline/assets');
const css = readFileSync('dist-inline/assets/' + assets.find((f) => f.endsWith('.css')), 'utf8');
const js = readFileSync('dist-inline/assets/' + assets.find((f) => f.endsWith('.js')), 'utf8');
if (/<\/script/i.test(js)) throw new Error('bundle contains </script');
const body = html.slice(html.indexOf('<body>') + 6, html.indexOf('</body>')).replace(/<script[\s\S]*?<\/script>/g, '').trim();
const title = html.match(/<title>(.*?)<\/title>/)[1];
const out = `<title>${title}</title>
<style>${css}
html,body{background:#05060a;margin:0}body{min-height:100vh}</style>
${body}
<script type="module">${js}</script>
`;
mkdirSync('artifact', { recursive: true });
writeFileSync('artifact/index.html', out);
console.log('artifact/index.html', (out.length / 1024).toFixed(0) + ' kB');
