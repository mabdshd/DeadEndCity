import { Vector3 } from "@babylonjs/core";
import { PLAYER_CONFIG } from "../config/gameplay";
import type { InputManager } from "../systems/InputManager";
import type { Player } from "./Player";

function approach(current: number, target: number, maxDelta: number): number {
  if (current < target) return Math.min(current + maxDelta, target);
  return Math.max(current - maxDelta, target);
}

export class PlayerController {
  readonly velocity = new Vector3();
  onGround = false;
  active = true;
  private moveTime = 0;

  constructor(private player: Player) {}

  update(dt: number, input: InputManager, cameraYaw: number): void {
    if (!this.active) return;

    const f = new Vector3(Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
    const r = new Vector3(Math.cos(cameraYaw), 0, Math.sin(cameraYaw));

    const mx = input.getAxis("KeyA", "KeyD");
    const mz = input.getAxis("KeyS", "KeyW");

    const dir = f.scale(mz).add(r.scale(mx));
    const speed = input.isDown("ShiftLeft") || input.isDown("ShiftRight")
      ? PLAYER_CONFIG.sprintSpeed
      : PLAYER_CONFIG.walkSpeed;

    const moving = dir.lengthSquared() > 0.001;
    if (moving) dir.normalize().scaleInPlace(speed);
    if (moving) {
      const targetYaw = Math.atan2(dir.x, -dir.z);
      this.player.root.rotation.y = targetYaw;
      this.moveTime += dt;
    }

    this.velocity.x = approach(this.velocity.x, dir.x, PLAYER_CONFIG.accel * dt);
    this.velocity.z = approach(this.velocity.z, dir.z, PLAYER_CONFIG.accel * dt);

    this.velocity.y -= PLAYER_CONFIG.gravity * dt;
    if (this.velocity.y < -40) this.velocity.y = -40;

    if (input.consumePressed("Space") && this.onGround) {
      this.velocity.y = PLAYER_CONFIG.jumpSpeed;
      this.onGround = false;
    }

    const delta = this.velocity.scale(dt);
    this.player.root.moveWithCollisions(delta);

    if (this.player.root.position.y <= 0.06) {
      this.player.root.position.y = 0;
      this.velocity.y = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }

    this.player.animate(this.moveTime, moving);
  }

  dispose(): void {
    this.active = false;
  }
}
