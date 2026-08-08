import type { InputManager } from "../systems/InputManager";
import type { Vehicle } from "./Vehicle";

export class VehicleController {
  active = false;
  private vehicle: Vehicle | null = null;

  bind(vehicle: Vehicle): void {
    this.vehicle = vehicle;
    this.active = true;
  }

  unbind(): void {
    this.vehicle = null;
    this.active = false;
  }

  getVehicle(): Vehicle | null {
    return this.vehicle;
  }

  update(dt: number, input: InputManager): void {
    if (!this.active || !this.vehicle) return;
    const throttle = input.getAxis("KeyS", "KeyW");
    const steer = input.getAxis("KeyA", "KeyD");
    const handbrake = input.isDown("Space");
    this.vehicle.setInput(throttle, steer, handbrake);
    this.vehicle.update(dt);
  }

  resetCurrent(): void {
    this.vehicle?.reset();
  }
}
