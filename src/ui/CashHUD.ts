import type { EventBus } from "../game/EventBus";
import type { GameState } from "../game/GameState";

export class CashHUD {
  private bankedEl: HTMLElement;
  private carriedEl: HTMLElement;
  private container: HTMLElement;

  constructor(
    private events: EventBus,
    private state: GameState,
  ) {
    this.container = document.getElementById("cash-display") as HTMLElement;
    this.bankedEl = document.getElementById("cash-banked") as HTMLElement;
    this.carriedEl = document.getElementById("cash-carried") as HTMLElement;
    this.events.on("cash:carriedChanged", () => this.render());
    this.events.on("cash:banked", () => this.render());
    this.render();
  }

  private render(): void {
    this.bankedEl.textContent = `BANKED $${this.state.bankedCash}`;
    this.carriedEl.textContent = `CARRIED $${this.state.carriedCash}`;
  }
}
