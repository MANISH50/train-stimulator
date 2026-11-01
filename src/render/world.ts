// Lineside world: ground, trees, stations, signals and boards — all procedural.
import * as THREE from 'three';
import { signalDir, signalLine, type RailNetwork } from '../sim/track/network';
import type { Track } from '../sim/track/track';
import type { Aspect, RouteDef, SignalDef } from '../sim/types';
import { mergeByMaterial } from './merge';
import type { QualityPreset } from './quality';
import {
  boardTexture,
  glowTexture,
  groundTexture,
  mulberry32,
  stationBoardTexture,
} from './textures';
import { frameAt, headingAt } from './trackMesh';

const yAxis = new THREE.Vector3(0, 1, 0);
/** Signals and boards stand this far to the left of their line (left-hand running). */
const LINESIDE_M = 3.2;

/** Half-width of the terrain ribbon that follows the line's gradients (m). */
const TERRAIN_HALF_M = 800;
const TERRAIN_STEP_M = 20;

/**
 * Ground: a wide ribbon that follows the track's elevation (so gradients never bury the
 * line), over a flat plane at the lowest point for the far horizon.
 */
export function buildGround(track: Track): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ map: groundTexture(1), roughness: 1 });
  mat.map!.repeat.set(1, 1);

  const cols = [-TERRAIN_HALF_M, -300, -60, -8, 8, 60, 300, TERRAIN_HALF_M];
  const rows = Math.floor(track.length / TERRAIN_STEP_M) + 1;
  const pos = new Float32Array(rows * cols.length * 3);
  const uv = new Float32Array(rows * cols.length * 2);
  const p = new THREE.Vector3();
  let minY = Infinity;
  for (let r = 0; r < rows; r++) {
    const s = Math.min(track.length, r * TERRAIN_STEP_M);
    cols.forEach((side, c) => {
      frameAt(track, s, side, -0.1, p);
      minY = Math.min(minY, p.y);
      pos.set([p.x, p.y, p.z], (r * cols.length + c) * 3);
      uv.set([p.x / 40, p.z / 40], (r * cols.length + c) * 2);
    });
  }
  const index: number[] = [];
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols.length - 1; c++) {
      const a = r * cols.length + c;
      const b = a + cols.length;
      index.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(index);
  geo.computeVertexNormals();
  const ribbon = new THREE.Mesh(geo, mat);
  ribbon.material.side = THREE.DoubleSide;
  ribbon.receiveShadow = true;

  // Far-field plane below the ribbon, covering the whole route with margin.
  const box = new THREE.Box3();
  for (let s = 0; s <= track.length; s += 250) box.expandByPoint(frameAt(track, s, 0, 0, p));
  const size = Math.max(box.max.x - box.min.x, box.max.z - box.min.z) + 7000;
  const mid = box.getCenter(new THREE.Vector3());
  const planeGeo = new THREE.PlaneGeometry(size, size, 1, 1);
  planeGeo.rotateX(-Math.PI / 2);
  const plane = new THREE.Mesh(
    planeGeo,
    new THREE.MeshStandardMaterial({ map: groundTexture(size / 40), roughness: 1 }),
  );
  plane.position.set(mid.x, minY - 1.5, mid.z);
  g.add(plane, ribbon);
  return g;
}

/** Instanced neem/mango-like trees scattered away from the lines. */
export function buildTrees(track: Track, preset: QualityPreset): THREE.Group {
  const g = new THREE.Group();
  const rnd = mulberry32(42);
  const count = Math.round(preset.trees * Math.max(1, track.length / 6000));
  const trunkGeo = new THREE.CylinderGeometry(0.25, 0.35, 3, 6);
  trunkGeo.translate(0, 1.5, 0);
  const crownGeo = new THREE.IcosahedronGeometry(2.6, 0);
  crownGeo.translate(0, 4.6, 0);
  const trunks = new THREE.InstancedMesh(
    trunkGeo,
    new THREE.MeshStandardMaterial({ color: 0x5a4632 }),
    count,
  );
  const crowns = new THREE.InstancedMesh(
    crownGeo,
    new THREE.MeshStandardMaterial({ color: 0x4f6b2c, flatShading: true }),
    count,
  );
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const sc = new THREE.Vector3();
  const p = new THREE.Vector3();
  const colour = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const s = rnd() * track.length;
    // Clear of the loops/platforms on the left and of the side-view camera on the right.
    const side = rnd() < 0.5 ? -(22 + rnd() * rnd() * 700) : 38 + rnd() * rnd() * 700;
    frameAt(track, s, side, 0, p);
    const k = 0.7 + rnd() * 0.9;
    q.setFromAxisAngle(yAxis, rnd() * Math.PI * 2);
    m.compose(p, q, sc.set(k, k * (0.8 + rnd() * 0.5), k));
    trunks.setMatrixAt(i, m);
    crowns.setMatrixAt(i, m);
    crowns.setColorAt(i, colour.setHSL(0.22 + rnd() * 0.06, 0.4 + rnd() * 0.2, 0.22 + rnd() * 0.1));
  }
  crowns.castShadow = true;
  g.add(trunks, crowns);
  return g;
}

const DEFAULT_PLATFORMS = [{ offsetM: -5.6, widthM: 4.5 }];

export interface StationsBuild {
  group: THREE.Group;
  /** Platform lamp glows, shown at night. */
  lamps: THREE.Points;
}

export function buildStations(track: Track, route: RouteDef, net: RailNetwork): StationsBuild {
  const all = new THREE.Group();
  const concrete = new THREE.MeshStandardMaterial({ color: 0xb9b2a3, roughness: 0.9 });
  const edge = new THREE.MeshStandardMaterial({ color: 0xe8d36a, roughness: 0.8 });
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x7d3b2a,
    roughness: 0.7,
    side: THREE.DoubleSide,
  });
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0xd9d2c0 });
  const lampPositions: number[] = [];

  for (const st of route.stations) {
    const g = new THREE.Group();
    const start = st.stopMarkM - st.platformLengthM + 40;
    const platforms = st.platforms ?? DEFAULT_PLATFORMS;
    for (const pf of platforms) {
      for (let s = start; s < start + st.platformLengthM; s += 10) {
        const h = headingAt(track, s + 5);
        const slab = new THREE.Mesh(new THREE.BoxGeometry(10.05, 0.84, pf.widthM), concrete);
        slab.position.copy(frameAt(track, s + 5, pf.offsetM, 0.42));
        slab.quaternion.setFromAxisAngle(yAxis, h);
        g.add(slab);
        for (const e of [-1, 1]) {
          const stripe = new THREE.Mesh(new THREE.BoxGeometry(10.05, 0.02, 0.3), edge);
          stripe.position.copy(frameAt(track, s + 5, pf.offsetM + e * (pf.widthM / 2 - 0.2), 0.85));
          stripe.quaternion.copy(slab.quaternion);
          g.add(stripe);
        }
      }
      // Shelter and lamp posts down the middle of each platform.
      const midS = start + st.platformLengthM / 2;
      const roofLen = Math.min(180, st.platformLengthM * 0.5);
      const roof = new THREE.Mesh(
        new THREE.BoxGeometry(roofLen, 0.15, Math.max(2.2, pf.widthM - 0.4)),
        roofMat,
      );
      roof.position.copy(frameAt(track, midS, pf.offsetM, 4.6));
      roof.quaternion.setFromAxisAngle(yAxis, headingAt(track, midS));
      g.add(roof);
      for (let s = midS - roofLen / 2 + 5; s < midS + roofLen / 2; s += 15) {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 3.8, 8), pillarMat);
        pillar.position.copy(frameAt(track, s, pf.offsetM, 2.7));
        g.add(pillar);
      }
      for (let s = start + 10; s < start + st.platformLengthM; s += 40) {
        const v = frameAt(track, s, pf.offsetM, 4.4);
        lampPositions.push(v.x, v.y, v.z);
      }
    }
    mergeByMaterial(g);

    // Name boards (unique texture) on the first platform, facing approaching trains.
    const pf0 = platforms[0]!;
    const tex = stationBoardTexture(st.name, st.localName ?? st.name);
    const boardMat = new THREE.MeshStandardMaterial({ map: tex });
    for (const s of [start + 15, start + st.platformLengthM - 15]) {
      const board = new THREE.Mesh(new THREE.BoxGeometry(4, 1, 0.1), boardMat);
      board.position.copy(frameAt(track, s, pf0.offsetM, 3.3));
      board.quaternion.setFromAxisAngle(yAxis, headingAt(track, s) + Math.PI / 2);
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.8, 0.12), pillarMat);
      post.position.copy(frameAt(track, s, pf0.offsetM, 1.6));
      g.add(board, post);
    }
    // Stop mark for UP trains on the platform edge beside the UP line.
    g.add(
      lineBoard(
        track,
        st.stopMarkM,
        net.offsetAt('UP', st.stopMarkM) - 1.6,
        'STOP',
        '#f2f2f2',
        '#c0392b',
      ),
    );
    all.add(g);
  }

  const lampGeo = new THREE.BufferGeometry();
  lampGeo.setAttribute('position', new THREE.Float32BufferAttribute(lampPositions, 3));
  const lamps = new THREE.Points(
    lampGeo,
    new THREE.PointsMaterial({
      map: glowTexture(),
      color: 0xffe2a8,
      size: 3,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  lamps.visible = false;
  all.add(lamps);
  return { group: all, lamps };
}

/** Speed-restriction boards: figure at the start, "T" termination at the end (generic style). */
export function buildSpeedBoards(track: Track, route: RouteDef, net: RailNetwork): THREE.Group {
  const g = new THREE.Group();
  for (const lim of route.speedLimits) {
    if (lim.kind !== 'temporary') continue;
    const side = (s: number) => net.offsetAt('UP', s) - LINESIDE_M - 0.4;
    g.add(lineBoard(track, lim.fromM - 30, side(lim.fromM), String(lim.kmh), '#f2c230', '#111'));
    g.add(lineBoard(track, lim.toM, side(lim.toM), 'T', '#f2c230', '#111'));
  }
  return g;
}

function lineBoard(
  track: Track,
  s: number,
  side: number,
  text: string,
  bg: string,
  fg: string,
): THREE.Group {
  const g = new THREE.Group();
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshStandardMaterial({ map: boardTexture(text, bg, fg) }),
  );
  board.position.set(0, 2.4, 0);
  board.rotation.y = -Math.PI / 2; // face oncoming trains (local -x)
  const post = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 2, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x333333 }),
  );
  post.position.y = 1;
  g.add(board, post);
  g.position.copy(frameAt(track, s, side, 0.4));
  g.quaternion.setFromAxisAngle(yAxis, headingAt(track, s));
  return g;
}

const LAMP_COLOURS = { R: 0xff2a1a, Y: 0xffb414, G: 0x3dff6a, Y2: 0xffb414 } as const;
type Lamp = keyof typeof LAMP_COLOURS;
const LAMP_ORDER: Lamp[] = ['R', 'Y', 'G', 'Y2'];
/** Which lamps are lit per aspect (stack from bottom: R, Y, G, Y2 — docs/research/01-signalling-rules.md). */
const LIT: Record<Aspect, Lamp[]> = {
  RED: ['R'],
  YELLOW: ['Y'],
  DOUBLE_YELLOW: ['Y', 'Y2'],
  GREEN: ['G'],
};
const OFF = new THREE.Color(0x222222);
const BLACK = new THREE.Color(0x000000);

/**
 * All colour-light signals of a route, instanced: masts, heads and lamp discs are one draw
 * call each, and every lamp glow is one additive point cloud.
 */
export class SignalBank {
  readonly root = new THREE.Group();
  private readonly discs: THREE.InstancedMesh;
  private readonly glowColours: THREE.BufferAttribute;
  private readonly glows: THREE.Points;
  private readonly current = new Map<string, Aspect>();
  private readonly index = new Map<string, number>();

  constructor(
    track: Track,
    net: RailNetwork,
    readonly defs: readonly SignalDef[],
  ) {
    const n = defs.length;
    const white = new THREE.MeshStandardMaterial({ color: 0xe6e6e6 });
    const black = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.6 });
    const mastGeo = new THREE.CylinderGeometry(0.1, 0.14, 6, 8);
    mastGeo.translate(0, 3, 0);
    const headGeo = new THREE.BoxGeometry(0.35, 2.1, 0.7);
    headGeo.translate(0, 6.4, 0);
    const discGeo = new THREE.CircleGeometry(0.17, 16);
    discGeo.rotateY(-Math.PI / 2);
    const masts = new THREE.InstancedMesh(mastGeo, white, n);
    const heads = new THREE.InstancedMesh(headGeo, black, n);
    this.discs = new THREE.InstancedMesh(
      discGeo,
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
      n * 4,
    );
    const glowPos = new Float32Array(n * 4 * 3);
    this.glowColours = new THREE.BufferAttribute(new Float32Array(n * 4 * 3), 3);

    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const one = new THREE.Vector3(1, 1, 1);
    const base = new THREE.Vector3();
    const local = new THREE.Vector3();
    defs.forEach((def, i) => {
      this.index.set(def.id, i);
      const dir = signalDir(def);
      const s = def.chainageM;
      const side = net.offsetAt(signalLine(def), s) + (dir === 1 ? -LINESIDE_M : LINESIDE_M);
      frameAt(track, s, side, 0.4, base);
      q.setFromAxisAngle(yAxis, headingAt(track, s) + (dir === 1 ? 0 : Math.PI));
      m.compose(base, q, one);
      masts.setMatrixAt(i, m);
      heads.setMatrixAt(i, m);
      LAMP_ORDER.forEach((_, k) => {
        local
          .set(-0.18, 5.65 + k * 0.5, 0)
          .applyQuaternion(q)
          .add(base);
        this.discs.setMatrixAt(i * 4 + k, m.compose(local, q, one));
        this.discs.setColorAt(i * 4 + k, OFF);
        local
          .set(-0.32, 5.65 + k * 0.5, 0)
          .applyQuaternion(q)
          .add(base);
        glowPos.set([local.x, local.y, local.z], (i * 4 + k) * 3);
      });
    });
    masts.castShadow = true;
    const glowGeo = new THREE.BufferGeometry();
    glowGeo.setAttribute('position', new THREE.BufferAttribute(glowPos, 3));
    glowGeo.setAttribute('color', this.glowColours);
    this.glows = new THREE.Points(
      glowGeo,
      new THREE.PointsMaterial({
        map: glowTexture(),
        size: 1.8,
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.root.add(masts, heads, this.discs, this.glows);
  }

  /** Bigger glows at night and in fog so lamps read like real signal lights. */
  setGlowSize(size: number): void {
    (this.glows.material as THREE.PointsMaterial).size = size;
  }

  update(aspectOf: (def: SignalDef) => Aspect): void {
    let changed = false;
    const c = new THREE.Color();
    for (const def of this.defs) {
      const aspect = aspectOf(def);
      if (this.current.get(def.id) === aspect) continue;
      this.current.set(def.id, aspect);
      changed = true;
      const i = this.index.get(def.id)!;
      LAMP_ORDER.forEach((lamp, k) => {
        const on = LIT[aspect].includes(lamp);
        c.setHex(LAMP_COLOURS[lamp]);
        this.discs.setColorAt(i * 4 + k, on ? c : OFF);
        const g = on ? c : BLACK;
        this.glowColours.setXYZ(i * 4 + k, g.r, g.g, g.b);
      });
    }
    if (changed) {
      this.discs.instanceColor!.needsUpdate = true;
      this.glowColours.needsUpdate = true;
    }
  }
}
