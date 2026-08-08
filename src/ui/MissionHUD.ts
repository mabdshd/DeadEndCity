import { Vector3 } from "@babylonjs/core";
import type { Mission } from "../missions/Mission";

export class MissionHUD {
  private objectiveEl: HTMLElement;
  private objectiveTextEl: HTMLElement;
  private distanceEl: HTMLElement;
  private feedbackEl: HTMLElement;
  private feedbackTimer: number | null = null;
  private lastText = "";
  private lastDist = -1;

  constructor() {
    this.objectiveEl = document.getElementById("objective-display") as HTMLElement;
    this.objectiveTextEl = document.getElementById("objective-text") as HTMLElement;
    this.distanceEl = document.getElementById("objective-distance") as HTMLElement;
    this.feedbackEl = document.getElementById("feedback-flash") as HTMLElement;
  }

  update(active: Mission | null, playerPos: Vector3): void {
    if (!active || active.state !== "active" || !active.objective) {
      if (this.lastText !== "") {
        this.lastText = "";
        this.lastDist = -1;
        this.objectiveEl.classList.add("hidden");
      }
      return;
    }
    this.objectiveEl.classList.remove("hidden");
    if (active.objective !== this.lastText) {
      this.lastText = active.objective;
      this.objectiveTextEl.textContent = active.objective;
    }
    if (active.objectivePos) {
      const dx = playerPos.x - active.objectivePos.x;
      const dz = playerPos.z - active.objectivePos.z;
      const dist = Math.round(Math.hypot(dx, dz));
      if (dist !== this.lastDist) {
        this.lastDist = dist;
        this.distanceEl.textContent = `${dist} M`;
      }
      this.distanceEl.classList.remove("hidden");
    } else {
      this.distanceEl.classList.add("hidden");
      this.lastDist = -1;
    }
  }

  flash(text: string, ms = 2600): void {
    this.feedbackEl.textContent = text;
    this.feedbackEl.classList.remove("hidden");
    if (this.feedbackTimer !== null) window.clearTimeout(this.feedbackTimer);
    this.feedbackTimer = window.setTimeout(() => {
      this.feedbackEl.classList.add("hidden");
    }, ms);
  }
}
