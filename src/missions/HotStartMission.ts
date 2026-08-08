import { MISSION_CONFIG } from "../config/gameplay";
import { MISSION_LOCATIONS } from "../config/missions";
import type { MissionContext } from "./Mission";
import { Mission } from "./Mission";

export class HotStartMission extends Mission {
  private missionVehicleId: string | null = null;

  constructor(ctx: MissionContext) {
    super(ctx, "m1", "HOT START");
  }

  protected get markerColor(): string {
    return "#ffb347";
  }

  protected onActivate(): void {
    const car = this.ctx.vehicleManager.spawn(
      "sport",
      MISSION_LOCATIONS.markedCar,
      MISSION_LOCATIONS.markedCarYaw,
      "mission",
    );
    this.missionVehicleId = car.id;
    this.setObjective("STEAL THE MARKED CAR", MISSION_LOCATIONS.markedCar);

    this.on("vehicle:entered", (e) => this.onVehicleEntered(e.vehicleId));
    this.on("wanted:escaped", () => this.onEscaped());
  }

  private onVehicleEntered(vehicleId: string): void {
    if (this.currentStage !== 0 || vehicleId !== this.missionVehicleId) return;
    this.advanceStage();
    const p = this.ctx.playerPos();
    this.ctx.events.emit("crime:committed", {
      type: "mission_alert",
      x: p.x,
      z: p.z,
      minWanted: 1,
    });
    this.setObjective("LOSE THE COPS");
  }

  private onEscaped(): void {
    if (this.currentStage !== 1) return;
    this.advanceStage();
    this.setObjective("DELIVER THE CAR TO THE CHOP SHOP", this.ctx.landmarks.chopShopPos);
  }

  protected onReset(): void {
    if (this.missionVehicleId) {
      const v = this.ctx.getVehicle(this.missionVehicleId);
      if (v && this.ctx.currentVehicleId() !== this.missionVehicleId) {
        this.ctx.vehicleManager.remove(v);
      }
      this.missionVehicleId = null;
    }
  }

  protected onUpdate(): void {
    if (this.currentStage !== 2) return;
    if (!this.missionVehicleId || this.ctx.currentVehicleId() !== this.missionVehicleId) return;
    const v = this.ctx.getVehicle(this.missionVehicleId);
    if (!v) return;
    const target = this.ctx.landmarks.chopShopPos;
    const dx = v.position.x - target.x;
    const dz = v.position.z - target.z;
    if (dx * dx + dz * dz <= MISSION_CONFIG.dropOffRadius * MISSION_CONFIG.dropOffRadius) {
      this.grantReward(MISSION_CONFIG.rewards.m1);
      this.setObjective("MISSION COMPLETE");
      this.complete();
    }
  }
}
