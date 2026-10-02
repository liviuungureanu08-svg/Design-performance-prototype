// Packs the production build into ONE self-contained HTML fragment (inline CSS + JS, fonts as data: URIs)
// suitable for hosting as a claude.ai Artifact (no external requests needed).
// usage: node scripts/pack-artifact.mjs [page]   (page = index | exp02; output artifact/<page>.html)
import { execSync } from 'node:child_process';
const PAGE = process.argv[2] ?? 'index';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';

execSync('npx vite build --outDir dist-inline --emptyOutDir', { stdio: 'inherit', env: { ...process.env, INLINE: '1', PAGE } });
const html = readFileSync(`dist-inline/${PAGE}.html`, 'utf8');
const assets = readdirSync('dist-inline/assets');
const css = readFileSync('dist-inline/assets/' + assets.find((f) => f.endsWith('.css')), 'utf8');
const js = readFileSync('dist-inline/assets/' + assets.find((f) => f.endsWith('.js')), 'utf8');
if (/<\/script/i.test(js)) throw new Error('bundle contains </script');
const body = html.slice(html.indexOf('<body>') + 6, html.indexOf('</body>')).replace(/<script[\s\S]*?<\/script>/g, '').trim();
const title = html.match(/<title>(.*?)<\/title>/)[1];
const out = `<meta charset="utf-8">
<title>${title}</title>
<style>${css}
html,body{background:${PAGE === 'index' ? '#05060a' : PAGE === 'exp01' ? '#ece6d9' : '#6f767b'};margin:0}body{min-height:100vh}</style>
${body}
<script type="module">${js}</script>
`;
mkdirSync('artifact', { recursive: true });
writeFileSync(`artifact/${PAGE}.html`, out);
console.log(`artifact/${PAGE}.html`, (out.length / 1024).toFixed(0) + ' kB');
