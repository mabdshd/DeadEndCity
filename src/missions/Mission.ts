import { Vector3 } from "@babylonjs/core";
import { MISSION_CONFIG } from "../config/gameplay";
import type { EventBus, EventMap, WantedLevel } from "../game/EventBus";
import type { CashSystem } from "../game/CashSystem";
import type { VehicleManager } from "../vehicles/VehicleManager";
import type { Vehicle } from "../vehicles/Vehicle";
import type { Landmarks } from "../world/World";
import { MissionMarkers } from "./MissionMarkers";

const START_RADIUS = MISSION_CONFIG.startRadius;

export type MissionState = "locked" | "available" | "active" | "completed" | "failed";

export interface MissionContext {
  events: EventBus;
  cash: CashSystem;
  vehicleManager: VehicleManager;
  scene: import("@babylonjs/core").Scene;
  landmarks: Landmarks;
  flash(text: string, ms?: number): void;
  alarm(): void;
  playerPos(): Vector3;
  isInVehicle(): boolean;
  currentVehicleId(): string | null;
  getVehicle(id: string): Vehicle | null;
  getWantedLevel(): WantedLevel;
}

type EventKey = keyof EventMap;

export abstract class Mission {
  readonly id: string;
  title: string;
  state: MissionState = "locked";
  currentStage = 0;
  objective = "";
  objectivePos: Vector3 | null = null;

  protected markers: MissionMarkers;
  protected rewardGranted = false;
  protected startPos: Vector3 | null = null;
  private handlers: Array<{ event: EventKey; fn: (p: any) => void }> = [];

  constructor(
    protected ctx: MissionContext,
    id: string,
    title: string,
  ) {
    this.id = id;
    this.title = title;
    this.markers = new MissionMarkers(ctx.scene);
  }

  on<K extends EventKey>(event: K, fn: (payload: EventMap[K]) => void): void {
    this.ctx.events.on(event, fn);
    this.handlers.push({ event, fn: fn as (p: any) => void });
  }

  protected setObjective(text: string, pos?: Vector3): void {
    this.objective = text;
    this.objectivePos = pos ?? null;
    this.markers.clear();
    if (pos) this.markers.create(pos, this.markerColor);
    this.ctx.events.emit("mission:objectiveChanged", {
      missionId: this.id,
      text,
      pos: pos ? { x: pos.x, z: pos.z } : null,
    });
  }

  protected abstract get markerColor(): string;

  protected abstract onActivate(): void;

  protected onUpdate(dt: number, time: number): void {}

  protected onReset(): void {}

  activate(): void {
    this.state = "active";
    this.onActivate();
    this.ctx.events.emit("mission:started", {
      missionId: this.id,
      title: this.title,
      objective: this.objective,
    });
  }

  update(dt: number, time: number): void {
    if (this.state === "available" && this.startPos) {
      if (this.markers.hasMarkers()) {
        this.markers.update(time);
      } else {
        this.markers.create(this.startPos, this.markerColor);
      }
      const p = this.ctx.playerPos();
      const dx = p.x - this.startPos.x;
      const dz = p.z - this.startPos.z;
      if (dx * dx + dz * dz <= START_RADIUS * START_RADIUS) {
        this.activate();
      }
      return;
    }
    if (this.state === "active") {
      this.markers.update(time);
      this.onUpdate(dt, time);
    }
  }

  protected advanceStage(): void {
    this.currentStage++;
  }

  protected grantReward(amount: number): void {
    if (this.rewardGranted) return;
    this.rewardGranted = true;
    this.ctx.cash.addCarriedCash(amount);
  }

  protected complete(): void {
    if (this.state === "completed" || this.state === "failed") return;
    this.state = "completed";
    this.cleanup();
    this.ctx.events.emit("mission:completed", { missionId: this.id });
  }

  fail(): void {
    if (this.state === "completed" || this.state === "failed") return;
    this.state = "failed";
    this.cleanup();
    this.ctx.events.emit("mission:failed", { missionId: this.id });
  }

  get hasStartMarker(): boolean {
    return this.startPos !== null;
  }

  restart(): void {
    if (this.state !== "failed") return;
    this.cleanup();
    this.currentStage = 0;
    this.rewardGranted = false;
    this.objective = "";
    this.objectivePos = null;
    this.onReset();
    this.state = "available";
  }

  dispose(): void {
    this.cleanup();
  }

  private cleanup(): void {
    for (const h of this.handlers) {
      this.ctx.events.off(h.event as EventKey, h.fn as any);
    }
    this.handlers.length = 0;
    this.markers.clear();
  }
}
