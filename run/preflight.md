# Preflight — OR-PS-01 / runner „Claude Code 5.5 Opus”

Run ID: `ORPS01-CC55OPUS-20261003T0154Z`
Start sesiune (UTC): 2026-10-03T01:54:30Z (creare sesiune) · primul tool call: 2026-10-03T01:54:44Z

## Root
- Cale absolută: `/home/user/Design-performance-prototype`
- Basename: `Design-performance-prototype`. Destinația cerută este „Design Performance Prototype”. Diferența este doar de scriere (cratime în loc de spații, majuscule) — este repository-ul `liviuungureanu08-svg/Design-performance-prototype` clonat de platformă ca singur workspace al sesiunii. Considerat același root; nu au fost scanate directoare vecine.
- Stare la pornire: repo git curat, un singur commit (`24e654b Initial commit`), un singur fișier `README.md` (72 B, descriere de repo). Nu exista `run/` și nici `run/site/`.

## Pachet
- ZIP primit: `cb659ed8-ALFA_Claude_Code_55_Opus.zip`, SHA-256 `6c0664732624278bca2373f402bb474d8b96aeab17971884f614261fb4e481ff`, 16 fișiere.
- `Verify-Package.ps1`: PowerShell (`pwsh`) nu este instalat în container. Verificare echivalentă executată cu Python (`hashlib.sha256`) pe aceeași listă din `MANIFEST_SHA256.json`: **15/15 OK** (pe extragerea completă din scratchpad).
- Extragere în root cu `unzip -n` (fără suprascriere). **Conflict:** `README.md` exista deja în root (README-ul repository-ului). Nu a fost suprascris; ca urmare `README.md` din root ≠ `README.md` din pachet. Conținutul README-ului din pachet a fost citit și verificat prin hash din extragerea din scratchpad. Toate celelalte 14 fișiere ale pachetului sunt în root, identice byte cu byte.
- `inputs/run-configuration.md`: `source_mode: REFERENCE_ONLY`, `initial_visual_assets: NONE`, `external_design_research: FORBIDDEN`, `subagents: FORBIDDEN`, buget 4 h, max 2 polish passes, `input_freeze_timestamp: TO_BE_RECORDED_BY_OPERATOR`.
- `inputs/alfa-originals/`: conține doar README-ul care declară absența originalelor.

## Mod surse
**REFERENCE_ONLY.** Fișierele ALFA originale (Core, ExperienceBlueprint, baseline DI-7R) nu sunt prezente și nu sunt folosite sau inventate. Rularea testează candidatul Premium Synthesis v0.1, nu conformitatea cu ALFA Core.

## Model real
- Interogare `get_session` (claude-code-remote) la 01:55Z: `configured_model = claude-opus-5-5`, `session_context.model = claude-opus-5-5`, `external_metadata.last_served_model = claude-opus-5-5`, `effort_level = medium`, `permission_mode = auto`.
- Platformă: Claude Code (container cloud Anthropic, CLI 2.1.288), pornit din aplicația desktop. Eticheta operatorului „Claude Code 5.5 Opus” corespunde identificatorului raportat de sesiune; modelul care servește un turn poate diferi în caz de fallback — se reverifică la final.

## Tool availability (declarat înainte de build)
| Tool | Disponibil | Notă |
|---|---|---|
| Node.js | v22.22.0, npm 10.9.4 | |
| Vite | 8.3.2 (npm registry) | stack ales, dependență fixată + lockfile |
| Chromium (Playwright) | 141.0.7390.37 headless, `/opt/pw-browsers` | screenshots, test funcțional, recording |
| playwright / playwright-core | 1.56.1 | |
| Lighthouse | 13.5.0 (npm registry) | instalat local în `run/tools/` pentru auditul B7 |
| ffmpeg, ImageMagick | da | conversie recording |
| Generator de imagini (AI) | **NU** | nicio imagine generată; toate vizualurile sunt SVG/CSS procedurale scrise manual |
| Fonturi | doar sistem | nu sunt furnizate fonturi externe; se folosesc stive de fonturi sistem. În container: Liberation/DejaVu/FreeSerif. Randarea la evaluator (Windows/macOS) va folosi fontul sistem corespunzător din stivă — diferență declarată. |
| PowerShell | NU | vezi verificare echivalentă |
| Căutare web / referințe design | interzise de contract; nefolosite | doar registry npm pentru dependențe |
| Subagenți | nefolosiți | |

## Izolare și limite
- Sesiune nouă, workspace propriu (container efemer), fără memorie anterioară, fără acces la alte conversații sau la cealaltă rulare. Toolurile pentru citirea altor sesiuni există în mediul agentului (claude-code-remote) — **nu au fost folosite** în afară de `get_session` pe propria sesiune pentru identificarea modelului.
- Scriere doar sub root, în `run/`. Excepții tehnice: cache npm, scratchpad-ul sesiunii (extragere de verificare a pachetului, fișiere temporare), browserul Playwright cu profil temporar.
- Port preview: 4174 (liber la verificare, `curl` → conexiune refuzată). Audit pe port separat 4175 dacă e nevoie de serviciu paralel.
- Declarația agentului este evidență declarativă; restricțiile tehnice reale de acces sunt de confirmat de operator.
- Limitare: niciun asset vizual furnizat; nicio fotografie. Spațiul restaurantului este reprezentat ilustrativ/abstract, nu fotografic.
- Buget activ: 4 h de la 01:54Z → limită 05:54Z.
