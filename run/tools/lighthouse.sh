#!/usr/bin/env bash
# B7 — 3 rulări cold-cache, mobil 390×844 (DPR 3), throttling simulat Lighthouse implicit
# (RTT 150 ms, 1.6 Mbps, CPU 4×). Serverul: `npm run preview` în run/site (port 4174).
set -euo pipefail
OUT=${1:-../evidence/lighthouse}
mkdir -p "$OUT"
export CHROME_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome
for i in 1 2 3; do
  npx lighthouse http://127.0.0.1:4174/ \
    --quiet --output=json --output=html --output-path="$OUT/run-$i" \
    --form-factor=mobile --screenEmulation.mobile=true --screenEmulation.width=390 --screenEmulation.height=844 --screenEmulation.deviceScaleFactor=3 \
    --throttling-method=simulate --only-categories=performance,accessibility,best-practices \
    --chrome-flags="--headless=new --no-sandbox --user-data-dir=$(mktemp -d) --disable-gpu"
done
node -e '
const fs=require("fs");const out=process.argv[1];const rows=[];
for(const i of [1,2,3]){const r=JSON.parse(fs.readFileSync(`${out}/run-${i}.report.json`));const a=r.audits;
rows.push({run:i,LCP_ms:Math.round(a["largest-contentful-paint"].numericValue),CLS:+a["cumulative-layout-shift"].numericValue.toFixed(4),TBT_ms:Math.round(a["total-blocking-time"].numericValue),FCP_ms:Math.round(a["first-contentful-paint"].numericValue),perf:r.categories.performance.score,a11y:r.categories.accessibility.score,bp:r.categories["best-practices"].score,lh:r.lighthouseVersion,ua:r.environment.hostUserAgent});}
const med=k=>{const v=rows.map(r=>r[k]).sort((a,b)=>a-b);return v[1]};
const summary={rows,median:{LCP_ms:med("LCP_ms"),CLS:med("CLS"),TBT_ms:med("TBT_ms"),FCP_ms:med("FCP_ms"),perf:med("perf"),a11y:med("a11y")}};
fs.writeFileSync(`${out}/summary.json`,JSON.stringify(summary,null,2));console.log(JSON.stringify(summary,null,2));' "$OUT"
