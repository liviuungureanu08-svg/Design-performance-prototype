# Blueprint — FIR DE FOC (OR-PS-01)

Run ID: ORPS01-CC55OPUS-20261003T0154Z · model real: claude-opus-5-5 (get_session) · root: `/home/user/Design-performance-prototype` · input digest: ZIP `6c0664…481ff`, manifest 15/15 OK · mod surse: REFERENCE_ONLY

## project_truth
- Fapte autorizate (toate fictive): restaurant contemporan, Brașov, Strada Atelierului 12; Ma–Du 18:00–23:00, luni închis; meniu sezonier; gătit la foc; 36 de locuri; 3 preparate cu prețuri (48 / 92 / 38 RON); degustare 5 feluri 240 RON/pers.; asociere băuturi opțională 110 RON.
- Limite: fără premii, testimoniale, origini exacte, certificări, disponibilitate reală; fără fotografii; rezervarea este demonstrativă.
- Necunoscute (nu se inventează): componența celor 5 feluri ale degustării, bucătarul, interiorul real, temperaturi/tehnici exacte, telefon/email, coordonate hartă.

## experience_promise
Omul simte căldura unei seri compuse în jurul focului și înțelege, fără efort, ce gătește FIR DE FOC, cât costă, când e deschis și cum cere o masă.

## premium_tensions (5)
1. **Bogat ↔ curat** — straturi multe (granulație, lumină de jar, linie, tipografie, ilustrație liniară) pe o paletă de 3 tonuri și o singură linie conducătoare.
2. **Dens ↔ respirabil** — meniul și degustarea sunt zone dense de informație; între ele, o zonă de release pe fond deschis („cenușă/hârtie”) cu o singură frază.
3. **Animat ↔ stabil** — mișcarea este lentă, legată de foc (jar care respiră, scânteie pe fir); layoutul nu se mișcă, nu există scroll hijack.
4. **Neașteptat ↔ inevitabil** — firul incandescent pare surprinzător, dar e literal numele: „fir de foc”.
5. **Sofisticat ↔ comercial** — preț, program și CTA sunt mereu la un gest distanță; calculul degustării și rezervarea folosesc același limbaj vizual.

## structural_exploration
- **A. „Firul continuu”** — o singură linie incandescentă coboară prin pagină și devine diviziune, ilustrație, cronologie a degustării, scală a serii și selector de oră. Scroll vertical clasic, arc dramatic prin temperatura firului (rece→jar→odihnă).
- **B. „Masa de foc” split-screen** — coloană stângă sticky cu un foc procedural care se schimbă pe secțiuni, dreapta conținut. Respins: pe mobil se reduce la un banner, depinde de un singur asset (foc), risc Remove Asset/FM05.
- **C. „Roata sezonului”** — navigație circulară pe anotimpuri. Respins: ar cere inventarea produselor pe sezoane (truth) și o interacțiune neconvențională pentru sarcina simplă program+meniu+rezervare.
- **Ales: A** — derivă direct din nume (Logo Swap fail-safe), funcționează identic pe mobil, se manifestă în informație, nu doar decor.

## richness_strategy
Bogăția vine din straturi distribuite pe arc, nu din efecte simultane: hero = tipografie + lumină; filosofie = linie + temperatură; meniu = ilustrație liniară + preț; release = tipografie pe hârtie; degustare = cronologie + calcul; seara = 36 de puncte de lumină + scrubber; rezervare = formular calm cu ecouri de semnătură.

## layer_system
| Strat | Intensitate | Zonă | Scop | Cost |
|---|---|---|---|---|
| Structural (grilă 12 col., margini mari) | mediu constant | tot | ordine | 0 |
| Tipografic (serif display mare + sans + mono pentru cifre) | ridicat în hero/release, mediu în rest | tot | voce, ierarhie | fonturi sistem, 0 KB |
| Material/textural (granulație de funingine; hârtie caldă în release) | scăzut | fundaluri | materialitate | 1 tile SVG mic |
| Ilustrativ (desene dintr-o singură linie pentru cele 3 preparate) | mediu | meniu | identifică preparatul fără fotografie | SVG inline |
| Profunzime (glow → conținut → fir deasupra) | mediu | hero, meniu, seara | adâncime | gradient CSS |
| Luminos (jar radial care respiră, temperatura firului) | ridicat în hero și seara, scăzut în rest | hero, seara | căldură | CSS anim. |
| Micro-detaliu (tick-uri, numerotare, cifre tabulare, „RON” mic) | mediu | meniu, degustare, program | craft | 0 |
| Temporal (firul se desenează la intrarea în secțiune; scânteie) | mediu | tot | continuitate | IO + CSS |
| Interactiv (preparate „notate”, calculator, scrubber, formular) | ridicat în zonele funcționale | meniu, degustare, seara, rezervare | utilitate | JS mic |
| Informațional (program pe 7 zile cu luni stins) | mediu | contact | claritate | 0 |

## material_system
Funingine `#14110f` / cărbune `#1d1916` / os-cenușă `#efe6d8` / jar `#e8622c` / incandescent `#ffb35c` / cenușă rece `#9aa69e` pentru „crud”. Release: hârtie `#efe6d8` cu text funingine. Granulație ≤ 4% opacitate.

## depth_strategy
Trei planuri: (1) fundal + granulație, (2) lumină radială care urmează firul, (3) conținut și firul, care trece „peste” secțiuni ca un element continuu. Fără umbre generice de card.

## lighting_strategy
O singură sursă conceptuală — focul. Lumina e caldă și jos în hero, se stinge spre release (hârtie, lumină de zi), revine în seară și se odihnește în rezervare. Scrubber-ul serii mută temperatura luminii de la amurg la jar.

## composition_arc
| Zonă | Arc | Motiv |
|---|---|---|
| Hero — nume, promisiune, program, CTA | CALM | o linie, un nume, aer |
| Foc & sezon — Sezon / Foc / Gest | BUILD | firul își schimbă temperatura |
| Meniu — 3 preparate | PEAK | ilustrație + preț + interacțiune „notează” |
| Release — frază pe hârtie | RELEASE | lumină de zi, fără efecte |
| Degustare — 5 feluri + calcul | BUILD | cronologia firului, informație |
| Seara — 36 de locuri, 18:00→23:00 | SIGNATURE PEAK | firul trece prin 36 de puncte de lumină |
| Rezervare + adresă/program | RESOLUTION | formular calm, nodul final |

## motion_layers
| Tip | Ce | Declanșator | Timing | Amplitudine | Prioritate | Reduced-motion |
|---|---|---|---|---|---|---|
| Ambient | jarul din hero respiră | permanent, doar vizibil (IO) | 6–9 s ease-in-out | opacitate ±0.15 | scăzută | static |
| Ambient | scânteie pe firul hero | permanent, doar vizibil | 7 s | punct mic | scăzută | ascunsă |
| Narrative | firul se desenează la intrarea secțiunii | IntersectionObserver | 1.4–2 s | stroke-dashoffset | medie | desenat complet |
| Narrative | seara: 36 locuri se aprind cu ora | range input (utilizator) | 300 ms | opacitate, culoare | ridicată | instant, fără tranziție |
| Responsive | preparatul încălzește segmentul de fir | hover/focus/tap | 250 ms | culoare, grosime | ridicată | instant |
| Responsive | selectoare oră/persoane | click/tastatură | 180 ms | culoare | ridicată | instant |
| Narrative | confirmare: nod pe fir | submit valid | 900 ms | desen nod | medie | static |
Fără flash, fără preloader, fără scroll hijack, fără cursor custom.

## interaction_logic
- Navigare: ancore reale; pe mobil buton meniu cu `aria-expanded`, Escape închide, focus revine.
- Preparate: buton „Notează pentru seara mea” (aria-pressed); preparatele notate apar în formular ca „Preparate notate” (în memorie, nu sunt stocate) și în confirmare.
- Degustare: persoane 1–6 (stepper) + asociere băuturi (switch) → total estimat live (`aria-live="polite"`).
- Seara: `input type=range` 18:00–23:00, pas 30 min; text și lumină se schimbă; complet accesibil la tastatură.
- Formular: nume, email, dată (azi sau viitor; luni respinsă — închis; azi doar dacă ora e încă în viitor), oră (radio 18:00/19:30/21:00), persoane (radio 1–6). Validare la submit + la blur după prima încercare, `aria-invalid`, mesaje legate prin `aria-describedby`, rezumat de erori focusat. `method="dialog"` ca fără JS să nu existe nicio trimitere. Confirmare locală vizibilă cu mențiunea demonstrativă; buton „Cerere nouă”.

## signature_system
**Regula „Firului”:** există o singură linie incandescentă de 1.5 px a cărei temperatură (cenușă rece → jar → alb incandescent → odihnă) spune în ce etapă a focului se află conținutul. Tot ce e de semnătură este desenat cu această linie.
Manifestări: (1) hero — firul urcă și devine flacără/scânteie sub nume; (2) Sezon/Foc/Gest — firul trece prin trei temperaturi; (3) preparatele sunt desenate dintr-o singură linie, cu același stroke; (4) degustarea — 5 noduri pe fir; (5) seara — firul leagă 36 de puncte (locurile); (6) rezervare — orele sunt noduri pe fir, persoanele sunt locuri; confirmarea leagă un nod. (7) footer — firul se termină în jar.

## craft_density_plan
Cifre tabulare și „RON” în versaliție mică; numerotare 01–03; tick-uri de temperatură; aliniere preț pe linie punctată; ghilimele și cratime românești corecte (–, „ ”); diacritice cu virgulă (ș, ț); focus ring jar 2 px cu offset; stări hover/pressed/disabled/error/success desenate; programul pe 7 zile cu luni „stins”; selectorul de ore pe fir.

## peak_moments
Meniu (PEAK), Seara cu 36 de locuri (SIGNATURE PEAK), plus momentul mic al confirmării (nodul).

## restraint_zones
Release pe hârtie (o frază), filosofia (text + fir, fără ilustrații), formularul (fără animație decorativă), footer.

## anti_template_proof
- Logo Swap: semnătura este literal numele „fir de foc”; preparatele, prețurile, cele 36 de locuri și programul sunt structurale. Alt restaurant ar pierde motivul firului.
- Industry Swap: un barber nu are „temperatură a ingredientului”, degustare în 5 feluri sau seară 18–23 cu 36 de locuri.
- Remove Asset: nu există un asset principal; dacă scoatem ilustrațiile preparatelor rămân firul, tipografia, lumina și ritmul.

## anti_demo_proof
Bogăția continuă după hero: meniul interactiv legat de rezervare, calculatorul de degustare, seara cu 36 de locuri, formularul complet cu stări reale, programul pe 7 zile.

## asset_plan
Zero imagini raster. SVG/CSS create manual în rulare (autor: agentul, drepturi: create pentru acest test). Granulație = SVG `feTurbulence` inline. Fonturi sistem. Alternativă fără ilustrații: firul + tipografia rămân. Registru în `run/assets-register.md`.

## performance_budget
HTML+CSS+JS < 60 KB gzip total; 0 requesturi externe; 0 fonturi web; LCP = text hero; animații doar transform/opacity/stroke-dashoffset; IO oprește ambientul în afara viewportului.

## tradeoffs
- Fără fotografie → spațiul e reprezentat abstract (36 de puncte), declarat ilustrativ; mai puțină „poftă” imediată decât o fotografie.
- Fonturi sistem → randare diferită între OS; stivele sunt alese pentru serif-uri clasice (Palatino/Iowan/Georgia).
- Componența celor 5 feluri nu e cunoscută → afișată ca structură (5 noduri), nu inventată.
