import { Vector3 } from "@babylonjs/core";

export interface RoadNode {
  id: number;
  x: number;
  z: number;
}

export interface RoadEdge {
  a: number;
  b: number;
}

interface RoadDef {
  axis: "x" | "z";
  pos: number;
  min: number;
  max: number;
}

export class RoadNetwork {
  readonly nodes: RoadNode[] = [];
  readonly edges: RoadEdge[] = [];
  private roads: RoadDef[] = [];
  private sortedAlongX: number[] = [];
  private sortedAlongZ: number[] = [];

  addRoad(axis: "x" | "z", pos: number, min: number, max: number): void {
    this.roads.push({ axis, pos, min, max });
  }

  build(segmentLen = 16): void {
    const alongX = this.roads.filter((r) => r.axis === "x");
    const alongZ = this.roads.filter((r) => r.axis === "z");
    const zPositions = alongX.map((r) => r.pos).sort((a, b) => a - b);
    const xPositions = alongZ.map((r) => r.pos).sort((a, b) => a - b);
    this.sortedAlongX = xPositions;
    this.sortedAlongZ = zPositions;

    const nodeAt = new Map<string, RoadNode>();

    const findOrCreate = (x: number, z: number): RoadNode => {
      const key = `${x},${z}`;
      const existing = nodeAt.get(key);
      if (existing) return existing;
      const node: RoadNode = { id: this.nodes.length, x, z };
      this.nodes.push(node);
      nodeAt.set(key, node);
      return node;
    };

    for (const road of alongX) {
      const sortedZ = zPositions;
      for (const z of sortedZ) findOrCreate(road.pos, z);
    }
    for (const road of alongZ) {
      const sortedX = xPositions;
      for (const x of sortedX) findOrCreate(x, road.pos);
    }

    for (const road of alongX) {
      const intersections = zPositions;
      for (let i = 0; i < intersections.length - 1; i++) {
        const z0 = intersections[i];
        const z1 = intersections[i + 1];
        const midCount = Math.max(1, Math.floor((z1 - z0) / segmentLen) - 1);
        let prev = nodeAt.get(`${road.pos},${z0}`)!;
        for (let m = 1; m <= midCount; m++) {
          const zMid = z0 + ((z1 - z0) * m) / (midCount + 1);
          const node = findOrCreate(road.pos, zMid);
          this.edges.push({ a: prev.id, b: node.id });
          prev = node;
        }
        this.edges.push({ a: prev.id, b: nodeAt.get(`${road.pos},${z1}`)!.id });
      }
    }

    for (const road of alongZ) {
      const intersections = xPositions;
      for (let i = 0; i < intersections.length - 1; i++) {
        const x0 = intersections[i];
        const x1 = intersections[i + 1];
        const midCount = Math.max(1, Math.floor((x1 - x0) / segmentLen) - 1);
        let prev = nodeAt.get(`${x0},${road.pos}`)!;
        for (let m = 1; m <= midCount; m++) {
          const xMid = x0 + ((x1 - x0) * m) / (midCount + 1);
          const node = findOrCreate(xMid, road.pos);
          this.edges.push({ a: prev.id, b: node.id });
          prev = node;
        }
        this.edges.push({ a: prev.id, b: nodeAt.get(`${x1},${road.pos}`)!.id });
      }
    }
  }

  getClosestNode(x: number, z: number): RoadNode | null {
    let best: RoadNode | null = null;
    let bestD2 = Infinity;
    for (const n of this.nodes) {
      const dx = n.x - x;
      const dz = n.z - z;
      const d2 = dx * dx + dz * dz;
      if (d2 < bestD2) {
        bestD2 = d2;
        best = n;
      }
    }
    return best;
  }

  getNode(nid: number): RoadNode {
    return this.nodes[nid];
  }

  getBlockCount(): { bx: number; bz: number } {
    return { bx: Math.max(0, this.sortedAlongZ.length - 1), bz: Math.max(0, this.sortedAlongX.length - 1) };
  }

  getBlockRoutes(): number[][] {
    const { bx, bz } = this.getBlockCount();
    const routes: number[][] = [];
    for (let j = 0; j < bz; j++) {
      for (let i = 0; i < bx; i++) {
        const r = this.getBlockRoute(i, j);
        if (r && r.length > 2) routes.push(r);
      }
    }
    return routes;
  }

  getBlockRoute(i: number, j: number): number[] | null {
    const z0 = this.sortedAlongZ[j];
    const z1 = this.sortedAlongZ[j + 1];
    const x0 = this.sortedAlongX[i];
    const x1 = this.sortedAlongX[i + 1];
    if (z0 === undefined || z1 === undefined || x0 === undefined || x1 === undefined) return null;

    const top = this.lineNodes("x", z0, x0, x1);
    const right = this.lineNodes("z", x1, z0, z1);
    const bottom = this.lineNodes("x", z1, x0, x1);
    const left = this.lineNodes("z", x0, z0, z1);
    if (top.length < 2 || right.length < 2 || bottom.length < 2 || left.length < 2) return null;

    const route: number[] = [...top];
    for (let k = 1; k < right.length; k++) route.push(right[k]);
    for (let k = bottom.length - 2; k >= 0; k--) route.push(bottom[k]);
    for (let k = left.length - 2; k >= 1; k--) route.push(left[k]);
    return route;
  }

  private lineNodes(along: "x" | "z", pos: number, min: number, max: number): number[] {
    const ids: number[] = [];
    for (const n of this.nodes) {
      if (along === "x" ? n.z !== pos : n.x !== pos) continue;
      const c = along === "x" ? n.x : n.z;
      if (c < min - 0.01 || c > max + 0.01) continue;
      ids.push(n.id);
    }
    ids.sort((a, b) => {
      const ca = along === "x" ? this.nodes[a].x : this.nodes[a].z;
      const cb = along === "x" ? this.nodes[b].x : this.nodes[b].z;
      return ca - cb;
    });
    return ids;
  }

  getSidewalkNodes(offset: number, spacing: number): Vector3[] {
    const points: Vector3[] = [];
    const seen = new Set<string>();
    for (const r of this.roads) {
      if (r.axis === "x") {
        for (const side of [-1, 1]) {
          const z = r.pos + side * offset;
          for (let x = r.min + 2; x <= r.max - 2; x += spacing) {
            const key = `${x.toFixed(1)},${z.toFixed(1)}`;
            if (seen.has(key)) continue;
            seen.add(key);
            points.push(new Vector3(x, 0, z));
          }
        }
      } else {
        for (const side of [-1, 1]) {
          const x = r.pos + side * offset;
          for (let z = r.min + 2; z <= r.max - 2; z += spacing) {
            const key = `${x.toFixed(1)},${z.toFixed(1)}`;
            if (seen.has(key)) continue;
            seen.add(key);
            points.push(new Vector3(x, 0, z));
          }
        }
      }
    }
    return points;
  }
}
