# Build gate comun
B1 Reproducibilitate: instalare și build curate în propriul root; notează comanda, exit code, versiuni și lockfile. Pentru static fără build verifică servirea și resursele.
B2 Funcții: testează navigație, fiecare CTA, meniu și rezervare validă/invalidă. Datele nu pleacă în rețea și nu sunt persistate.
B3 Responsive: inspectează 1440×900, 1024×768, 390×844 și 320×568; zero overflow orizontal, text tăiat sau CTA inaccesibil.
B4 Accesibilitate: numai tastatură, focus vizibil, etichete/form errors, ordine logică, semantică, contrast text normal ≥4.5:1, text mare ≥3:1, controls/focus ≥3:1. Nu bloca scrollul sau selecția.
B5 Motion: prefers-reduced-motion oferă compoziție completă cu efecte reduse; conținut vizibil dacă animația/JS de decor eșuează. Fără flash >3 Hz, scroll hijack, preloader blocant sau cursor necesar navigării.
B6 Stabilitate: fără erori runtime, resurse lipsă sau layout shifts evidente; test rece și reîncărcare. Efectele se opresc când nu sunt vizibile.
B7 Performanță: audit local production, același browser/device/emulare la ambele. 3 rulări cold-cache la 390×844, același profil mobile throttling documentat; raportează medianele și valorile individuale. Ținte de laborator: LCP ≤2.5s, CLS ≤0.1, TBT ≤200ms. Nu prezenta TBT ca INP sau date de teren. Țintele sunt reguli noi ale acestui test. Lipsa instrumentului = UNVERIFIED și limitare explicită; operatorul rulează același audit înainte de verdictul build.
B8 Specificitate: dovezi Logo Swap, Industry Swap, Remove Asset, plus cel puțin două zone semnificative dincolo de hero. Nu este cerință de efecte peste tot.
B9 Finisaj: fără default neintenționat, schelet de secțiune sau conținut factual inventat; stări hover/focus/touch/error/success coerente.
B10 Integritate: manifesturi, izolarea și Core read-only verificate.

Dovezi în run/evidence/: screenshots cu viewport indicat, scurt recording al parcurgerii și formularului dacă disponibil, loguri build/audit, capturi reduced-motion și focus, inventar assets/licențe. Nu fabrica dovezi când instrumentul lipsește.
PASS doar dacă B1–B10 trec; orice defect critic sau check relevant UNVERIFIED → NEEDS_FIX / UNVERIFIED. Agentul poate propune pregătirea, nu certifica percepția premium.
Nu adăuga suite de teste care reproduc CSS; prioritizează fluxurile reale și verificarea vizuală.