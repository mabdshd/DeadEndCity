# HEATLINE: DISTRICT 24
## Master Game Design, Technical Architecture, Execution Plan, QA Plan, and OpenCode Operating Contract

**Document status:** Source of truth  
**Project type:** Single-player 3D browser game  
**Competition constraint:** 24-hour GTA-inspired clone challenge  
**Primary constraint:** Build using OpenCode and currently available free models only  
**Primary goal:** Ship a small, polished, immediately recognizable GTA-style sandbox that is fun within the first 60 seconds  
**Target platform:** Desktop browser, keyboard + mouse  
**Recommended browser:** Current Chromium-based desktop browser  
**Deployment target:** Static web hosting  
**Networking/backend:** None  
**External account/database:** None  
**Core technology:** TypeScript + Vite + Babylon.js  
**Physics strategy:** Babylon physics/Havok if stable; custom arcade controllers where realism would increase risk  
**Art strategy:** Procedural stylized low-poly city with little or no dependency on external assets

---

# 0. HOW TO USE THIS FILE

This file is the project's constitution.

OpenCode must read this file before making architectural decisions or implementing features.

The priorities are:

1. A working build is more important than feature count.
2. A complete core gameplay loop is more important than visual polish.
3. Visual polish is more important than optional systems.
4. Stable, simple code is more important than clever abstractions.
5. Every implementation step must leave the project closer to a playable game.
6. No system may be expanded beyond the scope written in this file unless all required work is complete and the user explicitly asks for expansion.

When a conflict exists between:
- an AI suggestion,
- an implementation shortcut,
- a new idea,
- and this document,

**this document wins unless the user explicitly overrides it.**

The AI must not silently enlarge scope.

---

# 1. PROJECT VISION

## 1.1 Working title

**HEATLINE: DISTRICT 24**

Alternative title only if the user later changes it:
- District 24
- Heatwave City
- Dead End City
- One Last Job
- Neon County

Until changed, use **HEATLINE: DISTRICT 24** in code, UI, and documentation.

## 1.2 One-sentence pitch

A compact stylized 3D crime sandbox where the player steals cars, completes fast criminal jobs, earns risky cash, attracts escalating police attention, escapes pursuit, and banks the money before getting busted.

## 1.3 Player fantasy

The player should feel:

- free to move around a small city;
- able to steal and drive vehicles immediately;
- watched by a reactive police system;
- rewarded for taking bigger risks;
- constantly close to either escaping or getting caught;
- capable of creating memorable chaos without needing a huge world.

## 1.4 The competition strategy

Do not attempt to recreate GTA's scale.

Recreate the **feeling** using six pillars:

1. Freedom
2. Vehicles
3. Living city
4. Crime and consequence
5. Wanted/police pursuit
6. Short missions with rewards

The first 60 seconds must demonstrate at least four of these pillars.

---

# 2. THE SIGNATURE TWIST: RISK CASH

The game has two money values:

- **Carried Cash**
- **Banked Cash**

Mission rewards and risky activities add to Carried Cash.

If the player reaches the safehouse, Carried Cash transfers to Banked Cash.

If the player is busted or dies:
- Carried Cash is lost.
- Banked Cash remains.
- The player respawns.

This creates meaningful tension without requiring complex progression.

## 2.1 Why this system exists

It gives the player a simple decision:

> Do I cash out now, or keep causing chaos for a bigger run?

It also makes the wanted system matter.

## 2.2 Optional risk multiplier

Only implement after the base loop is stable.

Suggested multiplier:

- 0 stars: x1.00
- 1 star: x1.10
- 2 stars: x1.25
- 3 stars: x1.50

Do not let this become a large economy system.

---

# 3. PLAYER EXPERIENCE TARGET

## 3.1 The first 60 seconds

Expected first-time experience:

1. Title screen loads.
2. Player clicks **ENTER DISTRICT 24**.
3. Game loads directly into the city.
4. UI displays a short objective: **STEAL THE MARKED CAR**.
5. Player walks to the marked vehicle.
6. Player presses `E` to enter.
7. Police attention is triggered.
8. Siren and police lights appear.
9. Player drives through the city toward a destination.
10. Wanted meter begins to cool when police lose sight.

The judge should understand the game before reading instructions.

## 3.2 Ideal play session

A full competition demo should feel satisfying in 8–15 minutes.

After completing the three missions, the player can continue free-roaming and chasing a high banked-cash score.

---

# 4. SCOPE FIREWALL

## 4.1 Required features — MUST SHIP

- Title screen
- Pause/restart support
- Third-person player movement
- Third-person camera
- Enter/exit vehicles
- Arcade vehicle driving
- At least 3 vehicle appearances/types
- Small procedural city
- Traffic
- Pedestrians
- Wanted system with 0–3 levels
- Police spawning and pursuit
- Police siren/lights
- Escape/cooldown logic
- Health or bust state
- Carried and banked cash
- Safehouse banking
- Mission framework
- 3 missions
- Mission markers
- HUD
- Basic synthesized audio or equivalent local audio
- Game-over/busted feedback
- Static production build
- Basic performance tuning

## 4.2 Strongly desired — SHOULD SHIP

- Basic hitscan pistol
- Police foot pursuit if player leaves a vehicle
- Vehicle damage feedback
- Simple traffic avoidance
- Pedestrian flee behavior
- Bloom/FXAA if performance allows
- Camera shake
- Tire skid effect
- Money popups
- Mission-complete sequence
- Simple high-score persistence in localStorage

## 4.3 Optional — ONLY AFTER EVERYTHING ABOVE IS STABLE

- Simple minimap
- Roadblocks
- Additional traffic car appearances
- Additional free-roam crimes
- Additional mission
- Simple stunt/near-miss bonus
- Destructible lightweight props
- Extra VFX
- Gamepad controls

## 4.4 Explicitly forbidden during the 24-hour MVP

Do not implement:

- Multiplayer
- Backend server
- Database
- Accounts
- Login
- Cloud saves
- Large open world
- Interiors
- Character customization
- Inventory system
- Complex weapon system
- Multiple weapon classes
- Advanced cover system
- Advanced melee combat
- Advanced animation state machine
- Dialogue trees
- LLM NPCs
- Quest editor
- Procedural mission generator
- Realistic suspension simulation
- Realistic wheel-by-wheel vehicle physics unless trivial and already stable
- Day/night cycle
- Weather system
- Destructible buildings
- Full navigation mesh pipeline unless needed and proven stable
- Complex ECS rewrite
- Networking-ready architecture
- Microservices
- Any feature added only because it sounds impressive

---

# 5. ART DIRECTION

## 5.1 Style

Use a deliberate **stylized low-poly / PS2-inspired modern presentation**.

The game should not attempt photorealism.

Visual goals:

- large readable silhouettes;
- saturated sunset/neon mood;
- simple geometry;
- strong contrast;
- emissive signs;
- colored police lights;
- limited texture dependence;
- easy-to-read roads and mission markers.

## 5.2 Time of day

Use one fixed time:

**late sunset transitioning visually into neon evening**

Do not implement a time-of-day cycle.

## 5.3 Palette behavior

Use a restrained world palette with:
- warm sky;
- darker asphalt;
- simple concrete/building colors;
- emissive cyan/magenta/orange signage;
- bright red/blue police effects;
- bright mission markers.

Exact colors may be tuned later.

## 5.4 Procedural graphics

Prefer meshes and materials created in code.

Buildings can be boxes with:
- inset-looking window strips;
- rooftop boxes;
- HVAC units;
- signs;
- antennae;
- awnings.

Street detail can use:
- lamps;
- benches;
- barriers;
- dumpsters;
- trees;
- cones;
- signs;
- parking spaces.

Do not require Blender for MVP.

## 5.5 Player model

MVP player can be made from primitive low-poly body parts.

Required:
- recognizable humanoid silhouette;
- facing direction;
- simple procedural limb swing or walk bob.

Do not block progress waiting for a rigged character.

## 5.6 Vehicles

Vehicle meshes may also be primitive/stylized.

Each needs:
- body;
- cabin;
- four visible wheels;
- headlights;
- brake lights if easy.

Police car additionally needs:
- roof light bar;
- emissive/toggling red-blue lights.

---

# 6. WORLD DESIGN

## 6.1 Map size

Target approximate playable footprint:

**250–350 meters per side**

Do not exceed this unless performance and schedule are clearly safe.

## 6.2 World structure

Build 5–8 recognizable blocks connected by streets.

Suggested landmarks:

1. Downtown / office block
2. Convenience store / motel block
3. Industrial warehouse
4. Parking lot or garage
5. Small park
6. Police station
7. Safehouse
8. Chop shop / mission drop-off

## 6.3 Boundaries

Use believable blockers:
- highway barriers;
- construction zone;
- water;
- walls;
- fenced industrial area;
- blocked tunnel.

Avoid invisible walls where possible.

## 6.4 Roads

Use a simple grid or semi-grid.

Road requirements:
- readable lanes;
- wide enough for arcade driving;
- several intersections;
- at least one long road for speed;
- at least one tight turn area;
- no extremely narrow alleys required.

## 6.5 Traffic pathing

Traffic follows predefined road nodes.

Do not build a complex traffic simulation.

A route can be:
- node list;
- loop;
- intersection branch;
- despawn/respawn.

Traffic behavior:
- follow route;
- maintain target speed;
- slow if obstacle ahead;
- stop or slow if blocked;
- respawn if badly stuck for too long.

Target active traffic:
**8–14 cars**, depending on performance.

## 6.6 Pedestrians

Target active pedestrians:
**12–24**, depending on performance.

Pedestrian states:

- IDLE
- WANDER
- FLEE
- DOWN

Pedestrians do not need:
- conversations;
- schedules;
- shops;
- relationships;
- advanced path planning.

If navigation is unstable, pedestrians may walk between hand-authored sidewalk nodes.

---

# 7. CORE GAMEPLAY LOOP

Main loop:

1. Explore
2. Start mission or cause crime
3. Enter/steal vehicle
4. Complete objective
5. Gain Carried Cash
6. Wanted level rises
7. Police pursue
8. Escape line-of-sight / survive cooldown
9. Reach safehouse
10. Bank cash
11. Start next mission or continue free roam

The game must remain playable between missions.

---

# 8. CONTROLS

Default keyboard/mouse controls:

## On foot

- `WASD` — move
- Mouse — camera
- `Shift` — sprint
- `Space` — jump
- `E` — interact / enter vehicle
- Left Mouse — fire pistol if combat is implemented
- `Esc` — pause

## In vehicle

- `W/S` — accelerate / brake-reverse
- `A/D` — steer
- `Space` — handbrake
- `E` — exit vehicle
- Mouse — limited camera look
- `Esc` — pause

## Debug-only controls

Debug controls must not be shown in the final UI.

Suggested:
- toggle wanted level;
- teleport to safehouse;
- reset vehicle;
- start each mission;
- display FPS/system counts.

Keep debug controls behind a constant such as `DEBUG_MODE`.

---

# 9. PLAYER SYSTEM

## 9.1 Movement

Player movement should feel responsive, not realistic.

Suggested values are starting points only:

- walk speed: 4–5 m/s
- sprint speed: 6.5–8 m/s
- jump height: modest
- acceleration smoothing: short
- deceleration smoothing: short

Requirements:
- grounded movement;
- cannot fly up slopes;
- predictable camera-relative controls;
- player cannot easily clip through city geometry.

## 9.2 Health / bust logic

MVP can use a simple 100 HP health model.

Sources of damage:
- police shots if combat exists;
- vehicle collisions;
- severe crash if implemented;
- optional world hazards.

If health reaches zero:
- show `BUSTED` or `WASTED` style original wording;
- lose Carried Cash;
- clear wanted level;
- respawn at safehouse;
- restore health.

Use original UI wording and visuals; do not copy GTA branding.

## 9.3 Interaction

`E` selects the nearest valid interactable within a small radius.

Priority:
1. nearby enterable vehicle
2. mission interaction
3. safehouse/bank marker
4. other simple interactables

Do not create a complex interaction framework.

---

# 10. CAMERA SYSTEM

## 10.1 On-foot camera

Third-person follow camera.

Requirements:
- positioned behind and above player;
- smooth follow;
- mouse yaw/pitch;
- clamp vertical pitch;
- no extreme roll;
- camera should not violently jitter.

If camera collision is easy, implement it.
If not, prioritize stable framing over perfect wall avoidance.

## 10.2 Vehicle camera

When driving:
- slightly farther back;
- higher field of view at speed if easy;
- smooth yaw;
- recenter behind vehicle;
- mild speed-based camera shake optional.

## 10.3 Transitions

Entering/exiting vehicles should smoothly switch controller and camera target.

Do not make a cinematic transition system.

---

# 11. VEHICLE SYSTEM

## 11.1 Philosophy

Vehicles are arcade toys, not simulators.

The player should understand driving instantly.

## 11.2 Vehicle types

Required appearances:

1. Sedan
2. Sport coupe
3. Police cruiser

Optional:
4. Van
5. Taxi color variant

Use one shared controller where possible.

## 11.3 Driving model

Preferred:
- rigid body or collision body;
- custom forward acceleration;
- steering based on speed;
- lateral velocity damping;
- drag;
- limited maximum speed;
- handbrake increases lateral slip;
- upright stabilization if needed.

Do not spend hours on realistic tire friction.

## 11.4 Starting tuning values

Use these only as first-pass guidance:

Sedan:
- top speed: medium
- acceleration: medium
- steering: forgiving

Sport:
- top speed: high
- acceleration: high
- steering: more sensitive

Police:
- top speed: slightly above sedan
- acceleration: good
- steering: stable

## 11.5 Enter / exit

When player enters:
- hide or attach player representation;
- disable on-foot controller;
- mark vehicle as player-controlled;
- switch camera;
- show vehicle HUD info only if useful.

When player exits:
- place player at safe side offset;
- stop player from spawning inside geometry;
- restore on-foot controller;
- switch camera.

## 11.6 Vehicle theft

Entering a civilian/traffic car counts as a crime if:
- it is not already the player's current owned/temporary mission car; and
- the player is not already wanted from a higher-priority event.

Vehicle theft should trigger at least one wanted star during Mission 1.

---

# 12. TRAFFIC SYSTEM

Traffic cars are lightweight AI actors.

Required behavior:

1. Spawn on road node.
2. Move toward next node.
3. Turn toward path direction.
4. Slow when another car is directly ahead.
5. Continue around loop.
6. Respawn if:
   - far outside active area,
   - overturned too long,
   - stuck too long.

No realistic traffic laws are required.

At intersections:
- simple timing or route priority is enough;
- collisions are acceptable in moderation;
- avoid giant pileups that permanently block roads.

---

# 13. PEDESTRIAN SYSTEM

Each pedestrian uses a small state machine.

## IDLE
- wait;
- look around or small body sway.

## WANDER
- walk between nearby sidewalk points.

## FLEE
Triggered by:
- gunshot nearby;
- vehicle collision nearby;
- active police chase close by.

Behavior:
- choose direction away from danger;
- run for a few seconds;
- return to wander when safe.

## DOWN
- stop normal movement;
- hide, collapse simply, or disable after delay.

Do not build realistic ragdolls unless already trivial.

---

# 14. CRIME SYSTEM

Crime events should be explicit events.

Possible crime types:
- vehicle theft;
- robbery mission;
- firing weapon near police;
- damaging police;
- mission-scripted crime.

Each crime reports:
- severity;
- location;
- source entity;
- optional minimum wanted level.

Example concept:

```ts
type CrimeType =
  | "vehicle_theft"
  | "robbery"
  | "weapon_fire"
  | "assault_police"
  | "mission_alert";
```

The WantedSystem consumes crime events.

---

# 15. WANTED SYSTEM — THE MAIN FEATURE

## 15.1 Levels

Wanted level:
- 0
- 1
- 2
- 3

No more than 3 levels in MVP.

## 15.2 Meaning

### 0 stars
- normal world;
- no active pursuit.

### 1 star
- light response;
- one police unit attempts pursuit;
- player can escape fairly easily.

### 2 stars
- stronger response;
- 2–3 units may participate;
- shorter reinforcement delay;
- police are more aggressive.

### 3 stars
- maximum prototype intensity;
- 3–5 units depending on performance;
- aggressive pursuit;
- optional simple roadblock;
- strongest siren/UI effects.

## 15.3 Escaping

Wanted should not disappear instantly.

Recommended concept:
- if police have clear pursuit/contact, cooldown does not progress;
- when no police has seen or remained close to player for a few seconds, `escapeTimer` starts;
- HUD changes from solid stars to flashing/cooling state;
- after cooldown, wanted level becomes 0.

Suggested cooldown:
- 1 star: 8 seconds
- 2 stars: 12 seconds
- 3 stars: 16 seconds

Tune for fun.

## 15.4 Escalation

Crime severity can increase wanted level.

Avoid complicated hidden formulas.

Example:
- stealing marked car: set minimum wanted to 1;
- robbery: set minimum wanted to 2;
- finale: set minimum wanted to 3;
- attacking police can increment level up to 3.

## 15.5 Search behavior

Police do not need a sophisticated GTA search grid.

Approximation:
- when direct pursuit is lost, units travel toward player's last known position;
- player must stay away until cooldown completes;
- police may circle nearby streets;
- if they reacquire player, cooldown resets.

This is enough.

---

# 16. POLICE AI

Police vehicle states:

- SPAWN
- INTERCEPT
- CHASE
- SEARCH
- DISENGAGE

## SPAWN
Spawn:
- outside immediate camera view if possible;
- on nearby road node;
- not directly on top of player.

## INTERCEPT
Drive toward a road node near player or last known position.

## CHASE
Target the player's current position with prediction based on velocity.

Do not require perfect road navigation.
A hybrid of road-node routing + direct chase steering is acceptable.

## SEARCH
Move around last known area.

## DISENGAGE
Leave or despawn after wanted ends.

## 16.1 Police population caps

Start:
- 1 star: 1 active police vehicle
- 2 stars: 2–3
- 3 stars: 3–4

Only increase if performance remains good.

## 16.2 Police on foot

Optional/SHOULD feature.

If implemented:
- when near stopped player, officer can exit or spawn nearby;
- chase on foot;
- use simple hitscan attack.

If this destabilizes the build, keep police vehicle-only and use a simple bust radius when the player is stopped.

## 16.3 Busted mechanic

Possible simple rule:
- if player is on foot, low health, and police remain very close for a short duration → busted;
- if player vehicle is immobilized and police remain close → busted.

Do not implement complex arrest animations.

---

# 17. COMBAT

Combat is a SHOULD feature, not a blocker.

## 17.1 Pistol

If implemented:

- one weapon only;
- hitscan ray from camera/crosshair;
- limited fire rate;
- simple muzzle flash;
- synthesized shot sound;
- optional small recoil;
- no inventory.

## 17.2 Targets

Can damage:
- police;
- pedestrians;
- optional vehicles.

## 17.3 Consequences

Firing near police or hitting police should raise wanted.

No ammunition pickups are required.
Either:
- infinite ammo with fire-rate limit, or
- a generous magazine with automatic reload.

Prefer simplicity.

---

# 18. MONEY AND SCORE

State:

```ts
bankedCash: number
carriedCash: number
```

## 18.1 Rewards

Suggested rewards:

Mission 1:
- +$500 carried

Mission 2:
- +$1,000 carried

Mission 3:
- +$2,000 carried

Optional free-roam rewards:
- escape police: small carried reward
- high-wanted survival: tiny periodic bonus

Keep numbers readable and fun.

## 18.2 Banking

Safehouse marker:
- visible on world;
- interacts automatically when player enters radius or presses `E`.

Effect:
- transfer carried to banked;
- show satisfying popup;
- save banked high score in localStorage if persistence exists.

---

# 19. MISSIONS

Mission system must be data-driven enough to avoid hardcoding everything into Game.ts, but not overengineered.

Suggested mission state interface:

```ts
type MissionState =
  | "locked"
  | "available"
  | "active"
  | "completed"
  | "failed";
```

Each mission can use explicit scripted stages.

---

# 20. MISSION 1 — HOT START

## Objective

Introduce movement, interaction, driving, wanted system, and delivery.

## Flow

1. UI: `STEAL THE MARKED CAR`
2. Show marker over sport coupe.
3. Player enters vehicle.
4. Trigger 1 wanted star.
5. UI: `LOSE THE COPS`
6. Player escapes police.
7. UI: `DELIVER THE CAR TO THE CHOP SHOP`
8. Player reaches chop shop.
9. Reward +$500 Carried Cash.
10. UI prompts player to bank at safehouse or continue.

## Acceptance

Mission is complete when:
- marked car was entered;
- wanted was triggered;
- player escaped;
- correct vehicle reached drop-off.

---

# 21. MISSION 2 — QUICK CASH

## Objective

Show intentional criminal action and a stronger pursuit.

## Flow

1. Mission marker at convenience store.
2. Player enters trigger.
3. Short 2–3 second robbery progress UI.
4. Alarm effect.
5. Set wanted to minimum 2 stars.
6. Reward preview: +$1,000 Carried Cash, but only finalize after escaping.
7. UI: `ESCAPE THE POLICE`
8. Player loses police.
9. Add $1,000 Carried Cash.
10. UI: `BANK THE CASH OR KEEP THE HEAT GOING`

## Optional polish

- flashing store lights;
- alarm sound;
- small cash particle/pop-up.

---

# 22. MISSION 3 — HEATLINE

## Objective

Provide the competition finale.

## Flow

1. Start at industrial warehouse.
2. UI: `PICK UP THE PACKAGE`
3. Interact with package marker.
4. Set wanted level to 3.
5. Spawn police response.
6. UI: `GET THE PACKAGE ACROSS DISTRICT 24`
7. Longest driving route crosses several city blocks.
8. Optional roadblock event.
9. Player reaches final checkpoint.
10. Player must still lose police or pass a final escape gate.
11. Reward +$2,000 Carried Cash.
12. Show completion screen:
   - `DISTRICT CLEARED`
   - banked cash
   - carried cash
   - best score
   - `KEEP PLAYING`

## Finale feeling

Use:
- stronger music/synth pulse if available;
- more police lights;
- intense HUD;
- camera shake on crashes;
- final completion burst.

---

# 23. FREE ROAM AFTER MISSIONS

After Mission 3:
- missions remain completed;
- player can keep roaming;
- crimes still trigger wanted;
- safehouse still banks cash;
- score can continue increasing.

Optional:
- Mission Replay button only if easy.

---

# 24. UI / HUD

Use HTML/CSS overlay unless Babylon GUI is significantly easier for a specific element.

## 24.1 Required HUD

Top-left or top-right:
- health
- banked cash
- carried cash

Wanted display:
- 3 star icons
- clear active/inactive states
- flashing/cooling state while escaping

Mission display:
- current objective
- optional distance to objective

Interaction prompt:
- `E — ENTER VEHICLE`
- `E — START JOB`
- etc.

## 24.2 Crosshair

Only show if shooting exists.

## 24.3 Screens

Required:
- Title
- Pause
- Busted/death
- Mission complete feedback
- Final mission completion

## 24.4 UI principles

- large enough for 1080p desktop;
- no tiny text;
- no giant paragraphs;
- strong hierarchy;
- original design;
- never copy GTA fonts/logos/UI assets.

---

# 25. AUDIO

MVP should not depend on downloading licensed assets.

Prefer synthesized Web Audio API effects.

## 25.1 Required sound families

- engine hum
- police siren
- UI click
- mission start
- mission complete
- cash bank
- collision impact
- footstep or movement tick if easy
- gunshot if combat exists
- alarm for robbery

## 25.2 Engine sound

Use oscillator(s) whose pitch changes with normalized speed.

It does not need to be realistic.
It must provide feedback.

## 25.3 Siren

Use alternating oscillators/tones.

Volume based on distance to police if practical.

## 25.4 Browser requirement

Audio must begin only after a user gesture due to browser autoplay restrictions.

Title-screen button should initialize/resume audio context.

---

# 26. TECH STACK

## 26.1 Required

- TypeScript
- Vite
- Babylon.js

## 26.2 Preferred packages

Use only what is needed.

Likely:
- `@babylonjs/core`
- `@babylonjs/havok` if physics is used and setup remains stable

Optional:
- `@babylonjs/loaders` only if external 3D assets are actually introduced

Avoid unnecessary libraries.

## 26.3 Rendering

Start with WebGL-compatible Babylon engine configuration.

Do not make WebGPU mandatory.

Optional rendering pipeline:
- FXAA
- mild bloom

Only enable if performance remains acceptable.

## 26.4 Build commands

Expected scripts:

```bash
npm install
npm run dev
npm run build
npm run preview
```

The production build must succeed before the project is considered complete.

---

# 27. TARGET PROJECT STRUCTURE

Use this as a guide, not a reason to create empty abstractions.

```text
/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── MASTER_GAME_PLAN.md
├── public/
│   └── optional-local-assets/
└── src/
    ├── main.ts
    ├── styles.css
    │
    ├── game/
    │   ├── Game.ts
    │   ├── GameState.ts
    │   ├── EventBus.ts
    │   └── constants.ts
    │
    ├── config/
    │   ├── gameplay.ts
    │   ├── vehicles.ts
    │   └── missions.ts
    │
    ├── systems/
    │   ├── InputManager.ts
    │   ├── AudioManager.ts
    │   ├── SaveManager.ts
    │   └── DebugSystem.ts
    │
    ├── world/
    │   ├── World.ts
    │   ├── CityGenerator.ts
    │   ├── RoadNetwork.ts
    │   ├── BuildingFactory.ts
    │   ├── PropFactory.ts
    │   └── Lighting.ts
    │
    ├── player/
    │   ├── Player.ts
    │   ├── PlayerController.ts
    │   ├── PlayerCamera.ts
    │   ├── PlayerInteraction.ts
    │   └── PlayerCombat.ts
    │
    ├── vehicles/
    │   ├── Vehicle.ts
    │   ├── VehicleController.ts
    │   ├── VehicleFactory.ts
    │   ├── VehicleManager.ts
    │   └── TrafficSystem.ts
    │
    ├── npc/
    │   ├── Pedestrian.ts
    │   ├── PedestrianAI.ts
    │   └── PedestrianManager.ts
    │
    ├── police/
    │   ├── WantedSystem.ts
    │   ├── PoliceAI.ts
    │   ├── PoliceSpawner.ts
    │   └── PursuitManager.ts
    │
    ├── missions/
    │   ├── Mission.ts
    │   ├── MissionManager.ts
    │   └── definitions.ts
    │
    └── ui/
        ├── HUD.ts
        ├── ScreenManager.ts
        └── MissionUI.ts
```

Do not create files that have no immediate purpose.

---

# 28. GLOBAL GAME STATE

Keep state simple.

Suggested shape:

```ts
interface GameState {
  mode: "title" | "playing" | "paused" | "busted" | "complete";
  playerHealth: number;
  bankedCash: number;
  carriedCash: number;
  wantedLevel: 0 | 1 | 2 | 3;
  currentMissionId: string | null;
  currentObjective: string | null;
  playerVehicleId: string | null;
}
```

Do not introduce Redux or another app state library.

---

# 29. EVENT BUS

A tiny typed event bus is acceptable to decouple systems.

Useful events:

```text
crime:committed
wanted:changed
wanted:escaped
vehicle:entered
vehicle:exited
player:damaged
player:busted
mission:started
mission:objectiveChanged
mission:completed
cash:carriedChanged
cash:banked
```

Do not turn the event bus into a complex framework.

---

# 30. GAME LOOP RESPONSIBILITIES

`Game.ts` should orchestrate major systems, not contain every mechanic.

Typical update order:

1. Input
2. Player / current vehicle
3. Traffic
4. Pedestrians
5. Wanted system
6. Police
7. Missions
8. UI
9. Audio parameter updates
10. Debug metrics

Avoid allocations inside every frame where easy.

---

# 31. COLLISION AND PHYSICS STRATEGY

## 31.1 Time-box rule

Physics integration is allowed a limited effort window.

If Havok setup or rigid-body behavior creates severe bundling/instability problems, simplify.

The user wants a game, not a physics-engine demo.

## 31.2 Player

Possible approaches:
- physics capsule;
- Babylon collision movement;
- raycast-ground custom controller.

Choose the simplest stable option.

## 31.3 Vehicles

Preferred:
- one rigid body;
- custom arcade forces/velocity steering.

Avoid:
- complex suspension;
- wheel constraints;
- tire simulation;
- drivetrain simulation.

## 31.4 Buildings

Static colliders only where required.

Do not create unnecessary collider detail.

---

# 32. PERFORMANCE BUDGET

Target:
- smooth play on a typical modern desktop;
- aim near 60 FPS;
- avoid sustained drops below roughly 40 FPS in normal play.

Practical caps:
- 8–14 traffic vehicles;
- 12–24 pedestrians;
- 1–4 police vehicles;
- limited dynamic lights;
- reuse materials;
- reuse meshes/instances when convenient;
- no hundreds of shadow-casting objects.

## 32.1 Shadows

Use limited shadows:
- player;
- nearby vehicles;
- major objects only if affordable.

If shadows hurt performance, reduce them before removing gameplay systems.

## 32.2 Police lights

Do not attach many expensive point lights to every vehicle.

Possible optimization:
- emissive meshes always;
- one/two short-range dynamic lights only for nearest police vehicle;
- toggle or pulse.

---

# 33. SAVE / PERSISTENCE

MVP persistence uses `localStorage`.

Save only:
- best banked cash/high score;
- optional completed mission flag for convenience.

Do not build save slots.

Do not make persistence a blocker.

---

# 34. ERROR HANDLING

Game should:
- fail loudly in console during development;
- avoid blank screens;
- show a simple error panel if initialization fails;
- prevent duplicate systems from being created on restart.

OpenCode must fix TypeScript/build errors immediately rather than continuing around them.

---

# 35. DEBUG TOOLS

Development debug panel may show:
- FPS
- player position
- speed
- active traffic count
- active pedestrian count
- active police count
- wanted level
- mission/stage

Debug panel must be disabled by default for final build.

Useful debug actions:
- set wanted 0/1/2/3;
- teleport to mission;
- teleport to safehouse;
- respawn;
- complete current objective;
- reset nearest vehicle.

These tools can save hours during a 24-hour challenge.

---

# 36. IMPLEMENTATION PRINCIPLES FOR AI AGENTS

OpenCode and all subagents/models must obey:

1. Read this file before each major milestone.
2. Work on one milestone at a time.
3. Do not rewrite stable systems without a concrete reason.
4. Prefer modifying the smallest number of files needed.
5. Keep TypeScript strict enough to catch errors but do not spend competition time perfecting types.
6. Do not add dependencies unless they materially reduce implementation time.
7. Never introduce a backend.
8. Never introduce multiplayer.
9. Never add a feature from the forbidden list.
10. After each milestone:
    - run build;
    - inspect errors;
    - fix errors;
    - report what changed;
    - report what remains.
11. If a feature cannot be completed reliably, use the fallback described in this document.
12. Do not leave TODO placeholders for required behavior and mark the milestone complete.
13. Avoid giant files when a system has clearly become independent, but also avoid premature micro-files.
14. Preserve existing working behavior.
15. Favor deterministic procedural generation with a fixed seed.
16. Make the game playable early.

---

# 37. OPENAI / MODEL-INDEPENDENT OPENCODE RULE

This project must use only free models available in the user's OpenCode environment.

Do not assume a specific free model name will remain available.

At the beginning of the session:
1. inspect the currently available models using OpenCode's supported model-listing mechanism;
2. select an available free coding-capable model;
3. optionally use a second free model for review/debugging;
4. never switch to a paid model without explicit user permission.

Model selection must not alter the architecture.

---

# 38. BUILD ORDER — NON-NEGOTIABLE MILESTONES

The build order below exists to prevent a 24-hour failure where many systems exist but the game is not playable.

---

## M0 — PROJECT BOOTS

Goal:
A clean Vite + TypeScript + Babylon scene opens in browser.

Tasks:
- initialize project;
- install minimal dependencies;
- create canvas;
- create Babylon engine;
- create scene;
- add basic light;
- add ground;
- render loop;
- resize handling;
- basic CSS.

Acceptance:
- `npm run dev` loads;
- no fatal console errors;
- `npm run build` passes;
- visible 3D scene.

Do not continue until this works.

---

## M1 — PLAYER MOVEMENT

Goal:
Player can move through an empty test scene.

Tasks:
- input manager;
- simple humanoid/placeholder;
- ground collision;
- WASD;
- sprint;
- jump;
- third-person camera.

Acceptance:
- player movement is camera-relative;
- player remains grounded;
- camera is usable;
- build passes.

---

## M2 — CITY BLOCKOUT

Goal:
A complete small city exists.

Tasks:
- road network;
- sidewalks;
- block layout;
- procedural buildings;
- landmarks;
- street props;
- boundaries;
- fixed sunset lighting;
- mission/safehouse location placeholders.

Acceptance:
- player can walk through entire map;
- map has recognizable zones;
- no major blocking geometry traps;
- performance acceptable.

At this point the game should already be visually recognizable.

---

## M3 — ONE DRIVEABLE VEHICLE

Goal:
Player can drive one test car.

Tasks:
- vehicle primitive mesh;
- arcade controller;
- acceleration;
- steering;
- braking/reverse;
- handbrake;
- collision;
- vehicle camera.

Acceptance:
- car reliably moves;
- steering is controllable;
- car does not constantly flip;
- reset path exists for overturned/stuck car;
- build passes.

---

## M4 — ENTER / EXIT VEHICLE

Goal:
Player can move between on-foot and vehicle modes.

Tasks:
- interaction detection;
- enter;
- controller switch;
- camera switch;
- exit;
- safe spawn position beside vehicle.

Acceptance:
- enter/exit can repeat many times;
- no duplicate player/controller;
- no camera lockup;
- no input conflict.

This is the first major "GTA-feeling" gate.

---

## M5 — VEHICLE VARIANTS + TRAFFIC

Goal:
The city feels alive with moving cars.

Tasks:
- shared Vehicle class/factory;
- sedan;
- sport;
- police visual;
- road nodes;
- traffic routes;
- traffic spawns;
- simple avoidance;
- stuck recovery.

Acceptance:
- at least 8 traffic vehicles can circulate;
- player can steal a traffic car if desired;
- traffic does not instantly collapse into permanent pileups.

---

## M6 — PEDESTRIANS

Goal:
The city has lightweight civilian activity.

Tasks:
- pedestrian primitive;
- spawn points;
- idle;
- wander;
- flee;
- cleanup/despawn.

Acceptance:
- at least 12 pedestrians active;
- they move without tanking performance;
- nearby chaos triggers flee behavior.

---

## M7 — WANTED SYSTEM

Goal:
Crime creates a readable 0–3 wanted state.

Tasks:
- crime events;
- wanted state;
- escalation;
- HUD stars;
- escape timer;
- cooldown UI;
- reset.

Acceptance:
- developer can trigger each wanted level;
- wanted cools only after disengagement;
- HUD clearly communicates state.

Do not build advanced police behavior before this state machine is correct.

---

## M8 — POLICE PURSUIT

Goal:
Police vehicles chase and create pressure.

Tasks:
- police spawner;
- road-aware spawn points;
- chase steering;
- last known player position;
- search/disengage;
- siren;
- red/blue lights;
- active-unit caps.

Acceptance:
- 1 star creates light pursuit;
- 2 stars creates stronger pursuit;
- 3 stars feels intense;
- police despawn/disengage after escape;
- player can actually lose police.

This is the project's showcase milestone.

---

## M9 — CASH + SAFEHOUSE

Goal:
Risk/reward loop works.

Tasks:
- carried cash;
- banked cash;
- safehouse;
- banking feedback;
- lose carried cash on bust;
- optional best score persistence.

Acceptance:
- cash rewards can be added;
- banking transfers values;
- bust removes carried but not banked cash.

---

## M10 — MISSION FRAMEWORK

Goal:
Scripted mission stages can run without hardcoding UI all over the codebase.

Tasks:
- MissionManager;
- mission definitions;
- stage transition helpers;
- world markers;
- objective HUD;
- completion/failure events.

Acceptance:
- one test mission can advance through at least three stages;
- markers update;
- objective text updates;
- completion event fires.

---

## M11 — MISSION 1: HOT START

Implement exactly as specified above.

Acceptance:
Full mission playable from start to finish.

---

## M12 — MISSION 2: QUICK CASH

Implement exactly as specified above.

Acceptance:
Full mission playable from start to finish.

---

## M13 — MISSION 3: HEATLINE

Implement exactly as specified above.

Acceptance:
Full finale playable from start to finish.

---

## M14 — BUST / HEALTH / COMBAT

Priority order:

1. Bust/death loop
2. Health
3. Police pressure
4. Pistol only if stable

Acceptance:
- player can fail and respawn;
- carried cash loss works;
- game does not require page refresh to recover.

---

## M15 — AUDIO + FEEDBACK

Tasks:
- audio context initialization;
- engine sound;
- siren;
- UI sounds;
- mission sounds;
- collision sound;
- alarm;
- optional gunshot;
- camera shake;
- money popup;
- screen flash where useful.

Acceptance:
Game feels significantly more responsive without new core mechanics.

---

## M16 — VISUAL POLISH

Tasks:
- tune sunset;
- fog;
- emissive signs;
- police lights;
- mission markers;
- better vehicle shapes;
- building variation;
- optional bloom;
- optional FXAA;
- tire skid particles;
- impact sparks if cheap.

Acceptance:
No polish feature may substantially reduce playability or FPS.

---

## M17 — PERFORMANCE PASS

Tasks:
- inspect FPS;
- reduce dynamic lights;
- cap entities;
- disable expensive shadows;
- reuse materials;
- avoid per-frame allocations where obvious;
- remove unnecessary geometry/colliders.

Acceptance:
Game remains responsive during 3-star pursuit.

---

## M18 — FULL QA

Test:
- fresh load;
- title;
- movement;
- camera;
- all mission flows;
- all wanted levels;
- enter/exit repeated;
- traffic;
- pedestrian behavior;
- bust;
- banking;
- mission restart;
- final completion;
- resize;
- production build.

Acceptance:
No known blocker prevents a judge from completing the game.

---

## M19 — DEPLOYMENT

Tasks:
- run production build;
- use correct relative/static asset paths;
- test production preview;
- deploy `dist`;
- test deployed page;
- verify browser console.

Acceptance:
Public URL loads and game starts from a clean browser session.

---

# 39. 24-HOUR COMPETITION SCHEDULE

This is a guide, not a promise. The milestones matter more than exact hours.

## Hours 0–1
- repository
- plan check
- M0

## Hours 1–3
- M1 player
- M2 city blockout

## Hours 3–6
- M3 vehicle
- M4 enter/exit

**Emergency gate:**  
By hour 6 the player must be able to walk, enter a car, and drive in the city.

If not, stop all optional work and fix this.

## Hours 6–9
- M5 traffic
- M6 pedestrians

## Hours 9–12
- M7 wanted
- M8 police pursuit

**Emergency gate:**  
By hour 12 the player must be able to commit a crime and get chased.

If not, cut pedestrians before cutting wanted/police.

## Hours 12–15
- M9 cash
- M10 mission framework
- M11 Mission 1

## Hours 15–18
- M12 Mission 2
- M13 Mission 3

**Emergency gate:**  
By hour 18 at least two missions must be complete.

If Mission 3 is not possible, build a shorter finale using the same systems.

## Hours 18–20
- M14 failure/combat
- M15 audio/feedback

## Hours 20–22
- M16 visual polish
- M17 performance

## Hours 22–24
- M18 QA
- M19 deploy
- only bug fixes after final stable build exists

Do not begin a risky optional system during the final two hours.

---

# 40. EMERGENCY CUT ORDER

If behind schedule, cut in this exact order:

1. Gamepad
2. Minimap
3. Roadblocks
4. Additional car types
5. Stunt bonus
6. Extra VFX
7. Pistol/combat
8. Police on-foot behavior
9. Pedestrian count
10. Pedestrian flee complexity
11. Traffic count
12. Mission 3 complexity
13. Mission 2 complexity

Never cut:
- driving;
- enter/exit;
- wanted system;
- basic police chase;
- Mission 1;
- cash banking;
- stable build.

Those are the identity of the game.

---

# 41. FALLBACKS FOR RISKY SYSTEMS

## Physics failure
Fallback:
- use simpler collision/movement;
- arcade velocity;
- keep vehicles upright artificially if needed.

## Traffic pathfinding failure
Fallback:
- use fixed loops;
- fewer routes;
- despawn stuck cars.

## Pedestrian navigation failure
Fallback:
- hand-authored sidewalk node loops.

## Police pathfinding failure
Fallback:
- police spawn on nearby road;
- chase target using nearest road node + direct steering;
- allow imperfect pursuit.

## Combat failure
Fallback:
- remove pistol;
- police danger comes from proximity/contact;
- keep GTA feel through driving/wanted loop.

## External assets unavailable
Fallback:
- all procedural meshes;
- CSS UI;
- WebAudio synthesis.

## Performance failure
Fallback priority:
1. reduce dynamic lights;
2. reduce shadows;
3. reduce pedestrians;
4. reduce traffic;
5. reduce police count;
6. reduce prop density;
7. disable bloom.

Never solve performance by deleting the wanted system.

---

# 42. ACCEPTANCE TEST MASTER CHECKLIST

A build is competition-ready only when all required checks pass.

## Boot
- [ ] Page loads without blank screen
- [ ] Start button works
- [ ] Audio activates after user gesture
- [ ] No fatal console error

## Player
- [ ] WASD works
- [ ] Sprint works
- [ ] Jump works
- [ ] Camera works
- [ ] Player cannot trivially leave map

## Vehicle
- [ ] Player can enter
- [ ] Player can drive
- [ ] Player can reverse
- [ ] Player can steer
- [ ] Player can handbrake
- [ ] Player can exit
- [ ] Repeated enter/exit remains stable
- [ ] Vehicle reset handles common stuck state

## World
- [ ] City has multiple recognizable blocks
- [ ] Roads are driveable
- [ ] Landmarks are visible
- [ ] Boundaries work
- [ ] Safehouse is identifiable

## Traffic
- [ ] Traffic spawns
- [ ] Traffic moves
- [ ] Stuck traffic can recover/despawn
- [ ] Player can interact with suitable traffic cars

## Pedestrians
- [ ] Pedestrians spawn
- [ ] Idle/wander works
- [ ] Flee works or simplified fallback is active

## Wanted
- [ ] 1 star works
- [ ] 2 stars works
- [ ] 3 stars works
- [ ] Crime raises heat
- [ ] Police response scales
- [ ] Escape cooldown works
- [ ] Wanted resets after escape

## Cash
- [ ] Mission reward becomes Carried Cash
- [ ] Safehouse banks cash
- [ ] Busted loses Carried Cash
- [ ] Banked Cash survives bust

## Missions
- [ ] Hot Start complete
- [ ] Quick Cash complete
- [ ] Heatline complete or approved simplified finale
- [ ] Objective text updates
- [ ] Markers update
- [ ] Mission completion feedback appears

## Failure
- [ ] Player can be busted
- [ ] Respawn works
- [ ] Game continues without reload

## Polish
- [ ] Siren works
- [ ] Engine audio works
- [ ] Police lights work
- [ ] Mission feedback works
- [ ] HUD is readable
- [ ] No copied GTA branding/assets

## Performance
- [ ] 3-star chase remains playable
- [ ] No catastrophic entity growth
- [ ] No obvious memory leak during normal demo

## Production
- [ ] `npm run build` succeeds
- [ ] `npm run preview` succeeds
- [ ] Deployed build loads from clean session

---

# 43. DEFINITION OF DONE FOR EVERY MILESTONE

A milestone is only DONE if:

1. required behavior exists;
2. it is connected to the running game;
3. TypeScript/build succeeds;
4. no new fatal console errors exist;
5. previous completed milestones still work;
6. acceptance criteria are actually tested;
7. any fallback used is documented.

"Code was written" is not the same as "milestone complete."

---

# 44. CODE QUALITY RULES

Competition code should be maintainable enough for fast iteration.

Use:
- descriptive names;
- small focused functions;
- config objects for tuning;
- comments only where logic is non-obvious;
- shared constants for collision groups/tags if needed.

Avoid:
- magical unexplained numbers scattered everywhere;
- circular imports;
- god classes thousands of lines long;
- giant generic frameworks;
- dead code;
- commented-out abandoned implementations;
- package bloat.

Before large refactors, ask:
> Is the current system preventing the next required feature?

If no, do not refactor during the competition.

---

# 45. CONFIGURATION-FIRST TUNING

Put tuneable gameplay values in config modules.

Examples:

```ts
export const WANTED_CONFIG = {
  maxLevel: 3,
  escapeSeconds: {
    1: 8,
    2: 12,
    3: 16,
  },
};

export const WORLD_CONFIG = {
  trafficCount: 10,
  pedestrianCount: 16,
  policeCaps: {
    1: 1,
    2: 3,
    3: 4,
  },
};
```

This allows fast balancing without code surgery.

---

# 46. PROCEDURAL CITY GENERATION GUIDELINES

The city generator should be deterministic.

Use a fixed seed.

Generate:
- road layout from predefined map data;
- buildings from block descriptors;
- façade variation from seeded values;
- props from controlled spawn points.

Do not create an unconstrained random city.

The final competition map should be predictable so missions never break.

A good approach is:
- manually define the road/block graph;
- procedurally decorate it.

---

# 47. WORLD MARKERS

Use visually strong markers:
- floating ring;
- vertical beam;
- icon plane;
- pulsing emissive cylinder.

Marker types:
- mission start;
- mission objective;
- drop-off;
- safehouse;
- package;
- vehicle target.

Markers should be visible from useful distance without filling the screen.

---

# 48. VISUAL JUICE PRIORITY

If core systems are complete, add polish in this order:

1. Police red/blue light pulses
2. Siren and engine sound
3. Speed-sensitive camera/FOV
4. Collision camera shake
5. Tire skid smoke
6. Mission completion flash/chime
7. Cash popup
8. Neon emissive signs
9. Bloom
10. Small sparks/impact effects

These create more perceived quality than adding a fourth mission.

---

# 49. DEMO / JUDGE FLOW

Prepare the game so a judge can understand it without explanation.

Title:
**HEATLINE: DISTRICT 24**

Subtitle:
**STEAL. ESCAPE. BANK THE CASH.**

Button:
**ENTER DISTRICT 24**

First objective:
**STEAL THE MARKED CAR**

Interaction prompt:
**E — ENTER**

When wanted begins:
**HEAT  ★☆☆**

When escaping:
**LOSE THE COPS**

After escape:
**DELIVER THE CAR**

After reward:
**+$500 CARRIED**

Safehouse:
**BANK YOUR CASH**

This messaging teaches the entire game loop naturally.

---

# 50. ORIGINALITY / IP SAFETY

This project may be described as GTA-inspired or a GTA clone for the challenge, but the game itself must use original content.

Do not copy:
- GTA logo;
- GTA fonts;
- GTA characters;
- GTA maps;
- GTA mission names;
- GTA music;
- GTA audio;
- GTA UI art;
- Rockstar branding;
- recognizable proprietary vehicle models.

Use the genre conventions, not copyrighted assets.

---

# 51. REPOSITORY HYGIENE

Recommended:
- commit after stable milestones if Git is available;
- use short commit messages such as:
  - `m0 bootstrap babylon scene`
  - `m1 player movement`
  - `m4 vehicle enter exit`
  - `m8 police pursuit`
  - `m13 finale mission`

Never leave the only working state uncommitted before a risky refactor.

If automated commits are not desired by the user, at minimum avoid destructive rewrites.

---

# 52. OPENCODE TASK EXECUTION FORMAT

For each milestone, OpenCode should internally structure the work as:

## Current milestone
Name and goal.

## Files to inspect
Only relevant files.

## Implementation steps
Small ordered changes.

## Acceptance tests
Specific checks from this document.

## Build result
Pass/fail.

## Regression checks
Confirm previous core features still work.

## Status
- DONE
- BLOCKED
- FALLBACK USED

Do not begin the next milestone while status is BLOCKED.

---

# 53. OPENCODE BEHAVIOR WHEN SOMETHING BREAKS

If a new change breaks a previously working required feature:

1. stop;
2. identify the regression;
3. revert or fix the smallest responsible change;
4. restore stable build;
5. then continue.

Do not stack more features on a broken foundation.

If debugging takes too long:
- apply the documented fallback;
- keep moving.

---

# 54. FINAL COMPETITION PRIORITY ORDER

When deciding what to do next, use this exact ranking:

1. Build runs
2. Player movement works
3. Car driving works
4. Enter/exit works
5. City is readable
6. Wanted system works
7. Police chase is fun
8. Mission 1 works
9. Risk cash loop works
10. Mission 2 works
11. Mission 3 works
12. Audio feedback
13. Visual polish
14. Pedestrian sophistication
15. Combat
16. Optional features

---

# 55. WHAT SUCCESS LOOKS LIKE

The project is successful if a judge can:

1. open a URL;
2. click play;
3. immediately move through a stylized city;
4. steal a car;
5. drive;
6. trigger police;
7. feel escalating pursuit;
8. escape;
9. complete missions;
10. bank risky money;
11. understand the full game loop without developer explanation.

The game does not need to be large.

It needs to feel **complete, intentional, energetic, and stable**.

---

# 56. INITIAL OPENCODE PROMPT

Copy the prompt below into OpenCode after placing this file in the repository root as `MASTER_GAME_PLAN.md`.

---

## BEGIN OPENCODE PROMPT

You are the implementation agent for a 24-hour browser-game competition project.

The repository root contains `MASTER_GAME_PLAN.md`.

Your first action is to read `MASTER_GAME_PLAN.md` completely and treat it as the source of truth for game design, technical architecture, feature scope, milestone order, fallbacks, QA, and definition of done.

The project is **HEATLINE: DISTRICT 24**, a compact GTA-inspired single-player 3D browser crime sandbox.

Operating rules:

1. Use only free models available in the current OpenCode environment. Do not use a paid model.
2. Do not attempt to build the whole game in one giant change.
3. Follow the milestone order in `MASTER_GAME_PLAN.md` starting from the earliest incomplete milestone.
4. Complete only one milestone at a time.
5. Before editing, inspect the current repository and determine what already exists.
6. Do not overwrite working systems merely to match a preferred style.
7. Do not add features outside the master plan.
8. Never add multiplayer, a backend, database, accounts, interiors, advanced AI, or any feature in the forbidden scope.
9. Prefer simple, robust, procedural solutions over asset-heavy or architecture-heavy solutions.
10. The game must become playable as early as possible.
11. After every milestone:
    - run the appropriate TypeScript/build checks;
    - fix all blocking errors;
    - verify the milestone acceptance criteria;
    - check that previous core features still work;
    - summarize files changed and test results.
12. If a planned implementation becomes unstable, use the fallback documented in `MASTER_GAME_PLAN.md` instead of spending excessive time perfecting it.
13. Do not claim a milestone is complete if required behavior is only stubbed, commented, TODO, or disconnected from gameplay.
14. Keep tuneable values in configuration where practical.
15. Preserve a stable working build at all times.
16. Do not start optional polish until required gameplay systems and missions are complete.
17. Do not wait for external art. MVP visuals should be code-generated low-poly geometry and CSS/HTML UI.
18. Audio should be self-contained where possible using Web Audio synthesis.
19. Target desktop browser, keyboard + mouse, static deployment.
20. Use TypeScript + Vite + Babylon.js as defined by the master plan.

Execution procedure for this session:

A. Read `MASTER_GAME_PLAN.md` completely.
B. Inspect the repository.
C. Identify the earliest incomplete milestone.
D. State that milestone's goal and acceptance criteria.
E. Implement it with the smallest reliable set of changes.
F. Run build/checks.
G. Fix failures.
H. Verify the acceptance criteria as far as the available environment allows.
I. Report:
   - milestone completed;
   - files changed;
   - tests/build result;
   - any fallback used;
   - next milestone.
J. Continue to the next milestone only if the current one is stable and complete.

Important competition rule:

If a choice is between:
- a more impressive but risky system, and
- a simpler system that delivers the intended player experience,

choose the simpler working system.

The showcase mechanics are:
- third-person movement;
- stealable/driveable cars;
- a compact living city;
- 0–3 star wanted system;
- police pursuit and escape;
- three short missions;
- carried cash versus banked cash.

Protect those systems above optional features.

Begin now by reading the master plan and inspecting the repository. Then execute the earliest incomplete milestone.

## END OPENCODE PROMPT

---

# 57. PROMPT FOR A FRESH OPENCODE SESSION AFTER WORK ALREADY EXISTS

Use this when restarting OpenCode later:

## BEGIN RESUME PROMPT

Read `MASTER_GAME_PLAN.md` completely.

Then inspect the current repository and running implementation before editing anything.

Determine:
1. which milestones are already genuinely complete;
2. which milestone is currently incomplete;
3. whether the build passes;
4. whether any required gameplay system has regressed.

Do not redo completed work.

Restore a passing/stable build first if necessary.

Then continue from the earliest incomplete milestone according to the exact milestone order, acceptance criteria, scope firewall, fallbacks, and OpenCode operating rules in `MASTER_GAME_PLAN.md`.

Use only free models available in the current OpenCode environment.

After each milestone, build, test, report results, and only then continue.

## END RESUME PROMPT

---

# 58. PROMPT FOR A DEBUGGING-ONLY OPENCODE SESSION

## BEGIN DEBUG PROMPT

Read `MASTER_GAME_PLAN.md` first.

Do not add features.

The current task is stabilization only.

Inspect the reported bug and the smallest relevant set of files.

Your priorities are:
1. reproduce or identify the failure;
2. preserve already working required systems;
3. fix the smallest root cause;
4. run the production build;
5. test the affected gameplay path;
6. report the exact fix and any remaining risk.

Do not refactor unrelated systems.
Do not add dependencies unless absolutely necessary.
Do not expand scope.

Use only a free model available in the current OpenCode environment.

## END DEBUG PROMPT

---

# 59. FINAL RELEASE CHECKLIST FOR THE HUMAN OPERATOR

Before submission:

- [ ] Open deployed game in a fresh/incognito browser
- [ ] Confirm title screen
- [ ] Confirm start button unlocks audio
- [ ] Play Mission 1 end-to-end
- [ ] Play Mission 2 end-to-end
- [ ] Play Mission 3 end-to-end
- [ ] Get busted at least once
- [ ] Bank cash
- [ ] Trigger all 3 wanted levels
- [ ] Escape 3-star wanted
- [ ] Enter and exit multiple cars
- [ ] Confirm no keyboard focus trap
- [ ] Confirm console has no fatal errors
- [ ] Confirm 3-star chase is performant
- [ ] Confirm production URL works after hard refresh
- [ ] Confirm no prohibited/copyrighted GTA assets
- [ ] Record a short backup demo video if competition rules allow
- [ ] Preserve the final working repository state

---

# 60. FINAL REMINDER TO EVERY AI AGENT

The winning version of this project is not the version with the most systems.

The winning version is the one where the judge steals a car, hears the siren, sees the wanted stars appear, tears through a neon city with police behind them, escapes with a sliver of health, reaches the safehouse, and watches risky cash become banked cash.

Build that experience first.

Everything else is secondary.
