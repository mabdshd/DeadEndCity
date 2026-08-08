export class WantedHUD {
  private container: HTMLElement;
  private stars: HTMLElement[] = [];
  private lastLevel = -1;
  private lastCooling = false;

  constructor() {
    this.container = document.getElementById("wanted-display") as HTMLElement;
    for (let i = 0; i < 3; i++) {
      const s = document.createElement("span");
      s.className = "wanted-star off";
      s.textContent = "★";
      this.container.appendChild(s);
      this.stars.push(s);
    }
  }

  update(level: number, cooling: boolean): void {
    const changed = level !== this.lastLevel || cooling !== this.lastCooling;
    this.lastLevel = level;
    this.lastCooling = cooling;
    if (!changed) return;
    for (let i = 0; i < 3; i++) {
      const on = i < level;
      this.stars[i].classList.toggle("on", on);
      this.stars[i].classList.toggle("off", !on);
      this.stars[i].classList.toggle("cooling", cooling && on);
    }
    this.container.classList.toggle("hidden", level === 0);
  }
}
