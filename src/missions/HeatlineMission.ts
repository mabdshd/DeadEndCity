import { MISSION_CONFIG } from "../config/gameplay";
import { MISSION_LOCATIONS } from "../config/missions";
import type { MissionContext } from "./Mission";
import { Mission } from "./Mission";

export class HeatlineMission extends Mission {
  private pickedUp = false;

  constructor(ctx: MissionContext) {
    super(ctx, "m3", "HEATLINE");
    this.startPos = MISSION_LOCATIONS.warehouse;
  }

  protected get markerColor(): string {
    return "#ff4d6d";
  }

  protected onActivate(): void {
    this.setObjective("PICK UP THE PACKAGE", MISSION_LOCATIONS.warehouse);
    this.on("wanted:escaped", () => this.onEscaped());
  }

  protected onUpdate(): void {
    if (this.currentStage === 0 && !this.pickedUp) {
      const p = this.ctx.playerPos();
      const w = MISSION_LOCATIONS.warehouse;
      const dx = p.x - w.x;
      const dz = p.z - w.z;
      if (dx * dx + dz * dz <= MISSION_CONFIG.triggerRadius * MISSION_CONFIG.triggerRadius) {
        this.pickedUp = true;
        this.advanceStage();
        const c = this.ctx.playerPos();
        this.ctx.events.emit("crime:committed", {
          type: "mission_alert",
          x: c.x,
          z: c.z,
          minWanted: 3,
        });
        this.ctx.flash("PACKAGE TAKEN! 3 STARS — GET IT ACROSS THE DISTRICT!");
        this.setObjective("GET THE PACKAGE ACROSS DISTRICT 24", MISSION_LOCATIONS.packageDrop);
      }
    }

    if (this.currentStage === 1) {
      const p = this.ctx.playerPos();
      const d = MISSION_LOCATIONS.packageDrop;
      const dx = p.x - d.x;
      const dz = p.z - d.z;
      if (dx * dx + dz * dz <= MISSION_CONFIG.dropOffRadius * MISSION_CONFIG.dropOffRadius) {
        this.advanceStage();
        if (this.ctx.getWantedLevel() === 0) {
          this.onCleared();
        } else {
          this.setObjective("LOSE THE COPS");
        }
      }
    }
  }

  private onEscaped(): void {
    if (this.currentStage !== 2) return;
    this.onCleared();
  }

  private onCleared(): void {
    this.grantReward(MISSION_CONFIG.rewards.m3);
    this.setObjective("DISTRICT CLEARED");
    this.complete();
  }

  protected onReset(): void {
    this.pickedUp = false;
  }
}
