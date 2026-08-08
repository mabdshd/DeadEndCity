import type { EventBus } from "../game/EventBus";

export class HealthHUD {
  private fillEl: HTMLElement;
  private textEl: HTMLElement;

  constructor(private events: EventBus) {
    this.fillEl = document.getElementById("health-fill") as HTMLElement;
    this.textEl = document.getElementById("health-text") as HTMLElement;
    this.events.on("player:damaged", (e) => this.render(e.health));
    this.events.on("player:busted", () => this.render(0));
    this.render(100);
  }

  private render(health: number): void {
    const pct = Math.max(0, Math.min(100, health));
    this.fillEl.style.width = `${pct}%`;
    this.fillEl.style.background = pct > 50 ? "#59ffa0" : pct > 25 ? "#ffd84d" : "#ff4d4d";
    this.textEl.textContent = `${Math.round(pct)}`;
  }
}
