export type CrimeType =
  | "vehicle_theft"
  | "robbery"
  | "weapon_fire"
  | "assault_police"
  | "mission_alert";

export type WantedLevel = 0 | 1 | 2 | 3;

type EventMap = {
  "vehicle:entered": { vehicleId: string };
  "vehicle:exited": { vehicleId: string };
  "mode:changed": { mode: "on_foot" | "in_vehicle" };
  "crime:committed": { type: CrimeType; x: number; z: number; minWanted: WantedLevel };
  "wanted:changed": { level: WantedLevel };
  "wanted:escaped": Record<string, never>;
};

type Handler<K extends keyof EventMap> = (payload: EventMap[K]) => void;

export class EventBus {
  private handlers: { [K in keyof EventMap]?: Set<Handler<K>> } = {};

  on<K extends keyof EventMap>(event: K, fn: Handler<K>): void {
    let set = this.handlers[event] as Set<Handler<K>> | undefined;
    if (!set) {
      set = new Set<Handler<K>>();
      (this.handlers as Record<string, Set<Handler<K>>>)[event as string] = set;
    }
    set.add(fn);
  }

  off<K extends keyof EventMap>(event: K, fn: Handler<K>): void {
    this.handlers[event]?.delete(fn);
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    this.handlers[event]?.forEach((fn) => fn(payload));
  }
}
