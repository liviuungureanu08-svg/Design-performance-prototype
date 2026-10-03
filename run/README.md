# FIR DE FOC — pornire

Proiect: `run/site/` (Vite 8.3.2, HTML/CSS/JS vanilla, fără framework, fără backend).

```bash
cd run/site
npm ci                 # dependență fixată în package-lock.json (doar vite)
npm run build          # → run/site/dist/
npm run preview        # → http://127.0.0.1:4174/
```

Alternativ, fără Node: `run/site/dist/` este static și poate fi servit de orice server local (ex. `npx serve run/site/dist -l 4174`). Dacă portul 4174 e ocupat: `npx vite preview --port <alt-port> --host 127.0.0.1`.

Dovezi: `run/evidence/` · Raport: `run/final-report.md` · Blueprint: `run/blueprint.md` · Preflight: `run/preflight.md` · Assets: `run/assets-register.md` · Freeze: `run/FREEZE_MANIFEST_SHA256.json`.

Instrumente de dovadă (opționale, `run/tools/`, `npm ci` acolo): `functional.mjs`, `shot.mjs`, `remove-asset.mjs`, `reload.mjs`, `lighthouse.sh` — necesită serverul preview pe 4174 și Chromium la `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` (calea se ajustează pe alt sistem).
