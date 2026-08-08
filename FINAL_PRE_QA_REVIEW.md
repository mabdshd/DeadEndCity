# FINAL PRE-QA REVIEW

## Verdict

READY_FOR_FULL_QA

## Critical

None.

## Fixes Made

- Set `DEBUG_MODE = false` in `src/game/constants.ts` (production default)
- Added `this.startPos = MISSION_LOCATIONS.markedCar` to `HotStartMission` constructor so M1 shows start marker after bust instead of auto-activating
- Mark police vehicle as `stolen = true` when entered to prevent duplicate theft crime on re-entry

## QA Watch Items

1. Pointer lock auto-re-lock after bust/keep-playing may fail silently (canvas click fallback works)
2. Stolen police vehicle lights remain in last state (not controlled by PoliceManager)
3. HUD elements render over overlay backgrounds (z-index layering, visual only)
4. Audio one-shot sounds don't explicitly disconnect oscillators (minor leak risk in long sessions)
5. M2 `robberyStarted` dead code field exists
6. Police `seesPlayer` allocates new Ray per unit per frame (minor GC pressure)
7. Abandoned stolen vehicle cleanup depends on distance/time thresholds (verify 15s/60m stolen, 40s/90m civilian)
8. Pedestrian cap at 14 (config) vs MASTER_PLAN 12-24 target
9. Mission vehicle never cleaned up if player busts while not in it (protected by category check)
10. Verify production build loads from static hosting (relative paths, no localhost deps)

## Deployment Watch Items

1. `DEBUG_MODE` must remain `false` in production
2. Asset paths in `dist/index.html` use hashed filenames (Vite handles)
3. `localStorage` usage wrapped in try/catch (no crash on private browsing)
4. No backend, no absolute paths, no dev-only APIs
5. Single `AudioContext` created on user gesture (title screen click)
6. Build output `dist/` is self-contained for static hosting

## Build

PASS