import {
  Color3,
  DynamicTexture,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import { WORLD_CONFIG } from "../config/world";
import { createBuilding, mulberry32, type RNG } from "./BuildingFactory";
import {
  createBarrier,
  createBench,
  createCone,
  createDumpster,
  createLamp,
  createPropMaterials,
  createTree,
} from "./PropFactory";
import { RoadNetwork } from "./RoadNetwork";

export interface CityResult {
  network: RoadNetwork;
  safehousePos: Vector3;
  chopShopPos: Vector3;
  storePos: Vector3;
  policeStationPos: Vector3;
  playerSpawnPos: Vector3;
  markers: Mesh[];
}

type Zone =
  | "industrial"
  | "residential"
  | "downtown"
  | "park"
  | "parking"
  | "landmark"
  | "store"
  | "safehouse";

const ZONES: Zone[][] = [
  ["industrial", "residential", "residential", "store"],
  ["residential", "downtown", "park", "parking"],
  ["residential", "downtown", "downtown", "residential"],
  ["landmark", "safehouse", "residential", "residential"],
];

const ROAD_HALF = WORLD_CONFIG.roadWidth / 2;

export function generateCity(scene: Scene): CityResult {
  const rng = mulberry32(WORLD_CONFIG.seed);
  const network = new RoadNetwork();
  WORLD_CONFIG.roadsX.forEach((x) => network.addRoad("z", x, -WORLD_CONFIG.halfSize, WORLD_CONFIG.halfSize));
  WORLD_CONFIG.roadsZ.forEach((z) => network.addRoad("x", z, -WORLD_CONFIG.halfSize, WORLD_CONFIG.halfSize));
  network.build();

  const props = createPropMaterials(scene);
  const groundMat = createGroundMaterial(scene);
  const roadMat = createRoadMaterial(scene);

  createGround(scene, groundMat);
  createRoads(scene, roadMat);
  createSidewalks(scene, props.concrete);

  const markers: Mesh[] = [];

  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      buildCell(scene, rng, i, j, props, markers);
    }
  }

  createBoundary(scene, props);
  createLamps(scene);
  createIntersectionProps(scene, rng, props);

  const safehousePos = cellCenter(1, 3);
  const chopShopPos = cellCenter(2, 0);
  const storePos = cellCenter(3, 0);
  const policeStationPos = cellCenter(0, 3);

  const safehouseMarker = createMarker(scene, safehousePos, "#59ffa0");
  markers.push(safehouseMarker);
  const chopMarker = createMarker(scene, chopShopPos, "#ffb347");
  markers.push(chopMarker);

  return {
    network,
    safehousePos,
    chopShopPos,
    storePos,
    policeStationPos,
    playerSpawnPos: new Vector3(12, 0, 0),
    markers,
  };
}

function cellBounds(i: number, j: number): { x0: number; x1: number; z0: number; z1: number } {
  const px = WORLD_CONFIG.roadsX;
  const pz = WORLD_CONFIG.roadsZ;
  return {
    x0: px[i] + ROAD_HALF + WORLD_CONFIG.sidewalkWidth,
    x1: px[i + 1] - ROAD_HALF - WORLD_CONFIG.sidewalkWidth,
    z0: pz[j] + ROAD_HALF + WORLD_CONFIG.sidewalkWidth,
    z1: pz[j + 1] - ROAD_HALF - WORLD_CONFIG.sidewalkWidth,
  };
}

function cellCenter(i: number, j: number): Vector3 {
  const b = cellBounds(i, j);
  return new Vector3((b.x0 + b.x1) / 2, 0, (b.z0 + b.z1) / 2);
}

function buildCell(
  scene: Scene,
  rng: RNG,
  i: number,
  j: number,
  props: ReturnType<typeof createPropMaterials>,
  markers: Mesh[],
): void {
  const zone = ZONES[j][i];
  const b = cellBounds(i, j);
  const cx = (b.x0 + b.x1) / 2;
  const cz = (b.z0 + b.z1) / 2;
  const cellW = b.x1 - b.x0;
  const cellD = b.z1 - b.z0;

  if (zone === "park") {
    const fill = MeshBuilder.CreateBox("parkFill", { width: cellW, height: 0.08, depth: cellD }, scene);
    fill.material = props.grass;
    fill.position = new Vector3(cx, -0.02, cz);
    fill.freezeWorldMatrix();
    for (let n = 0; n < 8; n++) {
      createTree(scene, b.x0 + rng() * cellW, b.z0 + rng() * cellD, rng, props);
    }
    for (let n = 0; n < 3; n++) {
      createBench(scene, b.x0 + rng() * cellW, b.z0 + rng() * cellD, rng, props);
    }
    return;
  }

  if (zone === "parking") {
    const fill = MeshBuilder.CreateBox("lotFill", { width: cellW, height: 0.08, depth: cellD }, scene);
    fill.material = props.concrete;
    fill.position = new Vector3(cx, -0.02, cz);
    fill.freezeWorldMatrix();
    for (let n = 0; n < 6; n++) {
      createCone(scene, b.x0 + rng() * cellW, b.z0 + rng() * cellD, props);
    }
    createDumpster(scene, b.x1 - 2, b.z1 - 2, props);
    return;
  }

  const count = zone === "downtown" ? 3 : zone === "landmark" ? 2 : 2;
  const built: { x: number; z: number; w: number; d: number; h: number }[] = [];

  for (let n = 0; n < count; n++) {
    let bx = 0;
    let bz = 0;
    let bw = 0;
    let bd = 0;
    for (let attempt = 0; attempt < 8; attempt++) {
      bw = (zone === "industrial" ? 16 : 12) + rng() * 10;
      bd = (zone === "industrial" ? 16 : 12) + rng() * 10;
      bx = b.x0 + 2 + rng() * Math.max(1, cellW - bw - 4);
      bz = b.z0 + 2 + rng() * Math.max(1, cellD - bd - 4);
      if (built.every((o) => Math.abs(o.x - bx) > (o.w + bw) / 2 + 1 || Math.abs(o.z - bz) > (o.d + bd) / 2 + 1)) {
        break;
      }
    }
    const h = heightForZone(zone, rng);
    createBuilding(scene, `b_${i}_${j}_${n}`, bw, h, bd, bx, bz, mulberry32(WORLD_CONFIG.seed + (i * 16 + j * 4 + n) * 7));
    built.push({ x: bx, z: bz, w: bw, d: bd, h });
  }

  if (zone === "industrial") {
    for (let n = 0; n < 2; n++) {
      createDumpster(scene, b.x0 + rng() * (cellW - 4), b.z0 + rng() * (cellD - 4), props);
    }
  }

  if (zone === "landmark") {
    const pos = new Vector3(b.x0 + cellW * 0.5, 1.6, b.z0 + cellD * 0.35);
    const sign = MeshBuilder.CreateBox("policeSign", { width: 5, height: 1.4, depth: 0.2 }, scene);
    sign.material = props.signCyan;
    sign.position = pos;
    sign.freezeWorldMatrix();
    markers.push(createMarker(scene, cellCenter(i, j), "#5cc8ff"));
  }

  if (zone === "safehouse") {
    const pos = new Vector3(b.x0 + cellW * 0.7, 1.5, b.z0 + cellD * 0.35);
    const sign = MeshBuilder.CreateBox("safeSign", { width: 4, height: 1.2, depth: 0.2 }, scene);
    sign.material = props.signMagenta;
    sign.position = pos;
    sign.freezeWorldMatrix();
  }
}

function heightForZone(zone: Zone, rng: RNG): number {
  switch (zone) {
    case "downtown":
      return 18 + rng() * 14;
    case "industrial":
      return 7 + rng() * 5;
    case "landmark":
      return 14 + rng() * 6;
    default:
      return WORLD_CONFIG.minBuildingHeight + rng() * 8;
  }
}

function createGround(scene: Scene, mat: StandardMaterial): void {
  const size = WORLD_CONFIG.halfSize * 2 + 60;
  const ground = MeshBuilder.CreateBox("ground", { width: size, height: 1.0, depth: size }, scene);
  ground.material = mat;
  ground.position = new Vector3(0, -0.55, 0);
  ground.checkCollisions = true;
  ground.freezeWorldMatrix();
}

function createRoads(scene: Scene, mat: StandardMaterial): void {
  const half = WORLD_CONFIG.halfSize;
  for (const z of WORLD_CONFIG.roadsZ) {
    const road = MeshBuilder.CreateBox(`roadX_${z}`, { width: half * 2, height: 0.08, depth: WORLD_CONFIG.roadWidth }, scene);
    road.material = mat;
    road.position = new Vector3(0, -0.04, z);
    road.isPickable = false;
    road.freezeWorldMatrix();
  }
  for (const x of WORLD_CONFIG.roadsX) {
    const road = MeshBuilder.CreateBox(`roadZ_${x}`, { width: WORLD_CONFIG.roadWidth, height: 0.08, depth: half * 2 }, scene);
    road.material = mat;
    road.position = new Vector3(x, -0.04, 0);
    road.isPickable = false;
    road.freezeWorldMatrix();
  }
}

function createSidewalks(scene: Scene, mat: StandardMaterial): void {
  const half = WORLD_CONFIG.halfSize;
  const sw = WORLD_CONFIG.sidewalkWidth;
  for (const z of WORLD_CONFIG.roadsZ) {
    for (const side of [-1, 1]) {
      const cz = z + side * (ROAD_HALF + sw / 2);
      const walk = MeshBuilder.CreateBox(`walkX_${z}_${side}`, { width: half * 2, height: 0.1, depth: sw }, scene);
      walk.material = mat;
      walk.position = new Vector3(0, -0.02, cz);
      walk.isPickable = false;
      walk.freezeWorldMatrix();
    }
  }
  for (const x of WORLD_CONFIG.roadsX) {
    for (const side of [-1, 1]) {
      const cx = x + side * (ROAD_HALF + sw / 2);
      const walk = MeshBuilder.CreateBox(`walkZ_${x}_${side}`, { width: sw, height: 0.1, depth: half * 2 }, scene);
      walk.material = mat;
      walk.position = new Vector3(cx, -0.02, 0);
      walk.isPickable = false;
      walk.freezeWorldMatrix();
    }
  }
}

function createBoundary(scene: Scene, props: ReturnType<typeof createPropMaterials>): void {
  const half = WORLD_CONFIG.halfSize;
  const len = half * 2 + 10;
  const wallH = 8;
  const buildWall = (x: number, z: number, w: number, d: number): void => {
    const wall = MeshBuilder.CreateBox("wall", { width: w, height: wallH, depth: d }, scene);
    wall.material = props.metal;
    wall.position = new Vector3(x, wallH / 2, z);
    wall.checkCollisions = true;
    wall.freezeWorldMatrix();
  };
  buildWall(0, -half - 2, len, 1.5);
  buildWall(0, half + 2, len, 1.5);
  buildWall(-half - 2, 0, 1.5, len);
  buildWall(half + 2, 0, 1.5, len);

  for (const [bx, bz] of [
    [-half, -half],
    [half, -half],
    [-half, half],
    [half, half],
  ] as const) {
    createBarrier(scene, bx, bz, 6, 0, props);
  }
}

function createLamps(scene: Scene): void {
  const props = createPropMaterials(scene);
  const seen = new Set<string>();
  for (const z of [-70, 0, 70]) {
    for (const x of [-70, 0, 70]) {
      for (const [dx, dz] of [
        [8, 8],
        [-8, 8],
        [8, -8],
        [-8, -8],
      ] as const) {
        const lx = x + dx;
        const lz = z + dz;
        const key = `${Math.round(lx)},${Math.round(lz)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        createLamp(scene, lx, lz, props);
      }
    }
  }
}

function createIntersectionProps(scene: Scene, rng: RNG, props: ReturnType<typeof createPropMaterials>): void {
  for (const [x, z] of [
    [-70, -70],
    [70, 70],
    [70, -70],
    [-70, 70],
  ] as const) {
    createCone(scene, x + 3, z + 3, props);
    createCone(scene, x - 3, z - 3, props);
  }
}

function createMarker(scene: Scene, pos: Vector3, color: string): Mesh {
  const mat = new StandardMaterial(`marker_${color}`, scene);
  mat.emissiveColor = Color3.FromHexString(color);
  const mesh = MeshBuilder.CreateCylinder(`marker_${color}_${pos.x}_${pos.z}`, {
    height: 1.4,
    diameterTop: 0.5,
    diameterBottom: 0.9,
  }, scene);
  mesh.material = mat;
  mesh.position = new Vector3(pos.x, 1.0, pos.z);
  mesh.isPickable = false;
  return mesh;
}

function createGroundMaterial(scene: Scene): StandardMaterial {
  const mat = new StandardMaterial("groundMat", scene);
  mat.diffuseColor = new Color3(0.13, 0.14, 0.17);
  return mat;
}

function createRoadMaterial(scene: Scene): StandardMaterial {
  const tex = new DynamicTexture("roadTex", { width: 256, height: 256 }, scene, false);
  const ctx = tex.getContext() as CanvasRenderingContext2D;
  ctx.fillStyle = "#2b2d33";
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = "#b9b6a8";
  ctx.fillRect(0, 124, 256, 8);
  for (let x = 8; x < 256; x += 32) {
    ctx.fillRect(x, 48, 18, 4);
    ctx.fillRect(x, 204, 18, 4);
  }
  tex.update();
  const mat = new StandardMaterial("roadMat", scene);
  mat.diffuseTexture = tex;
  mat.specularColor = new Color3(0.05, 0.05, 0.06);
  return mat;
}

export { cellCenter };
