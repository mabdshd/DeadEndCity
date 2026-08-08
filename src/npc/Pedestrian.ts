import { Mesh, MeshBuilder, Scene, StandardMaterial, TransformNode, Vector3 } from "@babylonjs/core";
import { PEDESTRIAN_CONFIG } from "../config/gameplay";

export type PedState = "IDLE" | "WANDER" | "FLEE" | "DOWN";

export interface PedMats {
  bodies: StandardMaterial[];
  heads: StandardMaterial[];
}

export class Pedestrian {
  readonly root: Mesh;
  state: PedState = "IDLE";
  private visual: TransformNode;
  private mats: PedMats;
  private timer: number;
  private target: Vector3;
  private nodes: Vector3[];
  private bobT = 0;

  constructor(scene: Scene, mats: PedMats, pos: Vector3, nodes: Vector3[]) {
    this.mats = mats;
    this.nodes = nodes;
    this.target = pos.clone();

    this.root = MeshBuilder.CreateBox("pedRoot", { width: 0.5, height: 1.7, depth: 0.5 }, scene);
    this.root.isVisible = false;
    this.root.isPickable = false;
    this.root.position = pos.clone();

    this.visual = new TransformNode("pedVisual", scene);
    this.visual.parent = this.root;
    const scale = 0.9 + Math.random() * 0.25;
    this.visual.scaling.set(scale, scale, scale);

    const bodyMat = mats.bodies[Math.floor(Math.random() * mats.bodies.length)];
    const headMat = mats.heads[Math.floor(Math.random() * mats.heads.length)];

    const body = MeshBuilder.CreateBox("pedBody", { width: 0.4, height: 0.6, depth: 0.26 }, scene);
    body.parent = this.visual;
    body.position = new Vector3(0, 1.1, 0);
    body.material = bodyMat;
    body.isPickable = false;

    const head = MeshBuilder.CreateBox("pedHead", { width: 0.28, height: 0.28, depth: 0.28 }, scene);
    head.parent = this.visual;
    head.position = new Vector3(0, 1.58, 0);
    head.material = headMat;
    head.isPickable = false;

    const legL = MeshBuilder.CreateBox("pedLegL", { width: 0.13, height: 0.62, depth: 0.15 }, scene);
    legL.parent = this.visual;
    legL.position = new Vector3(-0.12, 0.5, 0);
    legL.material = bodyMat;
    legL.isPickable = false;
    const legR = legL.clone("pedLegR");
    legR.position = new Vector3(0.12, 0.5, 0);
    legR.isPickable = false;

    this.timer = PEDESTRIAN_CONFIG.idleMin + Math.random() * (PEDESTRIAN_CONFIG.idleMax - PEDESTRIAN_CONFIG.idleMin);
  }

  setPosition(pos: Vector3): void {
    this.root.position.copyFrom(pos);
    this.root.position.y = 0;
    this.visual.position.y = 0;
    this.visual.rotation.set(0, Math.random() * Math.PI * 2, 0);
    this.state = "IDLE";
    this.timer = PEDESTRIAN_CONFIG.idleMin + Math.random() * (PEDESTRIAN_CONFIG.idleMax - PEDESTRIAN_CONFIG.idleMin);
  }

  triggerFlee(dangerX: number, dangerZ: number): void {
    if (this.state === "DOWN") return;
    this.state = "FLEE";
    this.timer = PEDESTRIAN_CONFIG.fleeTime;
    let best: Vector3 | null = null;
    let bestScore = -Infinity;
    for (const n of this.nodes) {
      const dx = n.x - this.root.position.x;
      const dz = n.z - this.root.position.z;
      const d2 = dx * dx + dz * dz;
      if (d2 > 45 * 45) continue;
      const dd = Math.hypot(n.x - dangerX, n.z - dangerZ);
      if (dd > bestScore) {
        bestScore = dd;
        best = n;
      }
    }
    this.target = (best ?? new Vector3(this.root.position.x + 8, 0, this.root.position.z)).clone();
  }

  goDown(): void {
    this.state = "DOWN";
    this.timer = 3.5;
    this.visual.rotation.x = -1.45;
    this.visual.position.y = -0.35;
  }

  get timerDone(): boolean {
    return this.timer <= 0;
  }

  update(dt: number): void {
    switch (this.state) {
      case "IDLE":
        this.timer -= dt;
        this.visual.rotation.y += dt * 0.4;
        if (this.timer <= 0) {
          this.pickWanderTarget();
          this.state = "WANDER";
        }
        break;
      case "WANDER":
        if (this.moveToward(dt, PEDESTRIAN_CONFIG.walkSpeed)) {
          this.state = "IDLE";
          this.timer = PEDESTRIAN_CONFIG.idleMin + Math.random() * (PEDESTRIAN_CONFIG.idleMax - PEDESTRIAN_CONFIG.idleMin);
        }
        break;
      case "FLEE":
        this.timer -= dt;
        if (this.moveToward(dt, PEDESTRIAN_CONFIG.runSpeed) || this.timer <= 0) {
          this.state = "WANDER";
        }
        break;
      case "DOWN":
        this.timer -= dt;
        break;
    }
  }

  private pickWanderTarget(): void {
    const px = this.root.position.x;
    const pz = this.root.position.z;
    const range = PEDESTRIAN_CONFIG.wanderRange;
    const range2 = range * range;
    const candidates: Vector3[] = [];
    for (const n of this.nodes) {
      const dx = n.x - px;
      const dz = n.z - pz;
      if (dx * dx + dz * dz <= range2) candidates.push(n);
    }
    if (candidates.length > 0) {
      this.target = candidates[Math.floor(Math.random() * candidates.length)].clone();
    }
  }

  private moveToward(dt: number, speed: number): boolean {
    const dx = this.target.x - this.root.position.x;
    const dz = this.target.z - this.root.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 0.4) return true;
    const step = Math.min(speed * dt, dist);
    const nx = dx / dist;
    const nz = dz / dist;
    this.root.position.x += nx * step;
    this.root.position.z += nz * step;
    this.root.position.y = 0;
    this.visual.position.y = 0;
    this.visual.rotation.x = 0;
    this.visual.rotation.y = Math.atan2(nx, -nz);
    this.bobT += dt * (this.state === "FLEE" ? 16 : 9);
    this.visual.position.y = Math.abs(Math.sin(this.bobT)) * 0.04;
    return false;
  }
}
