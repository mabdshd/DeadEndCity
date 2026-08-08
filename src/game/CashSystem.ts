import type { EventBus } from "./EventBus";
import type { GameState } from "./GameState";

const BEST_BANKED_KEY = "heatline_best_banked";

export class CashSystem {
  bestBanked: number;

  constructor(
    private events: EventBus,
    private state: GameState,
  ) {
    let saved = 0;
    try {
      saved = Number.parseInt(localStorage.getItem(BEST_BANKED_KEY) ?? "0", 10) || 0;
    } catch {
      saved = 0;
    }
    this.bestBanked = Math.max(0, saved);
  }

  get carriedCash(): number {
    return this.state.carriedCash;
  }

  get bankedCash(): number {
    return this.state.bankedCash;
  }

  addCarriedCash(amount: number): void {
    if (amount === 0) return;
    this.state.carriedCash += amount;
    this.events.emit("cash:carriedChanged", { amount: this.state.carriedCash, delta: amount });
  }

  loseCarriedCash(): number {
    const lost = this.state.carriedCash;
    if (lost !== 0) {
      this.state.carriedCash = 0;
      this.events.emit("cash:carriedChanged", { amount: 0, delta: -lost });
    }
    return lost;
  }

  bankCarriedCash(): number {
    const amount = this.state.carriedCash;
    if (amount <= 0) return 0;
    this.state.carriedCash = 0;
    this.state.bankedCash += amount;
    this.events.emit("cash:carriedChanged", { amount: 0, delta: -amount });
    this.events.emit("cash:banked", { amount });
    if (this.state.bankedCash > this.bestBanked) {
      this.bestBanked = this.state.bankedCash;
      try {
        localStorage.setItem(BEST_BANKED_KEY, String(this.bestBanked));
      } catch {
        // persistence must never block gameplay
      }
    }
    return amount;
  }
}
