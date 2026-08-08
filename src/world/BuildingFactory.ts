import {
  Color3,
  DynamicTexture,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";

export type RNG = () => number;

export function mulberry32(seed: number): RNG {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

interface FacadePalette {
  base: string;
  dark: string;
  windowLit: string;
  windowDark: string;
}

const PALETTES: FacadePalette[] = [
  { base: "#3a3f52", dark: "#2a2e3e", windowLit: "#ffd98a", windowDark: "#141824" },
  { base: "#543b3b", dark: "#3f2c2c", windowLit: "#ffc98a", windowDark: "#181018" },
  { base: "#3f4a3a", dark: "#2f382c", windowLit: "#bfffb0", windowDark: "#101a12" },
  { base: "#4a4a55", dark: "#373741", windowLit: "#ffb08a", windowDark: "#161622" },
  { base: "#5a3f55", dark: "#432f40", windowLit: "#ffd0e8", windowDark: "#1a0f1e" },
];

function drawFacade(ctx: CanvasRenderingContext2D, size: number, p: FacadePalette, rng: RNG): void {
  ctx.fillStyle = p.base;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = p.dark;
  ctx.fillRect(0, 0, size, 10);
  const cols = 8;
  const rows = 12;
  const pad = 6;
  const cw = (size - pad * 2) / cols;
  const ch = (size - pad * 2) / rows;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const lit = rng() < 0.55;
      ctx.fillStyle = lit ? p.windowLit : p.windowDark;
      const x = pad + j * cw + cw * 0.25;
      const y = pad + i * ch + ch * 0.3;
      ctx.fillRect(x, y, cw * 0.5, ch * 0.4);
    }
  }
  ctx.fillStyle = p.dark;
  ctx.fillRect(0, size - 12, size, 12);
}

export function createBuilding(
  scene: Scene,
  name: string,
  w: number,
  h: number,
  d: number,
  x: number,
  z: number,
  rng: RNG,
): Mesh {
  const size = 256;
  const palette = PALETTES[Math.floor(rng() * PALETTES.length)];
  const tex = new DynamicTexture(`${name}_tex`, { width: size, height: size }, scene, false);
  const ctx = tex.getContext() as CanvasRenderingContext2D;
  drawFacade(ctx, size, palette, rng);
  tex.update();

  const mat = new StandardMaterial(`${name}_mat`, scene);
  mat.diffuseTexture = tex;
  mat.emissiveTexture = tex;
  mat.emissiveColor = Color3.White();

  const mesh = MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, scene);
  mesh.material = mat;
  mesh.position = new Vector3(x, h / 2, z);
  mesh.checkCollisions = true;
  mesh.freezeWorldMatrix();

  return mesh;
}
