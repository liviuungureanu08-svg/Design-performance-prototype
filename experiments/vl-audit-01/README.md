# INBOUND — Integrated Surgical Audit 01 (Gabriel Solutions)

Isolated experiment. Nothing outside this directory was changed. Status: **HUMAN REVIEW REQUIRED** · Human WOW **UNRESOLVED** · Core promotion **NONE**.

## Run
- **Fastest:** open `INBOUND_review.html` directly in a browser (single self-contained file, no server, no network).
- **Source:** `python3 -m http.server 8123` in this directory → `http://localhost:8123/index.html`
  (`?biz=clinic|hotel|interiors|roaster`, `?motion=reduced`, `?seed=N`; test-only: `?t=s` fast-forward, `?on=1&onfor=s`, `?freeze=1`).
- Rebuild the review file: `node qa/pack.mjs` (run inside this directory).

## Interaction
Press and hold anywhere on the field (mouse, touch, or Space) to run the system; let go to stop. “Keep it running” / Enter latches it.
Reduced motion: no stream; the same switch shows the same messages piled or routed.

## Files
| File | What |
|---|---|
| `index.html`, `style.css`, `main.js`, `field.js`, `data.js`, `fonts/` | the runnable artifact (vanilla JS, Canvas 2D + DOM; Inter, OFL-1.1) |
| `INBOUND_review.html` | single-file review build |
| `qa/` | `interact.mjs` (22 real-input checks), `sequence.mjs` (press/release frames), `stills.mjs`, `shot.mjs`, `sheet.py`, `pack.mjs` |
| `evidence/` | stills (`stills/`), frame sequences (`sequence/`, `sequence-390/`), contact sheets, static-gate iterations (`dev/`) |
| `FINAL_REPORT.md` | start here |
| `VISUAL_LAB_USAGE_TRACE.md`, `CONCEPT_SEARCH_RECORD.md`, `TECHNICAL_EVIDENCE.md`, `VISUAL_LAB_SURGICAL_AUDIT.md`, `ALFA_CAPABILITY_AUDIT.md`, `PREDICTION_LEDGER.md`, `HUMAN_REVIEW_PROTOCOL.md` | required deliverables |

**Reviewer note:** follow `HUMAN_REVIEW_PROTOCOL.md` *before* reading any other document here (blind first contact).
