import {
  Color3,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import { PLAYER_CONFIG } from "../config/gameplay";

export class Player {
  readonly root: Mesh;
  private visual: TransformNode;
  private bodyMat: StandardMaterial;
  private headMat: StandardMaterial;

  constructor(scene: Scene) {
    this.root = MeshBuilder.CreateBox(
      "playerRoot",
      { width: 0.7, height: PLAYER_CONFIG.height, depth: 0.7 },
      scene,
    );
    this.root.isVisible = false;
    this.root.isPickable = false;
    this.root.checkCollisions = true;
    this.root.ellipsoid = new Vector3(PLAYER_CONFIG.radius, PLAYER_CONFIG.height / 2, PLAYER_CONFIG.radius);
    this.root.ellipsoidOffset = new Vector3(0, PLAYER_CONFIG.height / 2, 0);
    this.root.position = new Vector3(0, 0, 0);

    this.visual = new TransformNode("playerVisual", scene);
    this.visual.parent = this.root;

    this.bodyMat = new StandardMaterial("playerBodyMat", scene);
    this.bodyMat.diffuseColor = new Color3(0.15, 0.55, 0.85);
    this.headMat = new StandardMaterial("playerHeadMat", scene);
    this.headMat.diffuseColor = new Color3(1, 0.78, 0.62);

    const body = MeshBuilder.CreateBox("body", { width: 0.55, height: 0.7, depth: 0.3 }, scene);
    body.parent = this.visual;
    body.position = new Vector3(0, 1.25, 0);
    body.material = this.bodyMat;
    body.isPickable = false;

    const head = MeshBuilder.CreateBox("head", { width: 0.34, height: 0.34, depth: 0.34 }, scene);
    head.parent = this.visual;
    head.position = new Vector3(0, 1.8, 0);
    head.material = this.headMat;
    head.isPickable = false;

    const legL = MeshBuilder.CreateBox("legL", { width: 0.16, height: 0.7, depth: 0.18 }, scene);
    legL.parent = this.visual;
    legL.position = new Vector3(-0.14, 0.55, 0);
    legL.material = this.bodyMat;
    legL.isPickable = false;

    const legR = legL.clone("legR");
    legR.position = new Vector3(0.14, 0.55, 0);
    legR.isPickable = false;

    const armL = MeshBuilder.CreateBox("armL", { width: 0.12, height: 0.6, depth: 0.16 }, scene);
    armL.parent = this.visual;
    armL.position = new Vector3(-0.34, 1.35, 0);
    armL.material = this.bodyMat;
    armL.isPickable = false;

    const armR = armL.clone("armR");
    armR.position = new Vector3(0.34, 1.35, 0);
    armR.isPickable = false;
  }

  get position(): Vector3 {
    return this.root.position;
  }

  setPosition(pos: Vector3): void {
    this.root.position = pos.clone();
  }

  setVisible(v: boolean): void {
    this.visual.setEnabled(v);
  }

  isVisible(): boolean {
    return this.visual.isEnabled();
  }

  animate(t: number, moving: boolean): void {
    if (!this.visual.isEnabled()) return;
    if (moving) {
      const bob = Math.abs(Math.sin(t * 11)) * 0.05;
      this.visual.position.y = bob;
      this.visual.rotation.x = -0.08;
    } else {
      this.visual.position.y = 0;
      this.visual.rotation.x = 0;
    }
  }

  dispose(): void {
    this.bodyMat.dispose();
    this.headMat.dispose();
    this.root.dispose();
  }
}
