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