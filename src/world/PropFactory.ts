import {
  Color3,
  DynamicTexture,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import type { RNG } from "./BuildingFactory";

export interface PropMaterials {
  concrete: StandardMaterial;
  metal: StandardMaterial;
  grass: StandardMaterial;
  lamp: StandardMaterial;
  signCyan: StandardMaterial;
  signMagenta: StandardMaterial;
  signOrange: StandardMaterial;
}

export function createPropMaterials(scene: Scene): PropMaterials {
  const concrete = new StandardMaterial("propConcrete", scene);
  concrete.diffuseColor = new Color3(0.42, 0.42, 0.46);
  const metal = new StandardMaterial("propMetal", scene);
  metal.diffuseColor = new Color3(0.28, 0.28, 0.32);
  metal.specularColor = new Color3(0.3, 0.3, 0.35);
  const grass = new StandardMaterial("propGrass", scene);
  grass.diffuseColor = new Color3(0.22, 0.42, 0.25);
  const lamp = new StandardMaterial("propLamp", scene);
  lamp.diffuseColor = new Color3(0.95, 0.95, 0.98);
  lamp.emissiveColor = new Color3(1, 0.9, 0.65);
  const signCyan = makeSignMaterial(scene, "#29d6ff", "SIGN");
  const signMagenta = makeSignMaterial(scene, "#ff3d9e", "SHOP");
  const signOrange = makeSignMaterial(scene, "#ff9a2a", "HOTEL");
  return { concrete, metal, grass, lamp, signCyan, signMagenta, signOrange };
}

function makeSignMaterial(scene: Scene, color: string, text: string): StandardMaterial {
  const tex = new DynamicTexture(`sign_${color}`, { width: 128, height: 64 }, scene, false);
  const ctx = tex.getContext() as CanvasRenderingContext2D;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 128, 64);
  ctx.fillStyle = "#0a0a14";
  ctx.font = "bold 22px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(text, 64, 40);
  tex.update();
  const mat = new StandardMaterial(`signMat_${color}`, scene);
  mat.emissiveTexture = tex;
  mat.emissiveColor = Color3.White();
  return mat;
}

export function createLamp(scene: Scene, x: number, z: number, m: PropMaterials): void {
  const pole = MeshBuilder.CreateCylinder("lampPole", { height: 4.6, diameter: 0.16 }, scene);
  pole.material = m.metal;
  pole.position = new Vector3(x, 2.3, z);
  pole.isPickable = false;
  const head = MeshBuilder.CreateBox("lampHead", { width: 0.9, height: 0.18, depth: 0.4 }, scene);
  head.material = m.lamp;
  head.position = new Vector3(x + 0.25, 4.7, z);
  head.isPickable = false;
  pole.freezeWorldMatrix();
  head.freezeWorldMatrix();
}

export function createTree(scene: Scene, x: number, z: number, rng: RNG, m: PropMaterials): void {
  const s = 0.8 + rng() * 0.5;
  const trunk = MeshBuilder.CreateCylinder("treeTrunk", { height: 1.2 * s, diameter: 0.25 * s }, scene);
  trunk.material = m.metal;
  trunk.position = new Vector3(x, 0.6 * s, z);
  trunk.isPickable = false;
  const crown = MeshBuilder.CreateSphere("treeCrown", { diameter: 2.0 * s }, scene);
  crown.material = m.grass;
  crown.position = new Vector3(x, 2.0 * s, z);
  crown.isPickable = false;
}

export function createBench(scene: Scene, x: number, z: number, rng: RNG, m: PropMaterials): void {
  const yaw = Math.floor(rng() * 4) * (Math.PI / 2);
  const seat = MeshBuilder.CreateBox("benchSeat", { width: 1.4, height: 0.12, depth: 0.5 }, scene);
  seat.material = m.metal;
  seat.position = new Vector3(x, 0.5, z);
  seat.rotation.y = yaw;
  seat.isPickable = false;
}

export function createDumpster(scene: Scene, x: number, z: number, m: PropMaterials): void {
  const box = MeshBuilder.CreateBox("dumpster", { width: 1.6, height: 1.0, depth: 0.9 }, scene);
  box.material = m.concrete;
  box.position = new Vector3(x, 0.5, z);
  box.checkCollisions = true;
  box.isPickable = false;
  box.freezeWorldMatrix();
}

export function createCone(scene: Scene, x: number, z: number, m: PropMaterials): void {
  const cone = MeshBuilder.CreateCylinder("cone", { height: 0.7, diameterTop: 0.08, diameterBottom: 0.3 }, scene);
  cone.material = m.signOrange;
  cone.position = new Vector3(x, 0.35, z);
  cone.isPickable = false;
  cone.freezeWorldMatrix();
}

export function createBarrier(scene: Scene, x: number, z: number, len: number, yaw: number, m: PropMaterials): void {
  const box = MeshBuilder.CreateBox("barrier", { width: len, height: 0.9, depth: 0.35 }, scene);
  box.material = m.metal;
  box.position = new Vector3(x, 0.45, z);
  box.rotation.y = yaw;
  box.checkCollisions = true;
  box.isPickable = false;
  box.freezeWorldMatrix();
}
