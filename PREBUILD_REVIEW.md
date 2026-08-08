# PREBUILD REVIEW

## Verdict
READY_TO_BUILD

## Critical Issues
None.

## Recommended Adjustments
* **Lock physics choice in M0** — Decide Havok vs custom arcade before M1; switching mid-project wastes hours. If Havok bundling fails, fall back immediately to raycast capsule + custom vehicle forces.
* **Share RoadNetwork between TrafficSystem and PoliceSpawner** — Both need road nodes; duplicate graphs cause desync. Create `src/world/RoadNetwork.ts` in M2 and import in M5/M8.
* **Implement VehicleStateManager for enter/exit** — Controller/camera/player-mesh handoff is the highest-risk integration. Own the transition in one class to avoid duplicate controllers or camera lockup.
* **Create config modules in M0** — `gameplay.ts`, `vehicles.ts`, `missions.ts` with all tuning values. Prevents magic numbers scattered across systems.
* **Enforce total dynamic entity cap** — Traffic (14) + pedestrians (24) + police (4) + player vehicle = ~42. Cap at 50; spawn systems must check global count.
* **Audio context init on title button** — Browser autoplay policy requires user gesture. Wire `AudioManager.resume()` to "ENTER DISTRICT 24" click in M0.

## M0–M4 Warnings
* **M0** — Add `DEBUG_MODE` constant; wire minimal canvas resize + Babylon engine options (antialias, stencil). Don't forget `engine.runRenderLoop`.
* **M1** — Player controller must be fully detachable. No singleton references. Return clean `dispose()` for M4 handoff.
* **M2** — RoadNetwork must output: node positions, connections, lane directions, sidewalk offsets. Traffic and police both consume this.
* **M3** — Vehicle controller testable in isolation. Expose `setInput(throttle, steer, handbrake)` for AI reuse later.
* **M4** — Test enter→exit→enter 20x rapidly. Common failure: stale camera target, input conflict, player mesh stuck inside vehicle.

## Architecture Guardrails
1. Single `GameState` object — no Redux, no global mutable sprawl.
2. Typed `EventBus` for cross-system signals (`crime:committed`, `wanted:changed`, `vehicle:entered`).
3. All tuning values in `src/config/*.ts` — no magic numbers in system code.
4. `RoadNetwork` is the single source of truth for paths — traffic, police, missions all import it.
5. Exclusive controller ownership — PlayerController OR VehicleController active, never both.
6. Deterministic city gen — fixed seed, manual road graph + procedural decoration.
7. Entity caps enforced at spawn — `EntityManager.getActiveCount()` checked before `spawn()`.
8. AudioContext started only after first user gesture (title screen).
9. `npm run build` must pass at every milestone gate.
10. No external asset dependencies — procedural meshes, CSS UI, WebAudio synthesis only.

## Handoff
Begin M0 immediately. The plan is well-scoped, fallbacks are documented, and no architectural blockers exist. Implement Vite + TypeScript + Babylon bootstrap with config modules, DEBUG_MODE, and audio context hook. Do not install Havok until M3 — verify custom arcade controller works first.