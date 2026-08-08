import type { MissionContext, Mission } from "./Mission";

export class MissionManager {
  readonly missions: Mission[];
  private active: Mission | null = null;
  private order: string[];

  constructor(
    private ctx: MissionContext,
    missions: Mission[],
    order: string[],
  ) {
    this.missions = missions;
    this.order = order;
    missions.forEach((m, i) => {
      m.state = i === 0 ? "available" : "locked";
    });
    this.ctx.events.on("mission:completed", (e) => this.onCompleted(e.missionId));
    this.ctx.events.on("mission:failed", (e) => this.onFailed(e.missionId));
  }

  get activeMission(): Mission | null {
    return this.active;
  }

  getMission(id: string): Mission | null {
    return this.missions.find((m) => m.id === id) ?? null;
  }

  start(): void {
    const first = this.missions.find((m) => m.id === this.order[0]);
    if (first && first.state === "available") {
      this.active = first;
      first.activate();
    }
  }

  update(dt: number, time: number): void {
    let active: Mission | null = null;
    for (const m of this.missions) {
      if (m.state === "available") m.update(dt, time);
      else if (m.state === "active") {
        m.update(dt, time);
        active = m;
      }
    }
    this.active = active;
  }

  dispose(): void {
    for (const m of this.missions) m.dispose();
  }

  private onCompleted(id: string): void {
    if (this.active?.id === id) this.active = null;
    const idx = this.order.indexOf(id);
    const next = this.order[idx + 1];
    const m = next ? this.missions.find((x) => x.id === next) : undefined;
    if (m && m.state === "locked") m.state = "available";
  }

  failActive(): void {
    if (this.active && this.active.state === "active") {
      this.active.fail();
    }
  }

  private onFailed(id: string): void {
    if (this.active?.id === id) this.active = null;
    const m = this.missions.find((x) => x.id === id);
    if (!m) return;
    m.restart();
    if (!m.hasStartMarker && m.state === "available") m.activate();
  }
}
