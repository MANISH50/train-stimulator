// The landscape along a route, driven by its scene script (src/sim/world/zones.ts): terrain
// relief that rises into hills or drops into river and viaduct valleys, a roof of hillside
// over tunnels, ground colour grading, and seeded dressing (trees, bamboo, palms, crops,
// houses, high-rises, factories). Dressing is precomputed per 500 m chunk and streamed into a
// fixed set of instanced meshes around the camera, so draw calls stay constant.
import * as THREE from 'three';
import type { Track } from '../../sim/track/track';
import type { RouteDef } from '../../sim/types';
import {
  blendAt,
  landmarkAt,
  zoneWeightsAt,
  type Landmark,
  type SceneScript,
  type VegetationKind,
  type ZoneDef,
  type ZoneWeight,
} from '../../sim/world/zones';
import type { QualityPreset } from '../quality';
import { mulberry32 } from '../textures';
import { frameAt, headingAt } from '../trackMesh';

const CHUNK_M = 500;
const COLS = [
  -800, -500, -300, -180, -110, -70, -45, -28, -12, 12, 28, 45, 70, 110, 180, 300, 500, 800,
];
const ROW_M = 20;
/** Nothing is placed closer than this to the alignment (tracks, platforms, OHE). */
const CLEAR_M = 24;
const RIVER_DEPTH_M = 12;
const VIADUCT_DEPTH_M = 34;
const TUNNEL_HILL_M = 17;
const yAxis = new THREE.Vector3(0, 1, 0);

type DressKind =
  | 'trunk'
  | 'crown'
  | 'palm'
  | 'frond'
  | 'bamboo'
  | 'conifer'
  | 'shrub'
  | 'crop'
  | 'wall'
  | 'tower'
  | 'roof'
  | 'tarp'
  | 'chimney'
  | 'shikhara';

interface Item {
  kind: DressKind;
  m: THREE.Matrix4;
  c: THREE.Color;
}

const smooth = (t: number) => {
  const x = t < 0 ? 0 : t > 1 ? 1 : t;
  return x * x * (3 - 2 * x);
};

/** Bell from 0 (outside) to 1 (inside [a,b]) with ramps of `r` metres. */
function bell(s: number, a: number, b: number, r: number): number {
  return smooth((s - (a - r)) / r) * (1 - smooth((s - b) / r));
}

function noise(s: number, side: number): number {
  return (
    Math.sin(s * 0.013 + side * 0.021) * 0.5 +
    Math.sin(s * 0.031 - side * 0.017 + 1.3) * 0.3 +
    Math.sin(s * 0.0071 + side * 0.045 + 2.1) * 0.2
  );
}

export class ZoneWorld {
  readonly root = new THREE.Group();
  private readonly scene: SceneScript;
  private readonly chunks: Item[][] = [];
  private readonly meshes = new Map<DressKind, THREE.InstancedMesh>();
  private loadedFrom = -1;
  private readonly w: ZoneWeight[] = [];
  private readonly ca = new THREE.Color();
  private readonly cb = new THREE.Color();

  constructor(
    private readonly track: Track,
    route: RouteDef,
    private readonly zones: ReadonlyMap<string, ZoneDef>,
    private readonly preset: QualityPreset,
  ) {
    this.scene = route.scene ?? {
      zones: [{ zoneId: 'farmland', fromM: 0, toM: track.length }],
      landmarks: [],
    };
    this.root.name = 'zoneWorld';
    this.root.add(this.buildGround(), this.buildFarPlane(), ...this.buildWater());
    const stations = route.stations.map(
      (s) => [s.stopMarkM - s.platformLengthM - 60, s.stopMarkM + 120] as const,
    );
    for (let c = 0; c * CHUNK_M < track.length; c++) this.chunks.push(this.dress(c, stations));
    this.makeMeshes();
  }

  /** Terrain height relative to the track level at chainage s, `side` metres off the line. */
  heightAt(s: number, side: number): number {
    const d = Math.abs(side);
    const relief = blendAt(this.scene, this.zones, s, (z) => z.relief.heightM);
    const atM = blendAt(this.scene, this.zones, s, (z) => z.relief.atM);
    const rough = blendAt(this.scene, this.zones, s, (z) => z.relief.roughnessM);
    const k = smooth((d - 16) / Math.max(30, atM));
    let h = relief * k + rough * noise(s, side) * smooth((d - 30) / 80);
    for (const lm of this.scene.landmarks) {
      if (lm.kind === 'river-bridge') h = lerp(h, -RIVER_DEPTH_M, bell(s, lm.fromM, lm.toM, 90));
      else if (lm.kind === 'viaduct') h = lerp(h, -VIADUCT_DEPTH_M, bell(s, lm.fromM, lm.toM, 120));
      else if (lm.kind === 'tunnel') {
        const b = bell(s, lm.fromM, lm.toM, 25) * (1 - smooth((d - 160) / 200));
        if (b > 0) h = Math.max(h, (TUNNEL_HILL_M + Math.max(0, relief * k)) * b);
      }
    }
    return h;
  }

  /** Zone-graded colours at s (ground and fog), for lighting and fog tinting. */
  gradeAt(s: number, fog: THREE.Color, ground: THREE.Color): void {
    fog.setRGB(0, 0, 0);
    ground.setRGB(0, 0, 0);
    for (const e of zoneWeightsAt(this.scene, s, this.w)) {
      const z = this.zones.get(e.zoneId);
      if (!z) continue;
      fog.add(this.ca.set(z.grade.fog).multiplyScalar(e.w));
      ground.add(this.cb.set(z.grade.ground).multiplyScalar(e.w));
    }
  }

  landmarkAt(s: number): Landmark | undefined {
    return landmarkAt(this.scene, s);
  }

  /** Stream dressing around the camera's chainage. */
  update(cameraS: number): void {
    const range = this.preset.viewDistanceM * 0.6;
    const from = Math.max(0, Math.floor((cameraS - range) / CHUNK_M));
    if (from === this.loadedFrom) return;
    this.loadedFrom = from;
    const to = Math.min(this.chunks.length - 1, Math.floor((cameraS + range) / CHUNK_M));
    const counts = new Map<DressKind, number>();
    for (let c = from; c <= to; c++) {
      for (const it of this.chunks[c]!) {
        const mesh = this.meshes.get(it.kind)!;
        const n = counts.get(it.kind) ?? 0;
        if (n >= mesh.instanceMatrix.count) continue;
        mesh.setMatrixAt(n, it.m);
        mesh.setColorAt(n, it.c);
        counts.set(it.kind, n + 1);
      }
    }
    for (const [kind, mesh] of this.meshes) {
      mesh.count = counts.get(kind) ?? 0;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  }

  /** Instances currently streamed in (for perf budgets). */
  instanceCount(): number {
    let n = 0;
    for (const m of this.meshes.values()) n += m.count;
    return n;
  }

  // ------------------------------------------------------------------ ground

  private buildGround(): THREE.Mesh {
    const rows = Math.floor(this.track.length / ROW_M) + 1;
    const pos = new Float32Array(rows * COLS.length * 3);
    const col = new Float32Array(rows * COLS.length * 3);
    const p = new THREE.Vector3();
    const g = new THREE.Color();
    const fog = new THREE.Color();
    for (let r = 0; r < rows; r++) {
      const s = Math.min(this.track.length, r * ROW_M);
      this.gradeAt(s, fog, g);
      COLS.forEach((side, c) => {
        const h = this.heightAt(s, side);
        frameAt(this.track, s, side, h - 0.1, p);
        pos.set([p.x, p.y, p.z], (r * COLS.length + c) * 3);
        // Valley floors and hilltops shade slightly darker / lighter.
        const shade =
          1 + Math.max(-0.25, Math.min(0.15, h * 0.004)) + noise(s * 3, side * 3) * 0.05;
        col.set([g.r * shade, g.g * shade, g.b * shade], (r * COLS.length + c) * 3);
      });
    }
    const index: number[] = [];
    for (let r = 0; r < rows - 1; r++) {
      for (let c = 0; c < COLS.length - 1; c++) {
        const a = r * COLS.length + c;
        const b = a + COLS.length;
        index.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setIndex(index);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, side: THREE.DoubleSide }),
    );
    mesh.receiveShadow = true;
    mesh.name = 'zoneGround';
    return mesh;
  }

  /** Plane under the terrain ribbon out to the horizon, at its lowest point. */
  private buildFarPlane(): THREE.Mesh {
    const p = new THREE.Vector3();
    const box = new THREE.Box3();
    let minY = Infinity;
    for (let s = 0; s <= this.track.length; s += 100) {
      for (const side of [-800, 0, 800]) {
        frameAt(this.track, s, side, this.heightAt(s, side) - 1, p);
        box.expandByPoint(p);
        minY = Math.min(minY, p.y);
      }
    }
    const size = Math.max(box.max.x - box.min.x, box.max.z - box.min.z) + 7000;
    const geo = new THREE.PlaneGeometry(size, size).rotateX(-Math.PI / 2);
    const g = new THREE.Color();
    this.gradeAt(this.track.length / 2, new THREE.Color(), g);
    const plane = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({ color: g.multiplyScalar(0.9), roughness: 1 }),
    );
    const mid = box.getCenter(new THREE.Vector3());
    plane.position.set(mid.x, minY - 1, mid.z);
    plane.name = 'farPlane';
    return plane;
  }

  private buildWater(): THREE.Mesh[] {
    const out: THREE.Mesh[] = [];
    const mat = new THREE.MeshStandardMaterial({
      color: 0x3f6f74,
      roughness: 0.15,
      metalness: 0.2,
    });
    for (const lm of this.scene.landmarks) {
      if (lm.kind !== 'river-bridge') continue;
      const mid = (lm.fromM + lm.toM) / 2;
      const len = lm.toM - lm.fromM + 60;
      const geo = new THREE.PlaneGeometry(len, 1600);
      geo.rotateX(-Math.PI / 2);
      const water = new THREE.Mesh(geo, mat);
      frameAt(this.track, mid, 0, -RIVER_DEPTH_M + 2.5, water.position);
      water.quaternion.setFromAxisAngle(yAxis, headingAt(this.track, mid));
      out.push(water);
    }
    return out;
  }

  // ------------------------------------------------------------------ dressing

  private dress(chunk: number, stations: readonly (readonly [number, number])[]): Item[] {
    const items: Item[] = [];
    const rnd = mulberry32(9001 + chunk * 7919);
    const s0 = chunk * CHUNK_M;
    const s1 = Math.min(this.track.length, s0 + CHUNK_M);
    const density = this.preset.trees / 1500;
    const mid = (s0 + s1) / 2;
    for (const e of zoneWeightsAt(this.scene, mid, [])) {
      const z = this.zones.get(e.zoneId);
      if (!z) continue;
      const span = (s1 - s0) / 1000;
      const nVeg = Math.round(z.vegetation.perKm * span * e.w * density);
      for (let i = 0; i < nVeg; i++) {
        const kind = z.vegetation.kinds[Math.floor(rnd() * z.vegetation.kinds.length)]!;
        const s = s0 + rnd() * (s1 - s0);
        const side = this.pickSide(rnd, kind === 'crop' ? 40 : 520);
        if (this.blocked(s, side, stations)) continue;
        this.plant(items, kind, s, side, rnd, z);
      }
      const nBld = Math.round(z.buildings.perKm * span * e.w * Math.min(1, 0.4 + density * 0.6));
      for (let i = 0; i < nBld; i++) {
        const s = s0 + rnd() * (s1 - s0);
        const near = z.buildings.style === 'slum' ? 18 : z.buildings.style === 'highrise' ? 90 : 60;
        const side = this.pickSide(rnd, near * 4, near);
        if (this.blocked(s, side, stations)) continue;
        this.build(items, z.buildings.style, s, side, rnd);
      }
    }
    return items;
  }

  private pickSide(rnd: () => number, spread: number, min = CLEAR_M): number {
    const d = min + rnd() * rnd() * spread;
    return rnd() < 0.5 ? -d - 6 : d + 10; // a little more room on the left for loops
  }

  private blocked(
    s: number,
    side: number,
    stations: readonly (readonly [number, number])[],
  ): boolean {
    if (Math.abs(side) < CLEAR_M) return true;
    for (const [a, b] of stations) if (s > a && s < b && Math.abs(side) < 45) return true;
    const lm = landmarkAt(this.scene, s);
    if (lm && lm.kind !== 'level-crossing' && Math.abs(side) < 40) return true;
    return false;
  }

  private readonly p = new THREE.Vector3();
  private readonly q = new THREE.Quaternion();
  private readonly sc = new THREE.Vector3();

  private place(
    items: Item[],
    kind: DressKind,
    s: number,
    side: number,
    up: number,
    scale: THREE.Vector3,
    yaw: number,
    colour: THREE.Color,
  ): void {
    frameAt(this.track, s, side, this.heightAt(s, side) + up, this.p);
    this.q.setFromAxisAngle(yAxis, headingAt(this.track, s) + yaw);
    items.push({ kind, m: new THREE.Matrix4().compose(this.p, this.q, scale), c: colour.clone() });
  }

  private plant(
    items: Item[],
    kind: VegetationKind,
    s: number,
    side: number,
    rnd: () => number,
    z: ZoneDef,
  ): void {
    const foliage = new THREE.Color(z.grade.foliage).offsetHSL(
      (rnd() - 0.5) * 0.04,
      0,
      (rnd() - 0.5) * 0.08,
    );
    const k = 0.7 + rnd() * 0.8;
    const yaw = rnd() * Math.PI * 2;
    const bark = new THREE.Color(0x5a4632);
    switch (kind) {
      case 'broadleaf':
        this.place(items, 'trunk', s, side, 0, this.sc.set(k, k, k), yaw, bark);
        this.place(
          items,
          'crown',
          s,
          side,
          0,
          this.sc.set(k, k * (0.8 + rnd() * 0.5), k),
          yaw,
          foliage,
        );
        break;
      case 'palm':
        this.place(
          items,
          'palm',
          s,
          side,
          0,
          this.sc.set(k, k * (0.9 + rnd() * 0.4), k),
          yaw,
          bark,
        );
        this.place(items, 'frond', s, side, 0, this.sc.set(k, k, k), yaw, foliage);
        break;
      case 'bamboo':
        this.place(
          items,
          'bamboo',
          s,
          side,
          0,
          this.sc.set(k, k * (0.8 + rnd() * 0.6), k),
          yaw,
          foliage.offsetHSL(0.03, 0.1, 0.08),
        );
        break;
      case 'conifer':
        this.place(
          items,
          'conifer',
          s,
          side,
          0,
          this.sc.set(k, k * (1 + rnd() * 0.6), k),
          yaw,
          foliage.offsetHSL(0.05, 0, -0.05),
        );
        break;
      case 'shrub':
        this.place(items, 'shrub', s, side, 0, this.sc.set(k, k * 0.7, k), yaw, foliage);
        break;
      case 'crop': {
        const crop = new THREE.Color(z.vegetation.crop ?? '#8fae3a').offsetHSL(
          (rnd() - 0.5) * 0.05,
          0,
          (rnd() - 0.5) * 0.1,
        );
        this.place(
          items,
          'crop',
          s,
          side,
          0,
          this.sc.set(20 + rnd() * 25, 1, 14 + rnd() * 18),
          (rnd() - 0.5) * 0.2,
          crop,
        );
        break;
      }
    }
  }

  private build(
    items: Item[],
    style: ZoneDef['buildings']['style'],
    s: number,
    side: number,
    rnd: () => number,
  ): void {
    const yaw = (rnd() - 0.5) * 0.3;
    const c = new THREE.Color();
    switch (style) {
      case 'highrise': {
        const w = 14 + rnd() * 14;
        this.place(
          items,
          'tower',
          s,
          side,
          0,
          this.sc.set(w, 18 + rnd() * 40, 12 + rnd() * 10),
          yaw,
          c.setHSL(0.08 + rnd() * 0.1, 0.12, 0.6 + rnd() * 0.2),
        );
        break;
      }
      case 'slum': {
        const w = 3 + rnd() * 3;
        this.place(
          items,
          'wall',
          s,
          side,
          0,
          this.sc.set(w, 2.4 + rnd() * 1.6, 3 + rnd() * 2),
          yaw,
          c.setHSL(rnd(), 0.25, 0.55 + rnd() * 0.2),
        );
        this.place(
          items,
          'tarp',
          s,
          side,
          2.6 + rnd() * 0.8,
          this.sc.set(w + 0.6, 0.15, 4.4),
          yaw,
          c.setHSL(rnd() < 0.6 ? 0.6 : 0.05, 0.6, 0.45),
        );
        break;
      }
      case 'village': {
        const w = 5 + rnd() * 4;
        const h = 3 + rnd();
        this.place(
          items,
          'wall',
          s,
          side,
          0,
          this.sc.set(w, h, 5 + rnd() * 3),
          yaw,
          c.setHSL(0.1 + rnd() * 0.05, 0.3, 0.75),
        );
        this.place(
          items,
          'roof',
          s,
          side,
          h,
          this.sc.set(w * 0.8, 2, 4.5),
          yaw,
          c.setHSL(0.03, 0.55, 0.38),
        );
        if (rnd() < 0.05) {
          this.place(
            items,
            'wall',
            s + 20,
            side,
            0,
            this.sc.set(5, 4, 5),
            0,
            c.setHSL(0.1, 0.1, 0.92),
          );
          this.place(
            items,
            'shikhara',
            s + 20,
            side,
            4,
            this.sc.set(4, 8, 4),
            0,
            c.setHSL(0.1, 0.1, 0.92),
          );
        }
        break;
      }
      case 'industrial': {
        const w = 30 + rnd() * 40;
        this.place(
          items,
          'wall',
          s,
          side,
          0,
          this.sc.set(w, 9 + rnd() * 6, 20 + rnd() * 15),
          yaw,
          c.setHSL(0.55, 0.05, 0.5 + rnd() * 0.15),
        );
        if (rnd() < 0.6)
          this.place(
            items,
            'chimney',
            s + 10,
            side,
            0,
            this.sc.set(1, 28 + rnd() * 25, 1),
            0,
            c.setHSL(0.05, 0.3, 0.42),
          );
        break;
      }
      case 'hill': {
        const w = 6 + rnd() * 3;
        this.place(
          items,
          'wall',
          s,
          side,
          0,
          this.sc.set(w, 3.5, 6),
          yaw,
          c.setHSL(0.12, 0.2, 0.82),
        );
        this.place(
          items,
          'roof',
          s,
          side,
          3.5,
          this.sc.set(w * 0.85, 2.4, 5),
          yaw,
          c.setHSL(0.0, 0.6, 0.4),
        );
        break;
      }
      case 'none':
        break;
    }
  }

  private makeMeshes(): void {
    const unit = (geo: THREE.BufferGeometry) => geo;
    const box = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
    const trunk = new THREE.CylinderGeometry(0.25, 0.35, 3, 6).translate(0, 1.5, 0);
    const crown = new THREE.IcosahedronGeometry(2.6, 0).translate(0, 4.6, 0);
    const palm = new THREE.CylinderGeometry(0.16, 0.24, 9, 5).translate(0, 4.5, 0);
    const frond = new THREE.ConeGeometry(3.2, 1.4, 7).translate(0, 9, 0);
    const bamboo = mergeClump();
    const conifer = new THREE.ConeGeometry(2.2, 8, 7).translate(0, 5, 0);
    const shrub = new THREE.IcosahedronGeometry(1.2, 0).translate(0, 0.8, 0);
    const crop = new THREE.BoxGeometry(1, 0.6, 1).translate(0, 0.3, 0);
    const roof = new THREE.ConeGeometry(0.75, 1, 4).rotateY(Math.PI / 4).translate(0, 0.5, 0);
    const chimney = new THREE.CylinderGeometry(1.2, 1.8, 1, 10).translate(0, 0.5, 0);
    const shikhara = new THREE.ConeGeometry(0.6, 1, 8).translate(0, 0.5, 0);
    const mat = (o: THREE.MeshStandardMaterialParameters = {}) =>
      new THREE.MeshStandardMaterial({ roughness: 0.9, ...o });
    const towerMat = mat({ map: windowTexture(), roughness: 0.7 });
    const defs: [DressKind, THREE.BufferGeometry, THREE.Material, number][] = [
      ['trunk', trunk, mat(), 2600],
      ['crown', crown, mat({ flatShading: true }), 2600],
      ['palm', palm, mat(), 600],
      ['frond', frond, mat({ flatShading: true }), 600],
      ['bamboo', bamboo, mat({ flatShading: true }), 900],
      ['conifer', conifer, mat({ flatShading: true }), 600],
      ['shrub', shrub, mat({ flatShading: true }), 900],
      ['crop', unit(crop), mat({ roughness: 1 }), 400],
      ['wall', box, mat(), 1400],
      ['tower', box.clone(), towerMat, 300],
      ['roof', roof, mat({ flatShading: true }), 700],
      ['tarp', box.clone(), mat({ roughness: 0.6 }), 700],
      ['chimney', chimney, mat(), 100],
      ['shikhara', shikhara, mat({ flatShading: true }), 60],
    ];
    const white = new THREE.Color(1, 1, 1);
    for (const [kind, geo, material, cap] of defs) {
      const mesh = new THREE.InstancedMesh(geo, material, cap);
      mesh.count = 0;
      mesh.castShadow = kind !== 'crop' && kind !== 'tarp';
      mesh.receiveShadow = kind === 'crop';
      for (let i = 0; i < cap; i++) mesh.setColorAt(i, white);
      mesh.name = `dress-${kind}`;
      this.meshes.set(kind, mesh);
      this.root.add(mesh);
    }
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** A clump of five bamboo canes as one geometry. */
function mergeClump(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const offs = [
    [0, 0],
    [0.6, 0.3],
    [-0.5, 0.4],
    [0.2, -0.6],
    [-0.4, -0.4],
  ];
  offs.forEach(([x, z], i) => {
    const h = 8 + i * 0.9;
    const g = new THREE.CylinderGeometry(0.09, 0.12, h, 5).translate(x!, h / 2, z!);
    g.rotateZ((i - 2) * 0.05);
    parts.push(g);
  });
  const leaves = new THREE.IcosahedronGeometry(1.6, 0).scale(1, 2, 1).translate(0, 8, 0);
  parts.push(leaves);
  return mergeGeometries(parts);
}

function mergeGeometries(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const nonIndexed = parts.map((p) => (p.index ? p.toNonIndexed() : p));
  let count = 0;
  for (const p of nonIndexed) count += p.attributes['position']!.count;
  const pos = new Float32Array(count * 3);
  const nrm = new Float32Array(count * 3);
  let o = 0;
  for (const p of nonIndexed) {
    p.computeVertexNormals();
    pos.set(p.attributes['position']!.array as Float32Array, o * 3);
    nrm.set(p.attributes['normal']!.array as Float32Array, o * 3);
    o += p.attributes['position']!.count;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  return g;
}

/** Facade with lit/unlit window grid (procedural). */
function windowTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null; // headless perf checks
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#d8d2c6';
  g.fillRect(0, 0, 64, 128);
  const rnd = mulberry32(77);
  for (let y = 6; y < 128; y += 12) {
    for (let x = 4; x < 64; x += 12) {
      g.fillStyle = rnd() < 0.2 ? '#e9d79a' : '#4a5966';
      g.fillRect(x, y, 7, 7);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
