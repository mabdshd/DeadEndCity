import { Color3, Mesh, MeshBuilder, Scene, StandardMaterial, Vector3 } from "@babylonjs/core";

export class MissionMarkers {
  private scene: Scene;
  private meshes: Mesh[] = [];
  private mats: StandardMaterial[] = [];

  constructor(scene: Scene) {
    this.scene = scene;
  }

  create(pos: Vector3, color: string, ground = true): void {
    const mat = new StandardMaterial(`missionMarker_${color}_${this.meshes.length}`, this.scene);
    mat.emissiveColor = Color3.FromHexString(color);
    mat.disableLighting = true;
    this.mats.push(mat);

    if (ground) {
      const cone = MeshBuilder.CreateCylinder(`missionMarker_cone_${this.meshes.length}`, {
        height: 1.6,
        diameterTop: 0.35,
        diameterBottom: 0.95,
      }, this.scene);
      cone.material = mat;
      cone.position = new Vector3(pos.x, 0.95, pos.z);
      cone.isPickable = false;
      this.meshes.push(cone);
    }

    const beacon = MeshBuilder.CreateSphere(`missionMarker_beacon_${this.meshes.length}`, {
      diameter: 0.8,
      segments: 8,
    }, this.scene);
    beacon.material = mat;
    beacon.position = new Vector3(pos.x, ground ? 4.2 : 2.2, pos.z);
    beacon.isPickable = false;
    this.meshes.push(beacon);

    if (ground) {
      const pillar = MeshBuilder.CreateCylinder(`missionMarker_pillar_${this.meshes.length}`, {
        height: 3.2,
        diameterTop: 0.06,
        diameterBottom: 0.06,
      }, this.scene);
      pillar.material = mat;
      pillar.position = new Vector3(pos.x, 3.1, pos.z);
      pillar.isPickable = false;
      this.meshes.push(pillar);
    }
  }

  update(time: number): void {
    const pulse = 1 + Math.sin(time * 4.5) * 0.22;
    for (const m of this.meshes) {
      m.scaling.set(pulse, pulse, pulse);
      m.rotation.y += 0.015;
    }
  }

  hasMarkers(): boolean {
    return this.meshes.length > 0;
  }

  clear(): void {
    for (const m of this.meshes) m.dispose();
    for (const mat of this.mats) mat.dispose();
    this.meshes.length = 0;
    this.mats.length = 0;
  }
}
