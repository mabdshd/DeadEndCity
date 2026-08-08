import { Mesh, Scene } from "@babylonjs/core";
import { generateCity } from "./CityGenerator";
import type { RoadNetwork } from "./RoadNetwork";

export interface Landmarks {
  safehousePos: import("@babylonjs/core").Vector3;
  chopShopPos: import("@babylonjs/core").Vector3;
  storePos: import("@babylonjs/core").Vector3;
  policeStationPos: import("@babylonjs/core").Vector3;
  playerSpawnPos: import("@babylonjs/core").Vector3;
}

export class World {
  readonly network: RoadNetwork;
  readonly landmarks: Landmarks;
  private markers: Mesh[] = [];

  constructor(scene: Scene) {
    const result = generateCity(scene);
    this.network = result.network;
    this.markers = result.markers;
    this.landmarks = {
      safehousePos: result.safehousePos,
      chopShopPos: result.chopShopPos,
      storePos: result.storePos,
      policeStationPos: result.policeStationPos,
      playerSpawnPos: result.playerSpawnPos,
    };
  }

  update(time: number): void {
    const pulse = 1 + Math.sin(time * 3) * 0.18;
    for (const m of this.markers) {
      m.scaling.set(pulse, pulse, pulse);
    }
  }
}
