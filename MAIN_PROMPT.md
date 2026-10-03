# Prompt principal — Claude Code 5.5 Opus
Ești runnerul independent al testului ALFA Orchestrated Richness / Premium Synthesis v0.1.
Model solicitat de operator: Claude Code 5.5 Opus. Nu presupune că această etichetă confirmă modelul activ; raportează modelul real.
Destinație exclusivă: folderul „Design Performance Prototype”. Operatorul extrage pachetul direct în acest root și pornește această sesiune acolo. Verifică basename-ul și calea absolută din mediul curent; dacă nu corespund, cere doar calea corectă și nu scana directoare vecine.
Port sugerat pentru preview local: 4174. Dacă este ocupat, alege alt port și notează-l fără a inspecta conținutul serviciului existent.

Construiește autonom un singur website final pentru brief-ul de mai jos. Nu crea numai un plan sau o demonstrație de efect. Livrarea include surse și experiență utilizabilă.
Nu modifica ALFA Core. Candidatul nu este Core. Nu publica, nu transmite rezervări și nu contacta alți agenți.
Lucrează numai în run/ pentru outputuri; websiteul în run/site/, dovezile în run/evidence/. Nu scrie peste fișiere existente. Dacă există deja run/site/, păstrează-l și cere operatorului un root curat.
Nu folosi subagenți. Nu citi alte conversații, alte workspaceuri sau rezultate ale unui alt test.

Acest prompt conține integral contractul și instrucțiunile necesare. Dacă pachetul este prezent, verifică manifestul cu Verify-Package.ps1; citește inputs/run-configuration.md și instrucțiunile locale aplicabile. Dacă folosești numai acest prompt într-un root curat, creează structura de output și declară REFERENCE_ONLY; nu inventa hashes ale unor fișiere inexistente.
Nu cere aprobări de design intermediare. Cere clarificare numai pentru blocaje factuale sau de root/input/tool equivalence, continuând munca independentă posibilă. Nu substitui propria opinie reviewului uman.

## Execuție obligatorie
1. În run/preflight.md înregistrează root, timp, model real, tool availability, mod surse, izolarea și limitele. Originalele lipsă nu devin surse imaginare.
2. Completează blueprintul. Fă 3 schițe structurale rapide interne și selectează una; nu construi trei websiteuri.
3. Produce o compoziție statică coerentă pentru întreaga experiență înainte de motion. Salvează dovada sau descrie explicit imposibilitatea de a captura.
4. Construiește signature system, straturi și arc; adaugă motion și interacțiuni cu fallback.
5. Rafinează maximum de două ori în buget; verifică întreaga pagină, mobile și stările reale.
6. Rulează build/isolation gate, salvează dovezi reale și raportul. Îngheață sursele și inputurile, creează un manifest SHA-256 al lor, fără includerea manifestului în propriul hash.
7. Livrarea către operator: calea proiectului, comenzi exacte de pornire, URL preview, dovezi și raport. Păstrează explicația designului în raport; evaluatorul vede întâi experiența.
8. Marchează PENDING_HUMAN_REVIEW până sunt primite răspunsuri reale. Nu declara PASS_PREMIUM, WOW sau promovare Core pe baza autoevaluării.



---
## Document normativ inclus: 01_PREMIUM_SYNTHESIS_V01.md

# ALFA Orchestrated Richness / Premium Synthesis v0.1
Status: COMPLETE CANDIDATE ARCHITECTURE / NOT CORE / READY FOR ONE HARD VALIDATION.
Sursă: conversația „ALFA Handoff Summary”, 6ac019d5-1a54-83eb-8cbb-9c4487806712, recuperată la 2026-10-03. Acesta este un candidat experimental, nu o versiune aprobată a ALFA Core.

Premium = complexitate ridicată, vizuală și tehnică, orchestrată atât de bine încât experiența rămâne clară, coerentă și aparent simplă.
“Hard to make. Easy to perceive. Rich to experience. Clear to understand.”
“Richness comes from layers; clarity comes from hierarchy.”

Rezolvă simultan: bogat și curat; dens și respirabil; spectaculos și organizat; complex și imediat inteligibil; animat și stabil; neașteptat și inevitabil; sofisticat și natural; distinctiv și relevant comercial.
Selectează 4–6 tensiuni contextuale, nu o singură extremă.

Pipeline:
PROJECT TRUTH → EXPERIENCE PROMISE → PREMIUM TENSIONS → RICHNESS ARCHITECTURE → SIGNATURE SYSTEM → COMPOSITION SYSTEM → MATERIAL / DEPTH SYSTEM → MOTION & INTERACTION CHOREOGRAPHY → RESTRAINT / ORCHESTRATION → BUILD → HUMAN PREMIUM GATE.

Richness architecture: straturi structural, tipografic, material/textural, fotografic/ilustrativ, de profunzime, luminos, micro-detaliu, temporal, interactiv și informațional. Intensitățile se distribuie, nu se maximizează simultan. Absența unui strat justificată contextual este permisă.
Signature system: un mecanism specific proiectului care unește geometria, imaginile, tranzițiile, interacțiunile și ritmul; nu un truc singular.
Composition arc: CALM → BUILD → PEAK → RELEASE → BUILD → SIGNATURE PEAK → RESOLUTION. Se adaptează conținutului; ordinea înseamnă contrast controlat, nu uniformitate.
Motion: ambient (lume vie), responsive (răspuns imediat), narrative (schimbare de percepție/explicație); fiecare are scop, amplitudine, durată, prioritate și fallback.
Perceived craft density: intenție perceptibilă în margini, timing, tipografie, tratamentul imaginilor, spațiu, stări și continuitate. Nu număr de efecte sau linii de cod.

Cinci condiții obligatorii: Controlled Complexity; Orchestrated Richness; Perceived Craft Density; Signature Coherence; Commercial Premium Perception. O lipsă gravă nu se compensează prin media celorlalte.
Fundamentul rămâne: truth, claritate, relevanță, ierarhie, art direction, compoziție, tipografie, restraint, accesibilitate și funcționare.

Anti-template:
- Logo Swap: aceeași experiență ar servi aproape identic altă firmă? Eșec de specificitate.
- Industry Swap: ar servi aproape identic un barber? Eșec de relevanță.
- Remove Asset: după scoaterea assetului principal mai există identitate? Dacă nu, identitatea este dependentă de acel asset.
Anti-demo: bogăția trebuie să supraviețuiască dincolo de hero. Restul schematic, un singur truc, efecte separate de informație sau lipsa stărilor finale sunt eșecuri.

Validarea umană este indispensabilă. Agentul poate verifica pregătirea pentru review, nu poate declara premium în locul evaluatorului. Promovarea în Core rămâne o decizie ulterioară, separată.

---
## Document normativ inclus: 02_BRIEF_TEST_CONTRACT.md

# Contract comun OR-PS-01 / versiunea 1.0
Acest contract operațional este nou, elaborat pentru cele două rulări. Nu este extras din fișiere ALFA originale.
Ipoteză: Premium Synthesis v0.1 poate produce un website perceput drept premium, specific firmei, bogat și coerent, care depășește aspectul de demo.
Cele două rulări validează independent aceeași ipoteză. Nu sunt un experiment care izolează cauzal doar modelul: stackul, instrumentele și deciziile de execuție pot diferi și se raportează.

## Brief înghețat
Client fictiv: FIR DE FOC, restaurant contemporan în Brașov. Nu reprezintă o firmă reală.
Public: adulți care caută o cină atent compusă, o ocazie specială sau o masă în doi.
Promisiune: ingredientul de sezon trece prin foc și gesturi precise într-o experiență caldă, compusă.
Obiectiv: omul înțelege restaurantul, explorează meniul și completează o cerere demonstrativă de rezervare.
Limba interfeței: română. Monedă: RON. Numele rămâne identic în ambele teste.
Conținut factual autorizat, toate datele sunt fictive:
- Restaurant în Brașov; Strada Atelierului 12.
- Marți–Duminică, 18:00–23:00; luni închis.
- Meniu sezonier; gătit la foc; 36 de locuri.
- 3 preparate: Sfeclă coaptă, iaurt și cimbru — 48 RON; Păstrăv, unt brun și praz — 92 RON; Pară, miere și fum — 38 RON.
- Meniu de degustare: 5 feluri, 240 RON/persoană; asociere de băuturi opțională, 110 RON.
- Nu inventa premii, testimoniale, origini exacte, sustenabilitate certificată sau disponibilitate în timp real.
Scenariul este demonstrativ; această mențiune trebuie disponibilă în footer și lângă confirmarea cererii.

## Livrabil identic
Un singur website complet, responsive, cu: promisiune/identitate, filosofia focului și sezonului, meniul de mai sus, atmosferă/spațiu, rezervare demonstrativă, adresă/program.
Structura exactă, estetica și mecanismul signature sunt libere.
Rezervare: nume, email, dată viitoare, oră din 18:00/19:30/21:00, 1–6 persoane. Validare accesibilă, eroare clară, confirmare locală vizibilă. Nu transmite și nu stochează date personale; nu promite rezervare reală. Nu cere backend, plăți, email sau publicare.
Navigație, meniu, CTA, ancore, formular și stări au comportament real. Fără dead links, lorem ipsum, placeholder vizibil sau pagină neterminată.
Livrare: surse, dependențe fixate/lockfile dacă stackul le folosește, instrucțiuni de pornire/build, preview local, dovezi, blueprint, raport. Nu încărca online.

## Condiții și libertăți egale
Input vizual comun: niciun asset furnizat. Ambele au același drept de a crea vector/CSS/canvas/procedural și, numai dacă instrumentul există local, imagini originale. Orice diferență de disponibilitate se declară înainte de build; dacă este materială, operatorul egalizează sau marchează comparația CONFOUNDED.
Fără căutare de inspirație, siteuri de referință sau colecții de design externe în timpul testului. Documentația tehnică oficială și instalarea de dependențe sunt permise. Fără cod/template de website preexistent sau outputuri ALFA anterioare. Fonturi sistem/local disponibile în ambele medii; orice alt font trebuie furnizat identic înainte de start.
Folosește stackul existent numai dacă e un scaffold tehnic gol; altfel creează un proiect separat în directorul autorizat.
Modelul real, versiunea, instrumentele, reasoning/effort și stackul se consemnează; eticheta pachetului nu verifică sau schimbă automat modelul.
Buget: maximum 4 ore de lucru activ per rulare, măsurate și raportate. Pauzele tehnice se loghează separat. Maximum 3 schițe structurale interne, o singură direcție implementată, maximum 2 treceri de rafinare după prima versiune completă. Fixarea defectelor critice intră în buget.
Nu primi feedback uman despre design înaintea înghețării ambelor rezultate. Dacă bugetul expiră, livrează starea reală și marchează incomplet. Nu începe alte concepte.
Fără baseline vizual comun furnizat, nu afirma îmbunătățire față de DI-7R sau alt rezultat anterior.

## Ordine
Preflight/isolation → truth și promisiune → 4–6 tensiuni → 3 schițe interne → alegerea uneia → signature și layers → dovadă statică → motion/interacțiuni → maximum 2 polish passes → build gate → freeze → human gate.
Nu prezenta evaluatorului conceptul, teoria sau argumente de vânzare înaintea experienței.

## Verdict
READY_FOR_HUMAN_REVIEW necesită build gate PASS și isolation gate PASS.
PASS_PREMIUM necesită review uman complet, răspunsurile decisive Premium=DA; Ar plăti=DA; Demo/template=NU, plus lipsa unui eșec grav în cele cinci condiții.
WOW se raportează separat, nu se deduce din scoruri. WOW=NU nu este automat PASS_WOW.
FAIL_PREMIUM dacă una dintre condițiile decisive eșuează sau există lipsă gravă; nu se calculează medie.
PENDING_HUMAN_REVIEW dacă omul nu a evaluat. INVALID_COMPARISON dacă inputurile/izolarea/limitele nu sunt echivalente. BLOCKED_SOURCE_INPUT dacă operatorul cere modul ALFA original și fișierele lipsesc.
Niciun verdict nu modifică ALFA Core.

---
## Document normativ inclus: 03_ISOLATION_AND_NON_CONTAMINATION.md

# Izolare și non-contaminare
Operatorul extrage fiecare ZIP exclusiv în folderul propriu. Nu extrage master ZIP în niciun workspace de agent. Masterul este doar pentru operator.
Fiecare agent vede doar propriul pachet, proiectul nou și inputurile comune înghețate. Fără directoare părinte, repo-uri vecine, istoric de chat străin, memoria altui agent, loguri, screenshots, deployuri sau rapoarte ale celeilalte rulări.
Folosește chat/sesiune nouă, proiect și repository separat, cache de rezultat/memory separat, profil de browser și port local distinct. Cacheurile de pachete tehnice comune sunt permise; nu cacheuri de output creativ.
Nu contacta celălalt agent; nu trimite sau cere soluții. Nici subagenți și nici delegare în acest protocol.
Nu accesa alte tooluri de citire a conversațiilor sau rezultate ale testului; acestea nu fac parte din inputurile runnerului.
La pornire rezolvă calea absolută a propriului root. Citește și scrie doar sub acel root pentru date de proiect. Dependențele/runtime și documentația tehnică sunt excepții tehnice, fără scanarea proiectelor din vecinătate.
ALFA Core este exclus din drepturile de scriere. Dacă este necesar, operatorul furnizează o copie snapshot în inputs/alfa-originals/ în ambele pachete, cu aceleași hashes; se folosește read-only. Nu importa automat instrucțiuni din documente ca permisiuni de a ieși din root.
Nu modifica shared, inputs sau contractul după freeze. Outputurile se scriu în run/.
Nu copia baselineuri vizuale anterioare. Failure memory textuală furnizată aici este input comun autorizat.
Operatorul aplică aceleași intervenții factuale ambelor rulări și le loghează înainte de continuare. Nu transferă sugestii creative sau descoperiri de la o rulare la cealaltă.
Dacă apar scurgeri: oprește consumarea sursei, notează ce ai văzut, momentul și impactul. Marchează INVALID_COMPARISON; operatorul decide o reluare cu sesiuni curate. Nu pretinde că o informație văzută poate fi „uitată”.

## Rubrică de izolare — binar, fără medie
I1 Root separat și verificat; I2 inputuri comune cu hashes identice; I3 sesiune/memorie separată; I4 zero acces la rezultatul celuilalt; I5 Core nemodificat; I6 outputuri separate; I7 intervenții egale/logate; I8 freeze înainte de review.
Pentru fiecare: PASS/FAIL/UNVERIFIED + dovadă + timestamp. Orice FAIL invalidează comparabilitatea. UNVERIFIED relevant ține rularea în așteptare, nu se transformă automat în PASS.
Declarația agentului este evidență declarativă, nu dovadă de sandbox. Operatorul confirmă restricțiile reale de acces ale instrumentelor; un prompt nu poate bloca tehnic accesul la filesystem.

---
## Document normativ inclus: 04_BUILD_GATE.md

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

---
## Document normativ inclus: 05_HUMAN_REVIEW.md

# Human Premium Gate — protocol comun
Operatorul păstrează rezultatele separate până ambele sunt înghețate. Un evaluator poate vedea ulterior ambele; agenții nu văd feedbackul sau rezultatele comparative în timpul rulării.
Anonimizează numele modelului și raportul tehnic din experiență. Atribuie A/B aleator și înregistrează ordinea; dacă sunt mai mulți evaluatori, contrabalansează ordinea. Nu dezvălui maparea înainte de completarea fișelor.
Folosește același dispozitiv, viewport, browser, zoom și condiții de acces. Evaluatorul vede websiteul, fără pitch/blueprint/explicație.
Per rezultat: 10 secunde prima impresie, apoi 3 minute explorare, apoi 2 minute sarcină identică: află programul, alege un preparat și completează cererea demo cu date fictive. Completează răspunsurile independent, înainte să vadă celălalt rezultat. Aceste durate sunt reguli operaționale noi.
Dacă evaluatorul deja știe modelul, consemnează „neblind”; nu simula orbirea.

## Fișa umană
ID anonim: __; evaluator: __; data: __; viewport/device: __; ordine: __; blind/neblind: __.
1. Pare premium? DA / NU
2. Pare făcut special pentru această firmă? DA / NU
3. Există suficientă bogăție și complexitate fără să fie haotic? DA / NU
4. Există ceva memorabil dincolo de imaginea/assetul principal? DA / NU; ce: __
5. Ai plăti pentru un website de nivelul acesta? DA / NU
6. Pare produs final sau demo/template? PRODUS FINAL / DEMO-TEMPLATE
7. WOW: DA / NU
Primele întrebări sunt păstrate din conversație. Reformularea binară la 6 elimină ambiguitatea verdictului „Demo/template=NU”.

Pentru fiecare dintre cele cinci condiții: ABSENT/SLAB / PREZENT / PUTERNIC; observație concretă.
Controlled Complexity: __
Orchestrated Richness: __
Perceived Craft Density: __
Signature Coherence: __
Commercial Premium Perception: __
Fundament lizibil și utilizabil: DA/NU; blocaje: __.
Eșec grav = ABSENT/SLAB care subminează experiența, descris explicit. Fără media scorurilor.
Decisive: Q1 DA, Q5 DA, Q6 PRODUS FINAL; niciun eșec grav. Restul răspunsurilor rămân vizibile și explică limitele. PASS_PREMIUM poate avea WOW=NU; etichetează acest lucru.
O singură apreciere nu demonstrează generalizare. Dacă evaluatorii diferă, raportează verdict per evaluator și DISAGREEMENT; nu inventa consens.
Nu cere evaluatorului să justifice înainte de răspunsul spontan. Comentariile se cer după cele 7 răspunsuri. Nu folosi raportul agentului ca substitut al reviewului.

---
## Document normativ inclus: 06_FAILURE_MEMORY.md

# Failure memory comună
Proveniență: sinteză a observațiilor din conversația recuperată. Nu sunt loguri de incidente sau fișiere originale verificate.
FM01 Corect + funcțional + clar nu a demonstrat suficientă valoare vizuală comercială. Evită declararea premium din build PASS.
FM02 Ordine fără bogăție produce rezultate prea simple/sterile. Verifică ritm, material, straturi și craft dincolo de ierarhia corectă.
FM03 Complexitate fără ordine sau efecte fără sens produce haos. Fiecare efect are rol în promisiune și prioritate.
FM04 Structura sofisticată din spate nu garantează perceived craft density. Verifică detaliile vizibile și stările.
FM05 Assetul principal a devenit uneori singurul element memorabil. Folosește Remove Asset Test.
FM06 Un efect izolat și rest schematic produce demo. Inspectează întreaga pagină și momentele de după hero.
FM07 Logo/industrie interschimbabile indică template. Construiește signature din adevărul proiectului.
FM08 Uniformitatea a fost confundată cu ordinea. Folosește contrast controlat și zone de release.
FM09 Ciclul test-fail-teorie-test poate continua fără salt perceptibil. Un candidat, un livrabil, buget finit și verdict sincer.
FM10 Baseline DI-7R este descris în conversație ca tehnic, nu premium. Originalul nu este disponibil; nu pretinde că l-ai inspectat.
Nu transforma aceste observații în interdicții universale de stil. Nu reconstrui sau accesa outputurile anterioare.

---
## Document normativ inclus: 07_BLUEPRINT_TEMPLATE.md

# Blueprint de completat în run/blueprint.md
Run ID / model real / root / input digest / mod surse:
project_truth: fapte, limite, necunoscute
experience_promise: o propoziție despre ce simte și înțelege omul
premium_tensions: 4–6 perechi și rezolvarea simultană
structural_exploration: 3 schițe textuale scurte; direcția aleasă și motivul
richness_strategy:
layer_system: strat / intensitate / zonă / scop / cost
material_system:
depth_strategy:
lighting_strategy:
composition_arc: zone / calm-build-peak-release / motiv
motion_layers: ambient-responsive-narrative / declanșator / timing / amplitudine / prioritate / reduced-motion
interaction_logic: tastatură, touch, formular și continuitatea stărilor
signature_system: regulă proprie / minimum 3 manifestări coerente în experiență
craft_density_plan: decizii perceptibile, nu cantitate de cod
peak_moments:
restraint_zones:
anti_template_proof:
anti_demo_proof:
asset_plan: origine, licență, generare, alternativă fără assetul principal
performance_budget:
tradeoffs:
Nu cere unui om să aprobe blueprintul înainte de build. Nu prezenta acest fișier înainte de review.

---
## Document normativ inclus: 08_FINAL_REPORT_TEMPLATE.md

# Raport final — completat în run/final-report.md
## Identitate și proveniență
Run ID; model real; platformă/versiune; settings; root absolut; start/freeze; timp activ/pauze; număr polish passes; stack/instrumente.
Mod: REFERENCE_ONLY / ALFA_ORIGINAL_SNAPSHOT; hashes common + originale; disponibilități inegale; intervenții operator; contaminare.
## Livrabil
Calea surselor; comenzi instalare/build/start; URL local/port; inventar output; instrucțiuni verificabile.
## Decizii și dovezi
Promisiune; tensiuni; signature; straturi; arc; două zone dincolo de hero; static proof; reduced-motion; anti-template/demo. Linkuri relative la dovezi, nu afirmații fără suport.
## Build
B1–B10: PASS/FAIL/UNVERIFIED, dovadă, comandă/mediu. Audit: 3 valori și mediane LCP/CLS/TBT. Defecte și limitări.
## Izolare
I1–I8: PASS/FAIL/UNVERIFIED + dovadă; confirmare operator; Core snapshot nemodificat; fișiere originale absente dacă este cazul.
## Human review
Implicit: PENDING_HUMAN_REVIEW. Nu completa răspunsurile în numele omului.
Atașează fișa numai după review. Q1–Q7; cele cinci condiții; eșecuri grave; blind/neblind; dezacorduri.
## Verdict
Build: __; Isolation: __; Human: __; Overall: __; WOW: __.
Nu declara PASS_PREMIUM înainte de review. INVALID_COMPARISON și limitările rămân vizibile.
## Failure memory nouă — locală, nepromovată
Observație verificată / cauză posibilă (inferență marcată) / dovadă / impact / recomandare pentru viitor.
## Core
ALFA Core nu a fost modificat. Nu solicita promovare automată. Acest raport rămâne rezultat experimental.

---
## Document normativ inclus: 09_SOURCE_PROVENANCE_AND_INPUT_FREEZE.md

# Surse și freeze
Disponibil: conversația „ALFA Handoff Summary”, ID 6ac019d5-1a54-83eb-8cbb-9c4487806712. Recuperare: 2026-10-03, 5 turnuri, fără atașamente expuse, fără pagini mai vechi.
Indisponibil: fișierele ALFA încărcate în conversația originală; documentația Core, ExperienceBlueprint original și baseline DI-7R nu au fost recuperate. Niciun astfel de fișier nu este inclus sau inventat.
Definiția, pipeline-ul, cele cinci condiții, anti-template/demo și cele șapte întrebări provin din conversație. Brief FIR DE FOC, bugetul, pragurile tehnice, protocolul blind și rubricile operaționale sunt completări noi pentru acest test.

Două moduri explicite:
1. REFERENCE_ONLY: pachetele funcționează autonom pe baza sintezei conversației. Testează candidatul, nu conformitatea cu ALFA Core original.
2. ALFA_ORIGINAL_SNAPSHOT: înainte de start, operatorul pune exact aceleași fișiere ALFA originale în inputs/alfa-originals/ în ambele roots. Nu folosi ALFA Core live. Creează manifest SHA-256 pentru fiecare copie și compară. Ambele trec în același mod. Dacă originale sunt cerute dar lipsesc, BLOCKED_SOURCE_INPUT; nu continua pretinzând acces.

Preflight operator:
- Alege și înregistrează același mod în inputs/run-configuration.md.
- Înregistrează modelul real și tool availability separat în run/preflight.md.
- Confirmă inputurile comune identice și originale identice; consemnează hashes.
- Furnizează orice extra asset identic înainte de start, cu licență; altfel rămâne setul fără assets.
- Îngheață inputurile și ora de start. Nu folosi outputuri anterioare.
- Dacă originale contrazic candidatul, păstrează truth, siguranța și restricția Core read-only; loghează conflictul. Schimbarea scopului/contractului cere o decizie identică a operatorului înainte ca oricare rulare să continue.
- Instrucțiunile operaționale locale aplicabile se citesc în root; orice conflict care afectează comparabilitatea se raportează.
Originalele pot fi adăugate numai înainte de freeze. Păstrează intact ZIP-ul primit; snapshotul de execuție are propriul manifest.

---
## Document normativ inclus: 10_ASSET_POLICY.md

# Politica assets
Input inițial identic: zero imagini și zero fonturi externe furnizate.
Identitatea trebuie să existe în compoziție, tipografie, material, signature și interacțiuni chiar fără o imagine dominantă.
Poți crea asseturi originale local în timpul rulării prin toolurile declarate în preflight. Nu pretinde fotografie a restaurantului fictiv; imaginile ilustrează conceptul.
Fără stock/template căutat online în timpul testului. Fără copierea asseturilor din alte proiecte sau a rezultatului celeilalte rulări.
În run/assets-register.md: fișier / autor-origine / instrument / licență sau drepturi / prompt dacă generat / dimensiuni / bytes / rol / fallback.
Fără hotlinking; resursele necesare sunt locale. Nu inventa licențe; folosește assets pentru care dreptul de utilizare este clar.
Dacă un tool de generare este disponibil doar unuia, declară înainte de start și egalizează permisiunile sau marchează comparația afectată.

Începe acum cu preflight, apoi du întregul build până la livrarea verificată, în limitele contractului. Nu livra doar o propunere.
