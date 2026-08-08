import type { EventBus } from "../game/EventBus";
import type { GameState } from "../game/GameState";

export class CashHUD {
  private bankedEl: HTMLElement;
  private carriedEl: HTMLElement;
  private container: HTMLElement;
  private popupEl: HTMLElement;
  private popupTimer: number | null = null;

  constructor(
    private events: EventBus,
    private state: GameState,
  ) {
    this.container = document.getElementById("cash-display") as HTMLElement;
    this.bankedEl = document.getElementById("cash-banked") as HTMLElement;
    this.carriedEl = document.getElementById("cash-carried") as HTMLElement;
    this.popupEl = document.createElement("div");
    this.popupEl.id = "cash-popup";
    this.popupEl.className = "cash-popup hidden";
    this.container.appendChild(this.popupEl);
    this.events.on("cash:carriedChanged", (e) => this.onCarried(e.delta));
    this.events.on("cash:banked", (e) => this.onBanked(e.amount));
    this.render();
  }

  private onCarried(delta: number): void {
    if (delta > 0) this.showPopup(`+$${delta}`);
    else if (delta < 0 && this.state.carriedCash === 0) this.showPopup("-$" + -delta, true);
    this.render();
  }

  private onBanked(amount: number): void {
    this.showPopup(`BANKED +$${amount}`, false, true);
    this.render();
  }

  private showPopup(text: string, red = false, banked = false): void {
    this.popupEl.textContent = text;
    this.popupEl.classList.toggle("cash-lost", red);
    this.popupEl.classList.toggle("cash-banked", banked);
    this.popupEl.classList.remove("hidden");
    this.popupEl.classList.remove("pop");
    void this.popupEl.offsetWidth;
    this.popupEl.classList.add("pop");
    if (this.popupTimer !== null) window.clearTimeout(this.popupTimer);
    this.popupTimer = window.setTimeout(() => {
      this.popupEl.classList.add("hidden");
    }, 1200);
  }

  private render(): void {
    this.bankedEl.textContent = `BANKED $${this.state.bankedCash}`;
    this.carriedEl.textContent = `CARRIED $${this.state.carriedCash}`;
  }
}
