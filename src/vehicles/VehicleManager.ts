import { Scene, Vector3 } from "@babylonjs/core";
import { VEHICLE_DEFS } from "../config/vehicles";
import { createVehicle } from "./VehicleFactory";
import type { Vehicle } from "./Vehicle";

export class VehicleManager {
  readonly vehicles: Vehicle[] = [];

  constructor(private scene: Scene) {}

  spawn(defId: string, pos: Vector3, yaw: number): Vehicle {
    const def = VEHICLE_DEFS[defId];
    const vehicle = createVehicle(this.scene, def, pos, yaw);
    this.vehicles.push(vehicle);
    return vehicle;
  }

  getNearest(x: number, z: number, maxDist: number): Vehicle | null {
    let best: Vehicle | null = null;
    let bestD2 = maxDist * maxDist;
    for (const v of this.vehicles) {
      const dx = v.position.x - x;
      const dz = v.position.z - z;
      const d2 = dx * dx + dz * dz;
      if (d2 < bestD2) {
        bestD2 = d2;
        best = v;
      }
    }
    return best;
  }

  resetNearest(x: number, z: number): void {
    const v = this.getNearest(x, z, 20);
    v?.reset();
  }

  remove(vehicle: Vehicle): void {
    const idx = this.vehicles.indexOf(vehicle);
    if (idx >= 0) this.vehicles.splice(idx, 1);
    vehicle.dispose();
  }

  dispose(): void {
    for (const v of this.vehicles) v.dispose();
    this.vehicles.length = 0;
  }
}
