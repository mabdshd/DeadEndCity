import { WANTED_CONFIG } from "../config/gameplay";
import type { EventBus, CrimeType, WantedLevel } from "../game/EventBus";
import type { GameState } from "../game/GameState";

export class WantedSystem {
  level: WantedLevel = 0;
  contact = false;
  escapeActive = false;

  private cooldown = 0;
  private policeDispatched = false;

  constructor(
    private events: EventBus,
    private state: GameState,
  ) {
    this.events.on("crime:committed", (crime) => this.onCrime(crime));
  }

  onCrime(crime: { type: CrimeType; minWanted: WantedLevel }): void {
    const violent = crime.type === "assault_police" || crime.type === "weapon_fire";
    let target = Math.max(this.level, crime.minWanted);
    if (violent && this.level > 0) target = Math.min(3, this.level + 1);
    if (target > this.level) {
      this.setLevel(target as WantedLevel);
    }
    if (this.level > 0) {
      this.policeDispatched = true;
      this.cooldown = 0;
    }
  }

  setPoliceContact(hasContact: boolean): void {
    this.contact = hasContact;
  }

  forceLevel(n: WantedLevel): void {
    this.setLevel(n);
    if (n > 0) {
      this.policeDispatched = true;
      this.cooldown = 0;
    }
  }

  update(dt: number): void {
    if (this.level === 0) return;
    if (this.contact) {
      this.cooldown = 0;
      this.escapeActive = false;
      return;
    }
    if (!this.policeDispatched) return;
    this.escapeActive = true;
    this.cooldown += dt;
    if (this.cooldown >= WANTED_CONFIG.escapeTimes[this.level]) {
      this.setLevel(0);
    }
  }

  private setLevel(n: WantedLevel): void {
    this.level = n;
    this.state.wantedLevel = n;
    if (n === 0) {
      this.escapeActive = false;
      this.contact = false;
      this.policeDispatched = false;
      this.cooldown = 0;
      this.events.emit("wanted:changed", { level: 0 });
      this.events.emit("wanted:escaped", {});
    } else {
      this.events.emit("wanted:changed", { level: n });
    }
  }
}
