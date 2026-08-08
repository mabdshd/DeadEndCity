# M5-M8 ARCHITECTURE REVIEW

## Verdict
READY_FOR_M9_M13

## Critical
None.

## Fixes Made
- Fixed vehicle theft semantics: Added `category` ("civilian" | "police" | "mission") and `stolen` fields to `Vehicle`. Updated `VehicleFactory.createVehicle`, `VehicleManager.spawn`, `TrafficSystem` (default civilian), `PoliceManager` (police), `Game` manual spawns (civilian). `Game.enterVehicle` now only emits `vehicle_theft` for civilian vehicles where `!stolen` (marks stolen), and emits higher-severity theft for police vehicles. Mission vehicles (category="mission") emit no theft crime.

## Watch Items
- Police `seesPlayer` allocates a new `Ray` per unit per frame (minor GC pressure).
- Abandoned stolen vehicles are not reclaimed by TrafficSystem; entity count grows if player repeatedly steals/exits.
- `WantedSystem.forceLevel` is public; missions should use `crime:committed` with `minWanted` instead.
- EventBus lacks `mission:*` and `cash:*` events needed for M9-M13.
- Police speed balance relies on interception/spawn positioning; verify 3-star pressure feels intense in playtest.
- On-foot pursuit has no foot officers; police vehicles chase player on foot (acceptable per spec).
- Pedestrian cap is 14 (config) but MASTER_PLAN targets 12-24; consider raising if performance allows.

## M9-M13 Guardrails
1. Fix vehicle theft semantics before M9 — missions must reliably trigger wanted on marked-car entry only.
2. Add `mission:started`, `mission:objectiveChanged`, `mission:completed`, `cash:carriedChanged`, `cash:banked` to EventBus.
3. Expose `WantedSystem.requestMinimum(level)` or document `crime:committed` with `minWanted` as mission API.
4. Distinguish vehicle categories (civilian/police/mission) so missions can mark mission vehicles without theft crime.
5. Ensure abandoned stolen vehicles despawn or recycle to prevent entity leaks during long sessions.
6. Police disengage/despawn must clean up sirens/lights reliably (current code does this).
7. Keep `WantedSystem` as sole owner of wanted state; no system mutates `level` directly except via events.
8. Mission scripts must not inspect `TrafficSystem.units`, `PoliceManager.units`, or `VehicleController.vehicle` directly.
9. Add `Game.reset()` for bust/respawn loop (M9 requirement).
10. Verify `npm run build` passes after every change; no TypeScript errors.

## Created
- ARCH_REVIEW_M8.md

## Build
- PASS

## Next
Begin M9 (Cash + Safehouse). Verify theft fix in playtest: enter traffic car → 1 star; exit → re-enter → no new star; enter police car → 2 stars; enter mission car (when added) → no theft star.