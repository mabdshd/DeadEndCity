import { Color3, MeshBuilder, Scene, StandardMaterial, Vector3 } from "@babylonjs/core";
import { PEDESTRIAN_CONFIG } from "../config/gameplay";
import { WORLD_CONFIG } from "../config/world";
import type { RoadNetwork } from "../world/RoadNetwork";
import { Pedestrian, type PedMats } from "./Pedestrian";

export class PedestrianManager {
  private peds: Pedestrian[] = [];
  private nodes: Vector3[];
  private mats: PedMats;

  constructor(
    private scene: Scene,
    network: RoadNetwork,
    private getPlayerPos: () => Vector3,
    private getPlayerSpeed: () => number,
  ) {
    const offset = WORLD_CONFIG.roadWidth / 2 + WORLD_CONFIG.sidewalkWidth / 2;
    this.nodes = network.getSidewalkNodes(offset, 12);
    this.mats = this.createMats();
    this.refill();
  }

  get activeCount(): number {
    return this.peds.length;
  }

  private createMats(): PedMats {
    const bodies: StandardMaterial[] = [];
    const heads: StandardMaterial[] = [];
    const bodyColors: [number, number, number][] = [
      [0.35, 0.5, 0.7],
      [0.75, 0.45, 0.25],
      [0.4, 0.55, 0.4],
    ];
    for (let i = 0; i < bodyColors.length; i++) {
      const m = new StandardMaterial(`pedBody_${i}`, this.scene);
      m.diffuseColor = new Color3(bodyColors[i][0], bodyColors[i][1], bodyColors[i][2]);
      bodies.push(m);
    }
    const headColors: [number, number, number][] = [
      [0.95, 0.78, 0.62],
      [0.72, 0.56, 0.44],
      [0.55, 0.42, 0.3],
    ];
    for (let i = 0; i < headColors.length; i++) {
      const m = new StandardMaterial(`pedHead_${i}`, this.scene);
      m.diffuseColor = new Color3(headColors[i][0], headColors[i][1], headColors[i][2]);
      heads.push(m);
    }
    return { bodies, heads };
  }

  private refill(): void {
    const player = this.getPlayerPos();
    while (this.peds.length < PEDESTRIAN_CONFIG.cap) {
      const node = this.randomNodeNear(player.x, player.z, 95);
      if (!node) break;
      const ped = new Pedestrian(this.scene, this.mats, node, this.nodes);
      this.peds.push(ped);
    }
  }

  triggerFleeAt(x: number, z: number, radius: number): void {
    const r2 = radius * radius;
    for (const p of this.peds) {
      const dx = p.root.position.x - x;
      const dz = p.root.position.z - z;
      if (dx * dx + dz * dz <= r2) p.triggerFlee(x, z);
    }
  }

  update(dt: number): void {
    const player = this.getPlayerPos();
    const speed = this.getPlayerSpeed();
    const danger = speed > 6.5 ? { x: player.x, z: player.z } : null;
    const despawn2 = PEDESTRIAN_CONFIG.despawnDist * PEDESTRIAN_CONFIG.despawnDist;

    for (let i = this.peds.length - 1; i >= 0; i--) {
      const ped = this.peds[i];
      if (ped.state === "DOWN") {
        ped.update(dt);
        if (ped.timerDone) {
          const node = this.randomNodeNear(player.x, player.z, 95);
          if (node) ped.setPosition(node);
          else this.peds.splice(i, 1);
        }
        continue;
      }
      const dx = ped.root.position.x - player.x;
      const dz = ped.root.position.z - player.z;
      const d2 = dx * dx + dz * dz;
      if (d2 > despawn2) {
        const node = this.randomNodeNear(player.x, player.z, 95);
        if (node) ped.setPosition(node);
        continue;
      }
      if (danger && d2 < PEDESTRIAN_CONFIG.fleeDist * PEDESTRIAN_CONFIG.fleeDist) {
        ped.triggerFlee(danger.x, danger.z);
      }
      ped.update(dt);
    }

    this.refill();
  }

  private randomNodeNear(x: number, z: number, maxDist: number): Vector3 | null {
    if (this.nodes.length === 0) return null;
    const max2 = maxDist * maxDist;
    for (let attempt = 0; attempt < 12; attempt++) {
      const n = this.nodes[Math.floor(Math.random() * this.nodes.length)];
      const dx = n.x - x;
      const dz = n.z - z;
      if (dx * dx + dz * dz <= max2) return n;
    }
    return this.nodes[Math.floor(Math.random() * this.nodes.length)].clone();
  }
}
