# FINAL PRE-QA REVIEW

## Verdict

READY_FOR_FULL_QA

## Critical

None.

## Fixes Made

- `Game.setPaused(true)` now exits pointer lock so the RESUME button is actually clickable (previously pointer lock stayed active and routed all clicks to the canvas, making the button unreachable). Resume re-requests pointer lock from the button click gesture.
- Esc/KeyP pause toggle is now blocked while `state.mode === "busted"` and while the finale overlay is visible. Previously pressing Esc inside the 1.6s busted window flipped `mode` to "paused" then "playing", skipping respawn and leaving the full-screen BUSTED overlay + 0 HP forever; Esc during the finale left the finale overlay stuck over a paused game.

## QA Watch Items

1. Esc/P pressed during the BUSTED overlay is ignored — confirm bust still auto-respawns and recovers to PLAYING.
2. Auto pointer re-lock after bust/keep-playing may be denied by the browser — canvas click must re-lock; game must stay playable unlocked.
3. Pause → RESUME works via button and via Esc/P; no residual cursor/input conflict.
4. KEEP PLAYING free roam: M1/M2/M3 listeners inert, rewards never re-fire, markers gone; traffic/peds/crimes/wanted/police/banking/pistol still work.
5. Bust during M1/M2/M3: mission restarts with fresh markers/vehicles, no duplicate reward, no reward granted while busted.
6. Finale fires only on m3 completion — cannot trigger from bust/3-star.
7. Siren stops after wanted clear and after bust respawn; engine stops on exit/bust; no oscillator growth over repeated bust + enter/exit.
8. Long session: traffic ~10, peds ~14, police 0–3, abandoned stolen cars despawn; no entity/event/marker accumulation.
9. Combat: fire-rate cap holds under click spam; assault_police caps at 3 stars; peds flee on gunfire; shooting inert during pause/busted/finale.
10. Banking: wanted>0 blocks, carried→0 after bank, banked survives bust, $0 bank harmless, malformed localStorage cannot crash.

## Deployment Watch Items

1. `base: "./"` → dist uses relative asset paths; verify on a static host (including a sub-path).
2. `localStorage` wrapped in try/catch — no crash under blocked/private storage.
3. Single AudioContext, initialized on title-button gesture.
4. `DEBUG_MODE = false` — debug panel hidden, debug keys inert in production.
5. No backend/network dependency; `dist/` is self-contained.
6. Fresh/incognito load: title → start, clean console, no focus trap.

## Build

PASS

## Created

FINAL_PRE_QA_REVIEW.md
