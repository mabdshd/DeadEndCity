import { MISSION_CONFIG } from "../config/gameplay";
import type { MissionContext } from "./Mission";
import { Mission } from "./Mission";

export class QuickCashMission extends Mission {
  private robTimer = 0;
  private robbing = false;

  constructor(ctx: MissionContext) {
    super(ctx, "m2", "QUICK CASH");
    this.startPos = ctx.landmarks.storePos;
  }

  protected get markerColor(): string {
    return "#ffd84d";
  }

  protected onActivate(): void {
    this.setObjective("ROB THE STORE", this.startPos ?? undefined);
    this.on("wanted:escaped", () => this.onEscaped());
  }

  protected onUpdate(dt: number): void {
    if (this.currentStage === 0 && !this.robbing) {
      const p = this.ctx.playerPos();
      const s = this.startPos;
      if (!s) return;
      const dx = p.x - s.x;
      const dz = p.z - s.z;
      if (dx * dx + dz * dz <= MISSION_CONFIG.triggerRadius * MISSION_CONFIG.triggerRadius) {
        this.robbing = true;
        this.robTimer = MISSION_CONFIG.robDuration;
        this.ctx.flash("ROBBING THE STORE...");
      }
    }

    if (this.robbing) {
      this.robTimer -= dt;
      if (this.robTimer <= 0) {
        this.robbing = false;
        this.onRobberyComplete();
      }
    }
  }

  private onRobberyComplete(): void {
    this.advanceStage();
    const p = this.ctx.playerPos();
    this.ctx.events.emit("crime:committed", {
      type: "robbery",
      x: p.x,
      z: p.z,
      minWanted: 2,
    });
    this.ctx.alarm();
    this.ctx.flash("ALARM! $1000 CARRIED AT STAKE — ESCAPE!");
    this.setObjective("ESCAPE THE POLICE");
  }

  private onEscaped(): void {
    if (this.currentStage !== 1) return;
    this.advanceStage();
    this.grantReward(MISSION_CONFIG.rewards.m2);
    this.setObjective("BANK THE CASH OR KEEP THE HEAT GOING");
    this.complete();
  }

  protected onReset(): void {
    this.robbing = false;
    this.robTimer = 0;
  }
}
