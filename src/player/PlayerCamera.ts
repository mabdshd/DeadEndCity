import { Scene, TargetCamera, Vector3 } from "@babylonjs/core";
import { FOOT_CAMERA, VEHICLE_CAMERA } from "../config/gameplay";

function lerpAngle(a: number, b: number, t: number): number {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}

type CamMode = "foot" | "vehicle";

export class PlayerCamera {
  readonly camera: TargetCamera;
  private mode: CamMode = "foot";
  private footYaw = 0;
  private vehicleYaw = 0;
  private lookOffsetYaw = 0;
  pitch = 0.28;
  private vehicleTargetYaw = 0;
  private shake = 0;
  private baseFov = FOOT_CAMERA.fov;
  private speedBoost = 0;

  constructor(scene: Scene) {
    this.camera = new TargetCamera("playerCam", new Vector3(0, 2.2, 6), scene);
    this.camera.fov = FOOT_CAMERA.fov;
    scene.activeCamera = this.camera;
  }

  switchToFoot(): void {
    this.mode = "foot";
    this.lookOffsetYaw = 0;
    this.baseFov = FOOT_CAMERA.fov;
    this.camera.fov = FOOT_CAMERA.fov;
  }

  switchToVehicle(yaw: number): void {
    this.mode = "vehicle";
    this.vehicleYaw = yaw;
    this.vehicleTargetYaw = yaw;
    this.lookOffsetYaw = 0;
    this.baseFov = VEHICLE_CAMERA.fov;
    this.camera.fov = VEHICLE_CAMERA.fov;
  }

  addShake(amount: number): void {
    this.shake = Math.min(0.5, this.shake + amount);
  }

  setSpeedBoost(factor: number): void {
    this.speedBoost = Math.max(0, Math.min(1, factor));
  }

  applyMouse(dx: number, dy: number): void {
    if (this.mode === "foot") {
      this.footYaw += dx * FOOT_CAMERA.sensitivity;
      this.pitch += dy * FOOT_CAMERA.sensitivity;
      this.pitch = Math.max(FOOT_CAMERA.pitchMin, Math.min(FOOT_CAMERA.pitchMax, this.pitch));
    } else {
      this.lookOffsetYaw += dx * VEHICLE_CAMERA.sensitivity;
      this.lookOffsetYaw = Math.max(-VEHICLE_CAMERA.lookOffsetMax, Math.min(VEHICLE_CAMERA.lookOffsetMax, this.lookOffsetYaw));
      this.pitch += dy * VEHICLE_CAMERA.sensitivity;
      this.pitch = Math.max(VEHICLE_CAMERA.pitchMin, Math.min(VEHICLE_CAMERA.pitchMax, this.pitch));
    }
  }

  update(dt: number, targetPos: Vector3): void {
    const cfg = this.mode === "foot" ? FOOT_CAMERA : VEHICLE_CAMERA;

    if (this.mode === "vehicle") {
      this.vehicleYaw = lerpAngle(this.vehicleYaw, this.vehicleTargetYaw, 1 - Math.pow(0.001, dt * VEHICLE_CAMERA.yawFollowSpeed));
    }

    const yaw = (this.mode === "foot" ? this.footYaw : this.vehicleYaw) + this.lookOffsetYaw;
    const cosP = Math.cos(this.pitch);
    const sinP = Math.sin(this.pitch);

    const off = new Vector3(
      Math.sin(yaw) * cfg.distance * cosP,
      cfg.height + sinP * cfg.distance,
      Math.cos(yaw) * cfg.distance * cosP,
    );

    const desired = targetPos.add(off);
    const k = 1 - Math.pow(0.001, dt * cfg.followLerp);
    let pos = Vector3.Lerp(this.camera.position, desired, k);
    if (this.shake > 0.001) {
      const s = this.shake;
      pos = pos.add(new Vector3((Math.random() * 2 - 1) * s, (Math.random() * 2 - 1) * s, 0));
      this.shake = Math.max(0, this.shake - dt * 3);
    }
    this.camera.position = pos;
    this.camera.fov += (this.baseFov + this.speedBoost * 0.14 - this.camera.fov) * Math.min(1, dt * 5);
    this.camera.setTarget(targetPos.add(new Vector3(0, 1.3, 0)));
  }

  setVehicleFollowYaw(yaw: number): void {
    this.vehicleTargetYaw = yaw;
  }

  get yaw(): number {
    return this.mode === "foot" ? this.footYaw : this.vehicleYaw + this.lookOffsetYaw;
  }
}
