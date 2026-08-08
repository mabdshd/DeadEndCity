import { Vector3 } from "@babylonjs/core";
import type { Vehicle } from "./Vehicle";

const tmp = new Vector3();

export function yawTo(targetX: number, targetZ: number, fromX: number, fromZ: number): number {
  return Math.atan2(targetX - fromX, -(targetZ - fromZ));
}

export function angleDiff(a: number, b: number): number {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function steerVehicle(
  v: Vehicle,
  targetX: number,
  targetZ: number,
  dt: number,
  throttle: number,
  brake = false,
  steerGain = 3.2,
): void {
  const desired = yawTo(targetX, targetZ, v.position.x, v.position.z);
  const diff = angleDiff(v.yaw, desired);
  const steer = Math.max(-1, Math.min(1, diff * steerGain));
  v.setInput(throttle, steer, brake);
  v.update(dt);
}

export function obstacleAhead(
  v: Vehicle,
  others: readonly Vehicle[],
  playerPos: Vector3 | null,
  range: number,
): Vehicle | null {
  tmp.set(v.position.x, 0, v.position.z);
  const hx = Math.sin(v.yaw);
  const hz = -Math.cos(v.yaw);
  let best: Vehicle | null = null;
  let bestDist = range;
  const consider = (ox: number, oz: number, o: Vehicle): void => {
    const dx = ox - tmp.x;
    const dz = oz - tmp.z;
    const fwd = dx * hx + dz * hz;
    if (fwd <= 0) return;
    if (fwd > bestDist) return;
    const lateral = Math.abs(dx * hz - dz * hx);
    if (lateral > 3.4) return;
    bestDist = fwd;
    best = o;
  };
  for (const o of others) {
    if (o === v) continue;
    consider(o.position.x, o.position.z, o);
  }
  if (playerPos) {
    const px = playerPos.x - tmp.x;
    const pz = playerPos.z - tmp.z;
    const fwd = px * hx + pz * hz;
    if (fwd > 0 && fwd < bestDist) {
      const lateral = Math.abs(px * hz - pz * hx);
      if (lateral <= 3.4) return v;
    }
  }
  return best;
}
