# Registru assets — FIR DE FOC

Input vizual inițial: zero imagini, zero fonturi furnizate. Nicio imagine raster, niciun font web, nicio resursă externă (0 hotlinking). Toate vizualurile sunt cod scris manual în timpul rulării de agent (claude-opus-5-5) în `run/site/`; drepturi: create original pentru acest test, fără surse terțe. Niciun generator de imagini nu a fost folosit (indisponibil).

| Fișier / element | Autor-origine | Instrument | Licență / drepturi | Prompt | Dimensiuni | Bytes | Rol | Fallback |
|---|---|---|---|---|---|---|---|---|
| Favicon SVG inline (`index.html`, data URI) | agent, scris manual | editor text | original, creat în rulare | — | 32×32 viewBox | ~0.3 KB | identitate tab | fără impact |
| Marca din bară (fir + jar) `svg.brand-mark` | agent | SVG inline | original | — | 20×32 viewBox | <0.3 KB | semnătură | textul „Fir de foc” |
| Firul din hero `svg.hero-thread` (cale + ecou + tick-uri + scânteie `animateMotion`) | agent | SVG inline | original | — | 600×900 viewBox | ~1.2 KB | semnătură CALM | tipografia rămâne (vezi `evidence/anti-template/`) |
| Lumină de jar (gradient radial CSS) | agent | CSS | original | — | — | — | profunzime / lumină | fundal plat |
| Granulație de funingine (SVG `feTurbulence`, data URI CSS) | agent | CSS + SVG | original | — | tile 180×180 | ~0.5 KB | material | fără granulație |
| Firul Sezon/Foc/Gest `svg.stages-thread` | agent | SVG inline | original | — | 1200×120 viewBox | ~0.6 KB | temperatură / build | pe mobil: linie verticală CSS |
| Desene dintr-o linie: sfeclă, păstrăv, pară (`.dish-art svg`) | agent | SVG inline (căi Bézier scrise manual) | original | — | 320×260 viewBox fiecare | ~0.6 KB fiecare | ilustrație preparate (conceptuală, nu fotografie) | numele, prețul și firul rămân |
| Firul degustării (`.course-thread`, `.pair-line`) | agent | CSS | original | — | — | — | cronologie 5 feluri | listă verticală |
| Harta celor 36 de locuri (`#seats-svg`, generată procedural în JS: serpentină Catmull-Rom prin 36 de puncte) | agent | SVG + JS | original | — | 1000×380 / 600×584 viewBox | generat | SIGNATURE PEAK, ilustrativ (nu plan real, nu disponibilitate) | fără JS: SVG gol ascuns din arbore a11y; textul și scrubberul rămân |
| Nodul de confirmare (`.confirm-knot`) | agent | SVG inline | original | — | 240×60 | ~0.3 KB | confirmare | text confirmare |
| Fonturi | sistem (Iowan Old Style / Palatino Linotype / Palatino / Georgia / FreeSerif; system-ui; ui-monospace) | — | fonturile sistemului vizitatorului; nimic distribuit | — | — | 0 | tipografie | stive cu fallback generic |

Nicio fotografie nu pretinde a fi a restaurantului. Spațiul este reprezentat abstract și etichetat „Ilustrație … Nu arată disponibilitatea reală.”
