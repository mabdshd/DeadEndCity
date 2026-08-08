# M0-M4 ARCHITECTURE REVIEW

## Verdict
READY_FOR_M5_M8

## Critical
None.

## Watch Items
* BuildingFactory creates a unique 256×256 DynamicTexture per building (~32–48 textures). Monitor VRAM on low-end devices; consider sharing a texture atlas or reducing size if M5–M8 entities push memory.
* VehicleManager has no spawn cap. M5 TrafficSystem must enforce the 8–14 active traffic car limit before spawning.
* RoadNetwork nodes lack lane direction, sidewalk offset, and intersection metadata. M5 traffic and M8 police spawning will need this; extend RoadNode with `type: "intersection" | "straight" | "curve"` and `laneDir` before M5.
* EventBus only defines vehicle/mode events. M7 WantedSystem requires `crime:committed`, `wanted:changed`, `wanted:escaped`. Add these types before M7.
* No Game.reset() / restart path. M9 (bust loop) will need clean state/vehicle/player reset without page reload.
* PlayerController.dispose() only sets `active=false`. If Player is recreated (e.g., on respawn), ensure old controller/input listeners are fully released.
* InputManager: Escape key occasionally consumed during pointer lock. KeyP fallback works; fix only if it blocks pause in practice.
* City at 300×300 m (halfSize=150) is at upper end of 250–350 m spec. Traversal time ~11 s at top speed. Acceptable but do not expand further.

## M5-M8 Guardrails
1. **AI/player vehicle ownership**: VehicleController.bind() = exclusive. Only one controller per vehicle. TrafficSystem creates its own VehicleController instances per AI car.
2. **RoadNetwork reuse**: TrafficSystem, PoliceSpawner, MissionManager all import the single World.network instance. Do not duplicate graphs.
3. **Spawn/despawn discipline**: Every spawn system (Traffic, Pedestrians, Police) checks global entity cap (≤50 dynamic entities) before instantiating. Despawn when far outside active area or stuck >10 s.
4. **Entity caps**: Traffic ≤14, Pedestrians ≤24, Police ≤4, Player vehicle = 1. Enforce at spawn, not update.
5. **State/event ownership**: WantedSystem owns wantedLevel state. GameState is the source of truth. Crime events emitted via EventBus. PoliceAI reads wantedLevel, never writes it.
6. **Vehicle.setInput() for AI**: TrafficSystem and PoliceAI call vehicle.setInput(throttle, steer, handbrake) each frame. Do not duplicate Vehicle.update() logic.
7. **Performance budget**: Reuse materials (PropFactory pattern). No per-frame allocations in hot paths. Freeze world matrices on static geometry.
8. **Camera/input lifecycle**: Game.controlMode remains the single source of truth for ON_FOOT / IN_VEHICLE. No system bypasses it.
9. **Police spawning**: PoliceSpawner picks RoadNetwork nodes outside camera frustum, on valid road edges. Uses RoadNetwork.getClosestNode(player) + offset.
10. **Deterministic seed**: CityGenerator uses fixed WORLD_CONFIG.seed. All procedural systems (traffic routes, pedestrian spawns) must derive RNG from same seed for reproducibility.

## Changes Made
None.

## Created
* ARCH_REVIEW_M4.md

## Next
Begin M5 (Traffic + Vehicle Variants). Implement TrafficSystem using Vehicle.setInput(), RoadNetwork routes, and enforce 8–14 car cap.