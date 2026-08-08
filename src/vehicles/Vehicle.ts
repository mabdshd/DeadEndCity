import { Mesh, Vector3 } from "@babylonjs/core";
import type { VehicleDef } from "../config/vehicles";

export interface PoliceLights {
  red: Mesh;
  blue: Mesh;
}

export type VehicleCategory = "civilian" | "police" | "mission";

export class Vehicle {
  readonly id: string;
  readonly body: Mesh;
  readonly def: VehicleDef;
  readonly wheels: Mesh[] = [];
  policeLights: PoliceLights | null = null;
  speed = 0;
  category: VehicleCategory = "civilian";
  stolen = false;
  lastImpactSpeed = 0;
  lastUsedAt = 0;

  private yawVal = 0;
  private throttle = 0;
  private steer = 0;
  private handbrake = false;
  private startPos: Vector3;
  private startYaw = 0;
  private readonly deltaTmp = new Vector3();
  private readonly beforeTmp = new Vector3();

  constructor(body: Mesh, def: VehicleDef, spawn: Vector3, spawnYaw: number, wheels: Mesh[] = []) {
    this.body = body;
    this.def = def;
    this.id = `${def.id}_${body.uniqueId}`;
    this.wheels = wheels;
    this.startPos = spawn.clone();
    this.startYaw = spawnYaw;
    this.body.metadata = { isVehicle: true };
    this.reset();
  }

  get position(): Vector3 {
    return this.body.position;
  }

  get yaw(): number {
    return this.yawVal;
  }

  get heading(): Vector3 {
    return new Vector3(Math.sin(this.yawVal), 0, -Math.cos(this.yawVal));
  }

  get speedKmh(): number {
    return Math.round(Math.abs(this.speed) * 3.6);
  }

  setInput(throttle: number, steer: number, handbrake: boolean): void {
    this.throttle = Math.max(-1, Math.min(1, throttle));
    this.steer = Math.max(-1, Math.min(1, steer));
    this.handbrake = handbrake;
  }

  update(dt: number): void {
    const d = this.def;

    if (this.throttle > 0) {
      this.speed += this.throttle * d.acceleration * dt;
    } else if (this.throttle < 0) {
      if (this.speed > 0.3) {
        this.speed -= d.braking * dt;
        if (this.speed < 0) this.speed = 0;
      } else {
        this.speed += this.throttle * d.acceleration * dt;
      }
    }

    this.speed = Math.max(-d.reverseSpeed, Math.min(d.topSpeed, this.speed));
    this.speed -= this.speed * d.drag * dt;
    if (this.handbrake && Math.abs(this.speed) > 1) {
      this.speed -= Math.sign(this.speed) * 6 * dt;
    }

    const speedFactor = Math.min(1, Math.abs(this.speed) / d.turnAtSpeed);
    const turnRate = (this.handbrake ? d.handbrakeTurn : d.maxTurn) * speedFactor;
    this.yawVal += this.steer * turnRate * dt * Math.sign(this.speed);

    const hx = Math.sin(this.yawVal);
    const hz = -Math.cos(this.yawVal);
    this.deltaTmp.set(hx * this.speed * dt, 0, hz * this.speed * dt);
    this.beforeTmp.copyFrom(this.body.position);
    this.body.moveWithCollisions(this.deltaTmp);
    const moved = this.beforeTmp.subtract(this.body.position).length();
    if (moved < this.deltaTmp.length() - 0.02) {
      this.lastImpactSpeed = Math.abs(this.speed);
      this.speed *= 0.4;
    } else {
      this.lastImpactSpeed = 0;
    }

    this.body.rotation.set(0, this.yawVal, 0);
    this.body.position.y = 0.55;

    for (const wheel of this.wheels) {
      wheel.rotation.x -= (this.speed * dt) / 0.3;
    }
  }

  reset(): void {
    this.body.position.copyFrom(this.startPos);
    this.body.position.y = 0.55;
    this.yawVal = this.startYaw;
    this.body.rotation.set(0, this.yawVal, 0);
    this.speed = 0;
    this.throttle = 0;
    this.steer = 0;
    this.handbrake = false;
  }

  dispose(): void {
    this.body.dispose();
  }
}
