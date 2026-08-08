import { Color3, Mesh, MeshBuilder, Scene, StandardMaterial, Vector3 } from "@babylonjs/core";
import type { VehicleDef } from "../config/vehicles";
import { Vehicle } from "./Vehicle";

interface BuiltMesh {
  body: Mesh;
  wheels: Mesh[];
  policeLights: import("./Vehicle").PoliceLights | null;
}

function createCarMesh(scene: Scene, def: VehicleDef): BuiltMesh {
  const L = def.length;
  const W = def.width;

  const bodyMat = new StandardMaterial(`${def.id}_bodyMat`, scene);
  bodyMat.diffuseColor = new Color3(def.color[0], def.color[1], def.color[2]);
  bodyMat.specularColor = new Color3(0.3, 0.3, 0.35);

  const glassMat = new StandardMaterial(`${def.id}_glassMat`, scene);
  glassMat.diffuseColor = new Color3(0.12, 0.14, 0.2);
  glassMat.specularColor = new Color3(0.8, 0.9, 1);

  const wheelMat = new StandardMaterial(`${def.id}_wheelMat`, scene);
  wheelMat.diffuseColor = new Color3(0.08, 0.08, 0.09);

  const lightMat = new StandardMaterial(`${def.id}_lightMat`, scene);
  lightMat.diffuseColor = new Color3(1, 0.95, 0.8);
  lightMat.emissiveColor = new Color3(1, 0.92, 0.7);

  const brakeMat = new StandardMaterial(`${def.id}_brakeMat`, scene);
  brakeMat.diffuseColor = new Color3(0.85, 0.08, 0.08);
  brakeMat.emissiveColor = new Color3(0.9, 0.1, 0.1);

  const body = MeshBuilder.CreateBox(`${def.id}_body`, { width: L, height: 0.5, depth: W }, scene);
  body.material = bodyMat;
  body.position = new Vector3(0, -0.05, 0);
  body.checkCollisions = true;
  body.ellipsoid = new Vector3(L / 2, 0.5, W / 2);

  const cabin = MeshBuilder.CreateBox(`${def.id}_cabin`, { width: L * 0.55, height: 0.45, depth: W * 0.92 }, scene);
  cabin.material = glassMat;
  cabin.position = new Vector3(0, 0.4, L * 0.05);
  cabin.parent = body;
  cabin.isPickable = false;

  const wheels: Mesh[] = [];
  for (const [sx, sz] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ] as const) {
    const wheel = MeshBuilder.CreateBox(`${def.id}_wheel_${sx}_${sz}`, { width: 0.22, height: 0.32, depth: 0.5 }, scene);
    wheel.material = wheelMat;
    wheel.position = new Vector3((sx * (W - 0.2)) / 2, -0.4, (sz * (L - 0.5)) / 2);
    wheel.parent = body;
    wheel.isPickable = false;
    wheels.push(wheel);
  }

  for (const sx of [-1, 1]) {
    const head = MeshBuilder.CreateBox(`${def.id}_head_${sx}`, { width: 0.5, height: 0.16, depth: 0.1 }, scene);
    head.material = lightMat;
    head.position = new Vector3((sx * (W - 0.4)) / 2, -0.02, -L / 2);
    head.parent = body;
    head.isPickable = false;
  }

  for (const sx of [-1, 1]) {
    const brake = MeshBuilder.CreateBox(`${def.id}_brake_${sx}`, { width: 0.42, height: 0.14, depth: 0.08 }, scene);
    brake.material = brakeMat;
    brake.position = new Vector3((sx * (W - 0.5)) / 2, -0.02, L / 2);
    brake.parent = body;
    brake.isPickable = false;
  }

  const rearBar = MeshBuilder.CreateBox(`${def.id}_rear`, { width: W * 0.9, height: 0.18, depth: 0.1 }, scene);
  rearBar.material = brakeMat;
  rearBar.position = new Vector3(0, 0.12, L / 2);
  rearBar.parent = body;
  rearBar.isPickable = false;

  let policeLights: import("./Vehicle").PoliceLights | null = null;
  if (def.id === "police") {
    const barRed = new StandardMaterial(`${def.id}_barRed`, scene);
    barRed.emissiveColor = new Color3(1, 0.08, 0.12);
    const barBlue = new StandardMaterial(`${def.id}_barBlue`, scene);
    barBlue.emissiveColor = new Color3(0.08, 0.25, 1);
    const barBase = MeshBuilder.CreateBox(`${def.id}_barBase`, { width: 0.7, height: 0.14, depth: 1.6 }, scene);
    barBase.material = wheelMat;
    barBase.position = new Vector3(0, 0.72, 0);
    barBase.parent = body;
    barBase.isPickable = false;

    const red = MeshBuilder.CreateBox(`${def.id}_barRed`, { width: 0.62, height: 0.1, depth: 0.8 }, scene);
    red.material = barRed;
    red.position = new Vector3(-0.18, 0.78, 0);
    red.parent = body;
    red.isPickable = false;
    const blue = MeshBuilder.CreateBox(`${def.id}_barBlue`, { width: 0.62, height: 0.1, depth: 0.8 }, scene);
    blue.material = barBlue;
    blue.position = new Vector3(0.18, 0.78, 0);
    blue.parent = body;
    blue.isPickable = false;
    policeLights = { red, blue };
  }

  return { body, wheels, policeLights };
}

export function createVehicle(
  scene: Scene,
  def: VehicleDef,
  spawn: Vector3,
  spawnYaw: number,
): Vehicle {
  const built = createCarMesh(scene, def);
  const vehicle = new Vehicle(built.body, def, spawn, spawnYaw, built.wheels);
  vehicle.policeLights = built.policeLights;
  return vehicle;
}
