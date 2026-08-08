import { Color3, Engine, MeshBuilder, Ray, Scene, StandardMaterial, Vector3 } from "@babylonjs/core";
import { createInitialState, type GameState } from "./GameState";
import { EventBus } from "./EventBus";
import { CashSystem } from "./CashSystem";
import { DEBUG_MODE } from "./constants";
import { AudioManager } from "../systems/AudioManager";
import { InputManager } from "../systems/InputManager";
import { Player } from "../player/Player";
import { PlayerController } from "../player/PlayerController";
import { PlayerCamera } from "../player/PlayerCamera";
import { World } from "../world/World";
import { setupLighting } from "../world/Lighting";
import { VehicleController } from "../vehicles/VehicleController";
import { VehicleManager } from "../vehicles/VehicleManager";
import { TrafficSystem } from "../vehicles/TrafficSystem";
import { PedestrianManager } from "../npc/PedestrianManager";
import { WantedSystem } from "../police/WantedSystem";
import { PoliceManager } from "../police/PoliceManager";
import { WantedHUD } from "../ui/WantedHUD";
import { CashHUD } from "../ui/CashHUD";
import { HealthHUD } from "../ui/HealthHUD";
import { MissionHUD } from "../ui/MissionHUD";
import { MissionManager } from "../missions/MissionManager";
import { HotStartMission } from "../missions/HotStartMission";
import { QuickCashMission } from "../missions/QuickCashMission";
import { HeatlineMission } from "../missions/HeatlineMission";
import type { MissionContext } from "../missions/Mission";
import { BUST_CONFIG, COMBAT_CONFIG, INTERACTION_RANGE, PLAYER_CONFIG, SAFEHOUSE_CONFIG, VEHICLE_EXIT_OFFSET } from "../config/gameplay";
import type { Vehicle } from "../vehicles/Vehicle";
import type { Pedestrian } from "../npc/Pedestrian";

type ControlMode = "on_foot" | "in_vehicle";

export class Game {
  readonly engine: Engine;
  readonly scene: Scene;
  readonly audio = new AudioManager();
  readonly state: GameState = createInitialState();
  readonly events = new EventBus();
  readonly input: InputManager;
  readonly player: Player;
  readonly playerController: PlayerController;
  readonly playerCamera: PlayerCamera;
  readonly world: World;
  readonly vehicleManager: VehicleManager;
  readonly vehicleController = new VehicleController();
  readonly trafficSystem: TrafficSystem;
  readonly pedestrianManager: PedestrianManager;
  readonly wantedSystem: WantedSystem;
  readonly policeManager: PoliceManager;
  readonly cash: CashSystem;
  readonly missionManager: MissionManager;
  private readonly wantedHUD: WantedHUD;
  private readonly cashHUD: CashHUD;
  private readonly healthHUD: HealthHUD;
  private readonly missionHUD: MissionHUD;
  private readonly muzzle: import("@babylonjs/core").Mesh;
  private pedFleeTimer = 0;

  private controlMode: ControlMode = "on_foot";
  private time = 0;
  private paused = false;
  private interactPrompt: HTMLElement;
  private debugPanel: HTMLElement;
  private lastPromptText = "";
  private bustedTimer = 0;
  private bustGrace = 0;
  private fireCooldown = 0;
  private muzzleTimer = 0;
  private vehicleCleanupTimer = 0;
  private lastWantedLevel = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true, { stencil: true });
    this.scene = new Scene(this.engine);
    this.scene.collisionsEnabled = true;
    setupLighting(this.scene);

    this.input = new InputManager(canvas);
    this.playerCamera = new PlayerCamera(this.scene);
    this.player = new Player(this.scene);
    this.playerController = new PlayerController(this.player);
    this.world = new World(this.scene);
    this.vehicleManager = new VehicleManager(this.scene);

    this.player.setPosition(this.findClearSpot([
      this.world.landmarks.playerSpawnPos,
      this.world.landmarks.playerSpawnPos.add(new Vector3(0, 0, 3)),
      this.world.landmarks.playerSpawnPos.add(new Vector3(3, 0, 0)),
    ]) ?? this.world.landmarks.playerSpawnPos);
    this.playerCamera.switchToFoot();
    this.playerCamera.camera.position = this.player.position.add(new Vector3(0, 2.4, 6));

    this.vehicleManager.spawn("sport", new Vector3(42, 0, 0), Math.PI, "civilian");
    this.vehicleManager.spawn("sedan", new Vector3(-70, 0, 45), 0, "civilian");

    this.trafficSystem = new TrafficSystem(
      this.scene,
      this.world.network,
      this.vehicleManager,
      this.events,
      () => this.player.position,
      () => this.controlMode === "in_vehicle",
    );

    this.pedestrianManager = new PedestrianManager(
      this.scene,
      this.world.network,
      () => this.player.position,
      () => this.getPlayerSpeed(),
    );

    this.wantedSystem = new WantedSystem(this.events, this.state);

    this.policeManager = new PoliceManager(
      this.scene,
      this.world.network,
      this.vehicleManager,
      this.wantedSystem,
      this.audio,
      this.events,
      () => this.player.position,
      () => this.getPlayerSpeed(),
      () => this.getPlayerHeading(),
      () => this.vehicleManager.vehicles,
      () => this.controlMode === "in_vehicle",
    );

    this.wantedHUD = new WantedHUD();
    this.cash = new CashSystem(this.events, this.state);
    this.cashHUD = new CashHUD(this.events, this.state);
    this.healthHUD = new HealthHUD(this.events);
    this.missionHUD = new MissionHUD();

    const muzzleMat = new StandardMaterial("muzzleMat", this.scene);
    muzzleMat.emissiveColor = new Color3(1, 0.8, 0.3);
    this.muzzle = MeshBuilder.CreateSphere("muzzleFlash", { diameter: 0.14 }, this.scene);
    this.muzzle.material = muzzleMat;
    this.muzzle.isPickable = false;
    this.muzzle.parent = this.playerCamera.camera;
    this.muzzle.position.set(0, -0.05, 1.6);
    this.muzzle.isVisible = false;

    this.events.on("mission:started", () => this.audio.playMissionStart());
    this.events.on("mission:completed", () => this.audio.playMissionComplete());
    this.events.on("cash:banked", () => this.audio.playCashBank());
    this.events.on("wanted:changed", (e) => {
      if (e.level > this.lastWantedLevel) {
        this.missionHUD.flash(`WANTED LEVEL ${e.level}`, 1400);
      }
      this.lastWantedLevel = e.level;
    });
    this.updateCrosshair();

    const missionCtx: MissionContext = {
      events: this.events,
      cash: this.cash,
      vehicleManager: this.vehicleManager,
      scene: this.scene,
      landmarks: this.world.landmarks,
      flash: (text, ms) => this.missionHUD.flash(text, ms),
      alarm: () => this.audio.playAlarm(),
      playerPos: () => this.player.position,
      isInVehicle: () => this.controlMode === "in_vehicle",
      currentVehicleId: () =>
        this.controlMode === "in_vehicle" ? (this.vehicleController.getVehicle()?.id ?? null) : null,
      getVehicle: (id) => this.vehicleManager.vehicles.find((v) => v.id === id) ?? null,
      getWantedLevel: () => this.wantedSystem.level,
    };

    this.missionManager = new MissionManager(
      missionCtx,
      [new HotStartMission(missionCtx), new QuickCashMission(missionCtx), new HeatlineMission(missionCtx)],
      ["m1", "m2", "m3"],
    );
    this.missionManager.start();
    this.events.on("mission:completed", (e) => this.onMissionCompleted(e.missionId));

    this.interactPrompt = document.getElementById("interact-prompt") as HTMLElement;
    this.debugPanel = document.getElementById("debug-panel") as HTMLElement;
    if (!DEBUG_MODE) this.debugPanel.classList.add("hidden");

    const resumeBtn = document.getElementById("resume-button");
    resumeBtn?.addEventListener("click", () => {
      this.audio.playClick();
      this.setPaused(false);
    });
    const keepPlayingBtn = document.getElementById("keep-playing-button");
    keepPlayingBtn?.addEventListener("click", () => {
      this.audio.playClick();
      this.hideFinale();
    });

    window.addEventListener("resize", this.onResize);
    this.engine.runRenderLoop(this.render);
  }

  start(): void {
    this.input.requestPointerLock();
  }

  private onResize = (): void => {
    this.engine.resize();
  };

  private render = (): void => {
    const dt = Math.min(this.engine.getDeltaTime() / 1000, 0.05);
    this.update(dt);
    this.scene.render();
  };

  private update(dt: number): void {
    this.time += dt;

    const mouse = this.input.consumeMouseDelta();
    this.playerCamera.applyMouse(mouse.x, mouse.y);

    if (this.input.consumePressed("Escape") || this.input.consumePressed("KeyP")) {
      this.setPaused(!this.paused);
    }
    if (this.paused) {
      this.input.endFrame();
      return;
    }

    if (this.state.mode === "busted") {
      this.bustedTimer -= dt;
      if (this.bustedTimer <= 0) this.respawnPlayer();
      this.world.update(this.time);
      this.input.endFrame();
      return;
    }

    this.handleInteraction();

    if (this.controlMode === "on_foot") {
      this.playerController.update(dt, this.input, this.playerCamera.yaw);
      this.playerCamera.update(dt, this.player.position);
      this.playerCamera.setSpeedBoost(0);
    } else {
      const v = this.vehicleController.getVehicle();
      if (!v) {
        this.exitVehicle();
      } else {
        this.vehicleController.update(dt, this.input);
        this.playerCamera.setVehicleFollowYaw(v.yaw);
        this.playerCamera.update(dt, v.position);
        const boost = Math.abs(v.speed) / v.def.topSpeed;
        this.audio.setEngineSpeed(boost);
        this.playerCamera.setSpeedBoost(boost);
      }
    }

    this.updateCombat(dt);
    this.updateProximityPressure(dt);
    this.updateCrashDamage();
    this.cleanupAbandonedVehicles(dt);

    this.trafficSystem.update(dt);
    this.pedestrianManager.update(dt);
    this.wantedSystem.update(dt);
    this.policeManager.update(dt);
    this.missionManager.update(dt, this.time);
    this.updateSafehouseBanking();

    this.pedFleeTimer -= dt;
    if (this.wantedSystem.level > 0 && this.policeManager.hasContact && this.pedFleeTimer <= 0) {
      this.pedestrianManager.triggerFleeAt(this.player.position.x, this.player.position.z, 22);
      this.pedFleeTimer = 0.5;
    }

    this.wantedHUD.update(this.wantedSystem.level, this.wantedSystem.escapeActive);
    this.missionHUD.update(this.missionManager.activeMission, this.player.position);
    this.world.update(this.time);

    if (DEBUG_MODE) {
      if (this.input.consumePressed("KeyR")) {
        if (this.controlMode === "in_vehicle") this.vehicleController.resetCurrent();
        else this.vehicleManager.resetNearest(this.player.position.x, this.player.position.z);
      }
      if (this.input.consumePressed("Digit0")) this.wantedSystem.forceLevel(0);
      if (this.input.consumePressed("Digit1")) this.wantedSystem.forceLevel(1);
      if (this.input.consumePressed("Digit2")) this.wantedSystem.forceLevel(2);
      if (this.input.consumePressed("Digit3")) this.wantedSystem.forceLevel(3);
      if (this.input.consumePressed("KeyT")) {
        const safe = this.world.landmarks.safehousePos;
        const spots = [
          safe,
          safe.add(new Vector3(4, 0, 4)),
          safe.add(new Vector3(-4, 0, 4)),
          safe.add(new Vector3(4, 0, -4)),
          safe.add(new Vector3(-4, 0, -4)),
        ];
        const p = this.findClearSpot(spots) ?? safe;
        this.player.setPosition(p);
        this.playerController.velocity.setAll(0);
      }
    }

    this.updateInteractPrompt();
    this.updateDebug();
    this.input.endFrame();
  }

  private getPlayerSpeed(): number {
    if (this.controlMode === "in_vehicle") {
      return this.vehicleController.getVehicle()?.speed ?? 0;
    }
    return Math.hypot(this.playerController.velocity.x, this.playerController.velocity.z);
  }

  private getPlayerHeading(): { x: number; z: number } | null {
    if (this.controlMode === "in_vehicle") {
      const v = this.vehicleController.getVehicle();
      if (!v) return null;
      return { x: Math.sin(v.yaw), z: -Math.cos(v.yaw) };
    }
    const vx = this.playerController.velocity.x;
    const vz = this.playerController.velocity.z;
    const len = Math.hypot(vx, vz);
    if (len < 0.5) return null;
    return { x: vx / len, z: vz / len };
  }

  private setPaused(paused: boolean): void {
    this.paused = paused;
    this.state.mode = paused ? "paused" : "playing";
    const overlay = document.getElementById("pause-overlay") as HTMLElement;
    overlay.classList.toggle("hidden", !paused);
    if (!paused) this.input.requestPointerLock();
  }

  private updateSafehouseBanking(): void {
    if (this.state.carriedCash <= 0) return;
    if (this.wantedSystem.level > 0) return;
    const s = this.world.landmarks.safehousePos;
    const dx = this.player.position.x - s.x;
    const dz = this.player.position.z - s.z;
    if (dx * dx + dz * dz <= SAFEHOUSE_CONFIG.bankRadius * SAFEHOUSE_CONFIG.bankRadius) {
      this.cash.bankCarriedCash();
      this.missionHUD.flash("CASH BANKED +$" + this.cash.bankedCash);
    }
  }

  private updateCombat(dt: number): void {
    this.muzzleTimer = Math.max(0, this.muzzleTimer - dt);
    this.muzzle.isVisible = this.muzzleTimer > 0;
    if (COMBAT_CONFIG.enabled === false) return;
    this.fireCooldown = Math.max(0, this.fireCooldown - dt);
    if (!this.input.isPointerLocked()) return;
    if (!this.input.consumePressedButton(0)) return;
    if (this.fireCooldown > 0) return;
    this.fireCooldown = COMBAT_CONFIG.fireRate;
    this.fireWeapon();
  }

  private fireWeapon(): void {
    const cam = this.playerCamera.camera;
    const ray = cam.getForwardRay(COMBAT_CONFIG.range);
    const hit = this.scene.pickWithRay(ray, (m) => m.isPickable);
    this.audio.playGunshot();
    this.muzzleTimer = COMBAT_CONFIG.muzzleMs / 1000;
    this.playerCamera.addShake(0.05);
    this.events.emit("crime:committed", {
      type: "weapon_fire",
      x: cam.position.x,
      z: cam.position.z,
      minWanted: 1,
    });
    this.pedestrianManager.triggerFleeAt(cam.position.x, cam.position.z, 30);
    if (hit && hit.hit && hit.pickedMesh) {
      const meta = hit.pickedMesh.metadata as { ped?: Pedestrian; isVehicle?: boolean } | undefined;
      if (meta?.ped) {
        meta.ped.goDown();
        return;
      }
      if (meta?.isVehicle) {
        const v = this.vehicleManager.vehicles.find((x) => x.body === hit.pickedMesh);
        if (v && v.category === "police") {
          this.events.emit("crime:committed", {
            type: "assault_police",
            x: v.position.x,
            z: v.position.z,
            minWanted: 2,
          });
        }
      }
    }
  }

  private updateProximityPressure(dt: number): void {
    if (this.policeManager.activeCount === 0) {
      this.bustGrace = 0;
      return;
    }
    const d = this.policeManager.nearestDistanceTo(this.player.position.x, this.player.position.z);
    const speed = this.getPlayerSpeed();
    const onFoot = this.controlMode === "on_foot";
    if (d < BUST_CONFIG.policeProxRange && (onFoot || speed < 3)) {
      this.bustGrace += dt;
      if (this.bustGrace > BUST_CONFIG.policeProxGrace) {
        const drain = (onFoot ? BUST_CONFIG.policeProxDrainFoot : BUST_CONFIG.policeProxDrainVehicle) * dt;
        this.damagePlayer(drain);
      }
    } else {
      this.bustGrace = 0;
    }
  }

  private updateCrashDamage(): void {
    if (this.controlMode !== "in_vehicle") return;
    const v = this.vehicleController.getVehicle();
    if (!v || v.lastImpactSpeed <= BUST_CONFIG.crashDamageThreshold) return;
    const impact = v.lastImpactSpeed;
    const dmg = Math.min(35, impact * BUST_CONFIG.crashDamageScale);
    this.audio.playCollision(Math.min(1, (impact - BUST_CONFIG.crashDamageThreshold) / 12));
    this.playerCamera.addShake(Math.min(0.35, impact * 0.012));
    this.damagePlayer(dmg);
  }

  private damagePlayer(amount: number): void {
    if (this.state.mode === "busted") return;
    this.state.playerHealth = Math.max(0, this.state.playerHealth - amount);
    this.events.emit("player:damaged", { health: this.state.playerHealth });
    if (this.state.playerHealth <= 0) this.bustPlayer();
  }

  private bustPlayer(): void {
    if (this.state.mode === "busted") return;
    this.state.mode = "busted";
    this.state.playerHealth = 0;
    this.events.emit("player:busted", {});
    this.audio.playBusted();
    this.audio.stopEngine();
    this.playerController.active = false;
    if (this.controlMode === "in_vehicle") this.exitVehicle();
    this.playerController.active = false;
    this.missionManager.failActive();
    this.wantedSystem.forceLevel(0);
    this.cash.loseCarriedCash();
    this.policeManager.clearAll();
    document.getElementById("busted-overlay")?.classList.remove("hidden");
    document.exitPointerLock();
    this.bustedTimer = BUST_CONFIG.overlayMs / 1000;
    this.missionHUD.flash("BUSTED — CARRIED CASH LOST", 2000);
  }

  private respawnPlayer(): void {
    const safe = this.world.landmarks.safehousePos;
    const spots = [
      safe,
      safe.add(new Vector3(4, 0, 4)),
      safe.add(new Vector3(-4, 0, 4)),
      safe.add(new Vector3(4, 0, -4)),
      safe.add(new Vector3(-4, 0, -4)),
    ];
    const p = this.findClearSpot(spots) ?? safe;
    this.player.setPosition(p);
    this.playerController.velocity.setAll(0);
    this.playerController.active = true;
    this.player.setVisible(true);
    this.state.playerHealth = PLAYER_CONFIG.maxHealth;
    this.events.emit("player:damaged", { health: this.state.playerHealth });
    this.state.mode = "playing";
    this.bustGrace = 0;
    document.getElementById("busted-overlay")?.classList.add("hidden");
    this.input.requestPointerLock();
  }

  private cleanupAbandonedVehicles(dt: number): void {
    this.vehicleCleanupTimer -= dt;
    if (this.vehicleCleanupTimer > 0) return;
    this.vehicleCleanupTimer = 2;
    const player = this.player.position;
    const currentId = this.vehicleController.getVehicle()?.id;
    for (let i = this.vehicleManager.vehicles.length - 1; i >= 0; i--) {
      const v = this.vehicleManager.vehicles[i];
      if (v.id === currentId) continue;
      if (v.category === "mission") continue;
      if (this.trafficSystem.hasVehicle(v.id)) continue;
      if (this.policeManager.hasVehicle(v.id)) continue;
      const dx = v.position.x - player.x;
      const dz = v.position.z - player.z;
      const far = dx * dx + dz * dz;
      const elapsed = this.time - v.lastUsedAt;
      if ((v.stolen && elapsed > 15 && far > 60 * 60) || (!v.stolen && elapsed > 40 && far > 90 * 90)) {
        this.vehicleManager.remove(v);
      }
    }
  }

  private onMissionCompleted(missionId: string): void {
    if (missionId === "m1") {
      this.missionHUD.flash("MISSION COMPLETE — +$500 CARRIED. BANK IT OR KEEP THE HEAT GOING.");
    } else if (missionId === "m2") {
      this.missionHUD.flash("MISSION COMPLETE — +$1000 CARRIED. BANK THE CASH OR KEEP THE HEAT GOING.");
    } else if (missionId === "m3") {
      this.showFinale();
    }
  }

  private showFinale(): void {
    const stats = document.getElementById("finale-stats") as HTMLElement;
    stats.textContent = `BANKED $${this.state.bankedCash}\nCARRIED $${this.state.carriedCash}\nBEST BANKED $${this.cash.bestBanked}`;
    const overlay = document.getElementById("finale-overlay") as HTMLElement;
    overlay.classList.remove("hidden");
    document.exitPointerLock();
  }

  private hideFinale(): void {
    const overlay = document.getElementById("finale-overlay") as HTMLElement;
    overlay.classList.add("hidden");
    this.input.requestPointerLock();
  }

  private handleInteraction(): void {
    if (this.controlMode === "on_foot") {
      const v = this.vehicleManager.getNearest(this.player.position.x, this.player.position.z, INTERACTION_RANGE);
      if (v && this.input.consumePressed("KeyE")) {
        this.enterVehicle(v);
      }
    } else if (this.input.consumePressed("KeyE")) {
      this.exitVehicle();
    }
  }

  private enterVehicle(v: Vehicle): void {
    this.playerController.active = false;
    this.player.setVisible(false);
    this.vehicleController.bind(v);
    v.lastUsedAt = this.time;
    this.playerCamera.switchToVehicle(v.yaw);
    this.controlMode = "in_vehicle";
    this.state.playerVehicleId = v.id;
    this.audio.startEngine();
    this.updateCrosshair();
    this.events.emit("vehicle:entered", { vehicleId: v.id });
    this.events.emit("mode:changed", { mode: "in_vehicle" });
    if (v.category === "civilian" && !v.stolen) {
      v.stolen = true;
      this.events.emit("crime:committed", {
        type: "vehicle_theft",
        x: v.position.x,
        z: v.position.z,
        minWanted: 1,
      });
    } else if (v.category === "police") {
      this.events.emit("crime:committed", {
        type: "vehicle_theft",
        x: v.position.x,
        z: v.position.z,
        minWanted: 2,
      });
    }
  }

  private exitVehicle(): void {
    const v = this.vehicleController.getVehicle();
    this.vehicleController.unbind();
    this.playerController.active = true;
    this.player.setVisible(true);
    if (v) {
      v.lastUsedAt = this.time;
      this.player.setPosition(this.computeExitPosition(v));
    }
    this.audio.stopEngine();
    this.playerCamera.switchToFoot();
    this.controlMode = "on_foot";
    this.state.playerVehicleId = null;
    this.updateCrosshair();
    this.events.emit("vehicle:exited", { vehicleId: v?.id ?? "" });
    this.events.emit("mode:changed", { mode: "on_foot" });
  }

  private updateCrosshair(): void {
    const el = document.getElementById("crosshair");
    if (!el) return;
    el.classList.toggle("hidden", this.controlMode === "in_vehicle");
  }

  private computeExitPosition(v: Vehicle): Vector3 {
    const h = v.heading;
    const r = new Vector3(-h.z, 0, h.x);
    const base = v.position;
    const spots = [
      base.add(r.scale(VEHICLE_EXIT_OFFSET)).subtract(h.scale(0.6)),
      base.add(r.scale(VEHICLE_EXIT_OFFSET)).subtract(h.scale(1.8)),
      base.subtract(r.scale(VEHICLE_EXIT_OFFSET)).subtract(h.scale(0.6)),
      base.subtract(r.scale(VEHICLE_EXIT_OFFSET)).subtract(h.scale(1.8)),
      base.subtract(h.scale(VEHICLE_EXIT_OFFSET + 0.5)),
    ];
    return this.findClearSpot(spots) ?? base.add(r.scale(VEHICLE_EXIT_OFFSET));
  }

  private findClearSpot(candidates: Vector3[]): Vector3 | null {
    for (const c of candidates) {
      const ray = new Ray(new Vector3(c.x, 4, c.z), new Vector3(0, -1, 0), 10);
      const hit = this.scene.pickWithRay(ray, (m) => m.checkCollisions || m.isPickable);
      if (hit && hit.hit && hit.pickedPoint && hit.pickedPoint.y <= 0.5) {
        const p = c.clone();
        p.y = hit.pickedPoint.y;
        return p;
      }
    }
    return null;
  }

  private updateInteractPrompt(): void {
    let text = "";
    if (this.controlMode === "on_foot") {
      const v = this.vehicleManager.getNearest(this.player.position.x, this.player.position.z, INTERACTION_RANGE);
      if (v) text = "E — ENTER VEHICLE";
    } else {
      text = "E — EXIT VEHICLE";
    }
    if (text !== this.lastPromptText) {
      this.lastPromptText = text;
      this.interactPrompt.textContent = text;
      this.interactPrompt.classList.toggle("hidden", !text);
    }
  }

  private updateDebug(): void {
    if (!DEBUG_MODE) return;
    const v = this.vehicleController.getVehicle();
    const speed = v ? `${v.speedKmh} km/h` : "-";
    const p = this.player.position;
    const active = this.missionManager.activeMission;
    this.debugPanel.textContent = [
      `FPS ${Math.round(this.engine.getFps())}`,
      `MODE ${this.controlMode}`,
      `POS ${p.x.toFixed(0)}, ${p.z.toFixed(0)}`,
      `CASH BANKED ${this.state.bankedCash} CARRIED ${this.state.carriedCash}`,
      `MISSION ${active ? `${active.id} stage ${active.currentStage}` : "none"}`,
      `VEHICLES ${this.vehicleManager.vehicles.length}`,
      `TRAFFIC ${this.trafficSystem.activeCount}`,
      `PEDS ${this.pedestrianManager.activeCount}`,
      `WANTED ${this.wantedSystem.level}`,
      `POLICE ${this.policeManager.activeCount}`,
      `SPEED ${speed}`,
      `0-3 wanted | R reset | T safehouse | E enter/exit`,
    ].join("\n");
  }
}
