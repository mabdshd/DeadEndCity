import { Scene, Vector3 } from "@babylonjs/core";
import { TRAFFIC_CONFIG } from "../config/gameplay";
import { TRAFFIC_DEF_IDS } from "../config/vehicles";
import type { EventBus } from "../game/EventBus";
import type { RoadNetwork } from "../world/RoadNetwork";
import type { Vehicle } from "./Vehicle";
import type { VehicleManager } from "./VehicleManager";
import { obstacleAhead, steerVehicle } from "./AIUtil";

interface TrafficUnit {
  vehicle: Vehicle;
  route: number[];
  nextIndex: number;
  speed: number;
  stuckTime: number;
  reverseUntil: number;
  reversing: boolean;
}

function rngInt(n: number): number {
  return Math.floor(Math.random() * n);
}

export class TrafficSystem {
  private units: TrafficUnit[] = [];
  private routes: number[][] = [];
  private spawnCooldown = 0;
  private readonly tmp = new Vector3();

  constructor(
    private scene: Scene,
    private network: RoadNetwork,
    private vehicleManager: VehicleManager,
    private events: EventBus,
    private getPlayerPos: () => Vector3,
    private getPlayerDriving: () => boolean,
  ) {
    this.routes = network.getBlockRoutes();
    this.events.on("vehicle:entered", ({ vehicleId }) => this.onVehicleEntered(vehicleId));
  }

  get activeCount(): number {
    return this.units.length;
  }

  private onVehicleEntered(vehicleId: string): void {
    for (let i = this.units.length - 1; i >= 0; i--) {
      if (this.units[i].vehicle.id === vehicleId) {
        this.units.splice(i, 1);
        return;
      }
    }
  }

  update(dt: number): void {
    this.spawnCooldown -= dt;
    const player = this.getPlayerPos();

    for (let i = this.units.length - 1; i >= 0; i--) {
      const unit = this.units[i];
      if (this.shouldDespawn(unit, player) || unit.stuckTime > TRAFFIC_CONFIG.stuckDespawnTime) {
        this.vehicleManager.remove(unit.vehicle);
        this.units.splice(i, 1);
        continue;
      }
      this.updateUnit(unit, dt, player);
    }

    if (this.units.length < TRAFFIC_CONFIG.cap && this.spawnCooldown <= 0) {
      if (this.trySpawn(player)) this.spawnCooldown = 1.5;
    }
  }

  private shouldDespawn(unit: TrafficUnit, player: Vector3): boolean {
    const dx = unit.vehicle.position.x - player.x;
    const dz = unit.vehicle.position.z - player.z;
    return dx * dx + dz * dz > TRAFFIC_CONFIG.despawnDist * TRAFFIC_CONFIG.despawnDist;
  }

  private laneTarget(node: { x: number; z: number }, fromX: number, fromZ: number, out: Vector3): Vector3 {
    let dx = node.x - fromX;
    let dz = node.z - fromZ;
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len < 0.001) {
      dx = 0;
      dz = -1;
    } else {
      dx /= len;
      dz /= len;
    }
    const lane = 2.2;
    out.set(node.x + -dz * lane, 0, node.z + dx * lane);
    return out;
  }

  private updateUnit(unit: TrafficUnit, dt: number, player: Vector3): void {
    const v = unit.vehicle;
    const node = this.network.getNode(unit.route[unit.nextIndex]);
    const target = this.laneTarget(node, v.position.x, v.position.z, this.tmp);
    const dx = target.x - v.position.x;
    const dz = target.z - v.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < TRAFFIC_CONFIG.nodeReachDist) {
      unit.nextIndex = (unit.nextIndex + 1) % unit.route.length;
    }

    const obstacle = obstacleAhead(v, this.trafficVehicles(), this.getPlayerDriving() ? player : null, TRAFFIC_CONFIG.obstacleDist);

    const targetSpeed = v.def.topSpeed * TRAFFIC_CONFIG.speedMul;
    let throttle = 1;
    if (obstacle) {
      throttle = v.speed > 2 ? 0 : 0.4;
    } else if (dist < 10) {
      const desired = Math.max(0, (dist / 10) * targetSpeed);
      throttle = desired > v.speed ? 1 : 0;
    }

    if (unit.reversing) {
      unit.reverseUntil -= dt;
      if (unit.reverseUntil <= 0) unit.reversing = false;
      v.setInput(-0.5, 0, false);
      v.update(dt);
    } else {
      steerVehicle(v, target.x, target.z, dt, throttle, Boolean(obstacle) && v.speed > 2);
    }

    if (v.speed < 0.6) {
      unit.stuckTime += dt;
    } else {
      unit.stuckTime = 0;
      unit.speed = v.speed;
    }

    if (!unit.reversing && unit.stuckTime > TRAFFIC_CONFIG.stuckReverseTime) {
      unit.reversing = true;
      unit.reverseUntil = 1.5;
    }
  }

  private trafficVehicles(): Vehicle[] {
    const arr: Vehicle[] = [];
    for (const u of this.units) arr.push(u.vehicle);
    return arr;
  }

  private trySpawn(player: Vector3): boolean {
    if (this.routes.length === 0) return false;
    for (let attempt = 0; attempt < 8; attempt++) {
      const route = this.routes[rngInt(this.routes.length)];
      const idx = rngInt(route.length);
      const node = this.network.getNode(route[idx]);
      if (!this.spawnPointValid(node.x, node.z, player)) continue;
      const next = this.network.getNode(route[(idx + 1) % route.length]);
      const yaw = Math.atan2(next.x - node.x, -(next.z - node.z));
      const hx = Math.sin(yaw);
      const hz = -Math.cos(yaw);
      const lane = 2.2;
      const spawn = new Vector3(node.x + -hz * lane, 0, node.z + hx * lane);
      const defId = TRAFFIC_DEF_IDS[rngInt(TRAFFIC_DEF_IDS.length)];
      const vehicle = this.vehicleManager.spawn(defId, spawn, yaw);
      this.units.push({ vehicle, route, nextIndex: idx, speed: 0, stuckTime: 0, reverseUntil: 0, reversing: false });
      return true;
    }
    return false;
  }

  private spawnPointValid(x: number, z: number, player: Vector3): boolean {
    const dx = x - player.x;
    const dz = z - player.z;
    const d2 = dx * dx + dz * dz;
    const minD2 = TRAFFIC_CONFIG.minSpawnDistFromPlayer * TRAFFIC_CONFIG.minSpawnDistFromPlayer;
    const maxD2 = TRAFFIC_CONFIG.maxSpawnDistFromPlayer * TRAFFIC_CONFIG.maxSpawnDistFromPlayer;
    if (d2 < minD2 || d2 > maxD2) return false;
    for (const u of this.units) {
      const ox = u.vehicle.position.x - x;
      const oz = u.vehicle.position.z - z;
      if (ox * ox + oz * oz < 49) return false;
    }
    return true;
  }
}
