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