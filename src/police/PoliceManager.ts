import { Ray, Scene, Vector3 } from "@babylonjs/core";
import { POLICE_CONFIG } from "../config/gameplay";
import type { EventBus } from "../game/EventBus";
import type { AudioManager } from "../systems/AudioManager";
import { angleDiff, obstacleAhead, steerVehicle, yawTo } from "../vehicles/AIUtil";
import type { Vehicle } from "../vehicles/Vehicle";
import type { VehicleManager } from "../vehicles/VehicleManager";
import type { RoadNetwork } from "../world/RoadNetwork";
import type { WantedSystem } from "./WantedSystem";

type PoliceState = "SPAWN" | "INTERCEPT" | "CHASE" | "SEARCH" | "DISENGAGE";

interface PoliceUnit {
  vehicle: Vehicle;
  state: PoliceState;
  target: { x: number; z: number };
  lastKnown: Vector3;
  stuckTime: number;
  stateTimer: number;
}

function rand(n: number): number {
  return Math.floor(Math.random() * n);
}

export class PoliceManager {
  private units: PoliceUnit[] = [];
  private spawnTimer = 0;
  private flash = 0;
  private sirenOn = false;
  private readonly rayFrom = new Vector3();

  constructor(
    private scene: Scene,
    private network: RoadNetwork,
    private vehicleManager: VehicleManager,
    private wanted: WantedSystem,
    private audio: AudioManager,
    events: EventBus,
    private getPlayerPos: () => Vector3,
    private getPlayerSpeed: () => number,
    private getPlayerHeading: () => { x: number; z: number } | null,
    private getAllVehicles: () => Vehicle[],
    private getPlayerDriving: () => boolean,
  ) {
    events.on("vehicle:entered", ({ vehicleId }) => {
      for (let i = this.units.length - 1; i >= 0; i--) {
        if (this.units[i].vehicle.id === vehicleId) {
          this.despawn(i);
          return;
        }
      }
    });
  }

  get activeCount(): number {
    return this.units.length;
  }

  get hasContact(): boolean {
    return this.units.some((u) => u.state === "CHASE");
  }

  update(dt: number): void {
    const player = this.getPlayerPos();

    this.manageSpawns(player, dt);
    this.flash += dt;

    for (let i = this.units.length - 1; i >= 0; i--) {
      const unit = this.units[i];
      if (unit.stuckTime > POLICE_CONFIG.stuckDespawnTime) {
        this.despawn(i);
        continue;
      }
      this.updateUnit(unit, dt, player);
    }

    let contact = false;
    for (const u of this.units) {
      if (u.state === "DISENGAGE") continue;
      if (this.seesPlayer(u, player)) {
        contact = true;
        break;
      }
    }
    this.wanted.setPoliceContact(contact);

    this.updateLights();
    this.updateSiren(player);
  }

  private seesPlayer(unit: PoliceUnit, player: Vector3): boolean {
    const dx = player.x - unit.vehicle.position.x;
    const dz = player.z - unit.vehicle.position.z;
    const d2 = dx * dx + dz * dz;
    const range = POLICE_CONFIG.contactRange;
    if (d2 > range * range) return false;

    const from = this.rayFrom.set(unit.vehicle.position.x, 1.2, unit.vehicle.position.z);
    const dir = player.subtract(from);
    const len = dir.length();
    if (len < 0.5) return true;
    dir.normalize();
    const ray = new Ray(from, dir, len);
    const hit = this.scene.pickWithRay(ray, (m) => m.checkCollisions && !(m.metadata && m.metadata.isVehicle));
    return !(hit && hit.hit && hit.distance < len - 1);
  }

  private manageSpawns(player: Vector3, dt: number): void {
    const desired = POLICE_CONFIG.caps[this.wanted.level] ?? 0;

    while (this.units.length > desired) {
      const unit = this.units[this.units.length - 1];
      if (unit.state === "DISENGAGE") {
        this.despawn(this.units.length - 1);
        continue;
      }
      unit.state = "DISENGAGE";
      const away = new Vector3(player.x + 80, 0, player.z + 80);
      const node = this.network.getClosestNode(away.x, away.z);
      if (node) unit.target = { x: node.x, z: node.z };
      unit.stateTimer = POLICE_CONFIG.disengageTime;
      break;
    }

    this.spawnTimer -= dt;
    if (this.units.length < desired && this.spawnTimer <= 0) {
      if (this.trySpawn(player)) this.spawnTimer = POLICE_CONFIG.spawnInterval;
    }
  }

  private trySpawn(player: Vector3): boolean {
    for (let attempt = 0; attempt < 12; attempt++) {
      const node = this.network.nodes[rand(this.network.nodes.length)];
      const dx = node.x - player.x;
      const dz = node.z - player.z;
      const d2 = dx * dx + dz * dz;
      const minD2 = POLICE_CONFIG.minSpawnDist * POLICE_CONFIG.minSpawnDist;
      const maxD2 = POLICE_CONFIG.maxSpawnDist * POLICE_CONFIG.maxSpawnDist;
      if (d2 < minD2 || d2 > maxD2) continue;
      if (this.vehicleBlocked(node.x, node.z)) continue;
      const yaw = yawTo(player.x, player.z, node.x, node.z);
      const vehicle = this.vehicleManager.spawn("police", new Vector3(node.x, 0, node.z), yaw, "police");
      const targetNode = this.network.getClosestNode(player.x, player.z);
      this.units.push({
        vehicle,
        state: "SPAWN",
        target: targetNode ? { x: targetNode.x, z: targetNode.z } : { x: player.x, z: player.z },
        lastKnown: player.clone(),
        stuckTime: 0,
        stateTimer: 0.4,
      });
      return true;
    }
    return false;
  }

  private vehicleBlocked(x: number, z: number): boolean {
    for (const v of this.vehicleManager.vehicles) {
      const dx = v.position.x - x;
      const dz = v.position.z - z;
      if (dx * dx + dz * dz < 49) return true;
    }
    return false;
  }

  private updateUnit(unit: PoliceUnit, dt: number, player: Vector3): void {
    const v = unit.vehicle;

    if (unit.state === "SPAWN") {
      unit.stateTimer -= dt;
      if (unit.stateTimer <= 0) unit.state = "INTERCEPT";
    }

    const playerHeading = this.getPlayerHeading();
    const speed = this.getPlayerSpeed();
    let predictX = player.x;
    let predictZ = player.z;
    if (playerHeading) {
      const p = Math.min(speed, 18) * POLICE_CONFIG.predictionFactor;
      predictX += playerHeading.x * p;
      predictZ += playerHeading.z * p;
    }

    switch (unit.state) {
      case "SPAWN":
      case "INTERCEPT": {
        const dx = player.x - v.position.x;
        const dz = player.z - v.position.z;
        if (dx * dx + dz * dz < POLICE_CONFIG.chaseDirectRange * POLICE_CONFIG.chaseDirectRange) {
          unit.state = "CHASE";
        } else {
          unit.target = { x: predictX, z: predictZ };
        }
        break;
      }
      case "CHASE": {
        if (!this.seesPlayer(unit, player) && this.wanted.level > 0) {
          unit.state = "SEARCH";
          unit.lastKnown.copyFrom(player);
          unit.stateTimer = 18;
        } else {
          unit.target = { x: predictX, z: predictZ };
        }
        break;
      }
      case "SEARCH": {
        unit.stateTimer -= dt;
        if (unit.stateTimer <= 0 && this.wanted.level > 0) {
          unit.state = "INTERCEPT";
        } else if (this.seesPlayer(unit, player)) {
          unit.state = "CHASE";
        } else {
          const node = this.network.getClosestNode(unit.lastKnown.x, unit.lastKnown.z);
          if (node) {
            const ddx = node.x - v.position.x;
            const ddz = node.z - v.position.z;
            if (ddx * ddx + ddz * ddz < 400 && Math.random() < 0.03) {
              const near = this.network.nodes[rand(this.network.nodes.length)];
              const nx = near.x - unit.lastKnown.x;
              const nz = near.z - unit.lastKnown.z;
              if (nx * nx + nz * nz < 45 * 45) unit.target = { x: near.x, z: near.z };
            }
          }
        }
        break;
      }
      case "DISENGAGE": {
        unit.stateTimer -= dt;
        break;
      }
    }

    const allV = this.getAllVehicles();
    const obstacle = obstacleAhead(
      v,
      allV,
      this.getPlayerDriving() ? player : null,
      POLICE_CONFIG.contactRange * 0.35,
    );

    let throttle = 1;
    if (obstacle) {
      throttle = v.speed > 2 ? 0 : 0.5;
    }
    const brake = Boolean(obstacle) && v.speed > 2;

    if (unit.state === "DISENGAGE" && unit.stateTimer <= 0) {
      this.despawn(this.units.indexOf(unit));
      return;
    }

    if (unit.state === "DISENGAGE") {
      steerVehicle(v, unit.target.x, unit.target.z, dt, 0.5, false);
    } else {
      steerVehicle(v, unit.target.x, unit.target.z, dt, throttle * POLICE_CONFIG.throttleMul, brake);
    }

    if (v.speed < 0.5) {
      unit.stuckTime += dt;
    } else {
      unit.stuckTime = 0;
    }
  }

  private updateLights(): void {
    const on = this.wanted.level > 0;
    const phase = on && Math.floor(this.flash / 0.14) % 2 === 0;
    for (const u of this.units) {
      const lights = u.vehicle.policeLights;
      if (!lights) continue;
      const active = on && u.state !== "DISENGAGE";
      lights.red.setEnabled(active && phase);
      lights.blue.setEnabled(active && !phase);
    }
  }

  private updateSiren(player: Vector3): void {
    const active = this.wanted.level > 0 && this.units.length > 0;
    if (active && !this.sirenOn) {
      this.audio.playSiren();
      this.sirenOn = true;
    } else if (!active && this.sirenOn) {
      this.audio.stopSiren();
      this.sirenOn = false;
    }
    if (active && this.sirenOn) {
      let nearest = Infinity;
      for (const u of this.units) {
        if (u.state === "DISENGAGE") continue;
        const dx = u.vehicle.position.x - player.x;
        const dz = u.vehicle.position.z - player.z;
        nearest = Math.min(nearest, dx * dx + dz * dz);
      }
      const dist = Math.sqrt(nearest);
      const vol = Math.max(0, 1 - dist / 120) * 0.25;
      this.audio.setSirenVolume(vol);
    }
  }

  private despawn(index: number): void {
    const unit = this.units[index];
    this.vehicleManager.remove(unit.vehicle);
    this.units.splice(index, 1);
  }
}
