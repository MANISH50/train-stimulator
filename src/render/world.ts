// Lineside world: ground, trees, station, signals and boards — all procedural.
import * as THREE from 'three';
import type { Track } from '../sim/track/track';
import type { Aspect, RouteDef, SignalDef } from '../sim/types';
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
/** Signals and boards stand on the left of the line (left-hand running). */
const LINESIDE_LEFT = -3.4;

export function buildGround(track: Track): THREE.Mesh {
  const size = 9000;
  const mid = frameAt(track, track.length / 2, 0, 0);
  const geo = new THREE.PlaneGeometry(size, size, 1, 1);
  geo.rotateX(-Math.PI / 2);
  const ground = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ map: groundTexture(size / 40), roughness: 1 }),
  );
  ground.position.set(mid.x, -0.1, mid.z);
  ground.receiveShadow = true;
  return ground;
}

/** Instanced neem/mango-like trees scattered away from the line. */
export function buildTrees(track: Track, preset: QualityPreset): THREE.Group {
  const g = new THREE.Group();
  const rnd = mulberry32(42);
  const trunkGeo = new THREE.CylinderGeometry(0.25, 0.35, 3, 6);
  trunkGeo.translate(0, 1.5, 0);
  const crownGeo = new THREE.IcosahedronGeometry(2.6, 0);
  crownGeo.translate(0, 4.6, 0);
  const trunks = new THREE.InstancedMesh(
    trunkGeo,
    new THREE.MeshStandardMaterial({ color: 0x5a4632 }),
    preset.trees,
  );
  const crowns = new THREE.InstancedMesh(
    crownGeo,
    new THREE.MeshStandardMaterial({ color: 0x4f6b2c, flatShading: true }),
    preset.trees,
  );
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const sc = new THREE.Vector3();
  const p = new THREE.Vector3();
  const colour = new THREE.Color();
  for (let i = 0; i < preset.trees; i++) {
    const s = rnd() * track.length;
    // Keep the right side clear out to 35 m so the side-view camera never sits inside a tree.
    const side = rnd() < 0.5 ? -(14 + rnd() * rnd() * 700) : 35 + rnd() * rnd() * 700;
    frameAt(track, s, side, 0, p);
    p.y = 0;
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

export function buildStations(track: Track, route: RouteDef): THREE.Group {
  const g = new THREE.Group();
  const concrete = new THREE.MeshStandardMaterial({ color: 0xb9b2a3, roughness: 0.9 });
  const edge = new THREE.MeshStandardMaterial({ color: 0xe8d36a, roughness: 0.8 });
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x7d3b2a,
    roughness: 0.7,
    side: THREE.DoubleSide,
  });
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0xd9d2c0 });
  for (const st of route.stations) {
    const start = st.stopMarkM - st.platformLengthM + 40;
    for (let s = start; s < start + st.platformLengthM; s += 10) {
      const h = headingAt(track, s + 5);
      const slab = new THREE.Mesh(new THREE.BoxGeometry(10.05, 0.84, 6), concrete);
      slab.position.copy(frameAt(track, s + 5, -5.1, 0.42));
      slab.quaternion.setFromAxisAngle(yAxis, h);
      slab.receiveShadow = true;
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(10.05, 0.02, 0.3), edge);
      stripe.position.copy(frameAt(track, s + 5, -2.35, 0.85));
      stripe.quaternion.copy(slab.quaternion);
      g.add(slab, stripe);
    }
    // Shelter over the middle of the platform.
    const midS = start + st.platformLengthM / 2;
    const roofLen = Math.min(180, st.platformLengthM * 0.5);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(roofLen, 0.15, 5), roofMat);
    roof.position.copy(frameAt(track, midS, -5.3, 4.6));
    roof.quaternion.setFromAxisAngle(yAxis, headingAt(track, midS));
    roof.castShadow = true;
    g.add(roof);
    for (let s = midS - roofLen / 2 + 5; s < midS + roofLen / 2; s += 15) {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 3.8, 8), pillarMat);
      pillar.position.copy(frameAt(track, s, -6.2, 2.7));
      g.add(pillar);
    }
    // Name boards at both platform ends and the middle.
    const tex = stationBoardTexture(st.name, st.localName ?? st.name);
    const boardMat = new THREE.MeshStandardMaterial({ map: tex });
    for (const s of [start + 15, midS + roofLen / 2 + 12, start + st.platformLengthM - 15]) {
      const board = new THREE.Mesh(new THREE.BoxGeometry(4, 1, 0.1), boardMat);
      board.position.copy(frameAt(track, s, -7.2, 3.3));
      board.quaternion.setFromAxisAngle(yAxis, headingAt(track, s) + Math.PI / 2);
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.8, 0.12), pillarMat);
      post.position.copy(frameAt(track, s, -7.2, 1.6));
      g.add(board, post);
    }
    // Stop mark board at the stopping point for the train front.
    g.add(lineBoard(track, st.stopMarkM, 'STOP', '#f2f2f2', '#c0392b'));
  }
  return g;
}

/** Speed-restriction boards: figure at the start, "T" termination at the end (generic style). */
export function buildSpeedBoards(track: Track, route: RouteDef): THREE.Group {
  const g = new THREE.Group();
  for (const lim of route.speedLimits) {
    if (lim.kind !== 'temporary') continue;
    g.add(lineBoard(track, lim.fromM - 30, String(lim.kmh), '#f2c230', '#111'));
    g.add(lineBoard(track, lim.toM, 'T', '#f2c230', '#111'));
  }
  return g;
}

function lineBoard(track: Track, s: number, text: string, bg: string, fg: string): THREE.Group {
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
  g.position.copy(frameAt(track, s, LINESIDE_LEFT, 0.4));
  g.quaternion.setFromAxisAngle(yAxis, headingAt(track, s));
  return g;
}

const LAMP_COLOURS = { R: 0xff2a1a, Y: 0xffb414, G: 0x3dff6a, Y2: 0xffb414 } as const;
type Lamp = keyof typeof LAMP_COLOURS;
/** Which lamps are lit per aspect (stack from bottom: R, Y, G, Y2 — docs/research/01-signalling-rules.md). */
const LIT: Record<Aspect, Lamp[]> = {
  RED: ['R'],
  YELLOW: ['Y'],
  DOUBLE_YELLOW: ['Y', 'Y2'],
  GREEN: ['G'],
};

/** A 4-aspect colour-light signal on a mast with a hood and glow sprites. */
export class SignalModel {
  readonly root = new THREE.Group();
  private readonly lamps = new Map<Lamp, { mat: THREE.MeshBasicMaterial; glow: THREE.Sprite }>();
  private current: Aspect | null = null;

  constructor(
    track: Track,
    readonly def: SignalDef,
  ) {
    const black = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.6 });
    const white = new THREE.MeshStandardMaterial({ color: 0xe6e6e6 });
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 6, 8), white);
    mast.position.y = 3;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2.1, 0.7), black);
    head.position.set(0, 6.4, 0);
    const plate = new THREE.Mesh(
      new THREE.PlaneGeometry(0.6, 0.6),
      new THREE.MeshStandardMaterial({ map: boardTexture(def.id, '#ffffff', '#111111') }),
    );
    plate.position.set(-0.2, 4.6, 0);
    plate.rotation.y = -Math.PI / 2;
    this.root.add(mast, head, plate);

    const glowTex = glowTexture();
    (['R', 'Y', 'G', 'Y2'] as Lamp[]).forEach((lamp, i) => {
      const mat = new THREE.MeshBasicMaterial({ color: 0x222222 });
      const disc = new THREE.Mesh(new THREE.CircleGeometry(0.17, 16), mat);
      const y = 5.65 + i * 0.5;
      disc.position.set(-0.18, y, 0);
      disc.rotation.y = -Math.PI / 2;
      const glow = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: glowTex,
          color: LAMP_COLOURS[lamp],
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      glow.position.set(-0.3, y, 0);
      glow.scale.setScalar(1.6);
      glow.visible = false;
      this.root.add(disc, glow);
      this.lamps.set(lamp, { mat, glow });
    });

    this.root.position.copy(frameAt(track, def.chainageM, LINESIDE_LEFT, 0.4));
    this.root.quaternion.setFromAxisAngle(yAxis, headingAt(track, def.chainageM));
  }

  setAspect(aspect: Aspect): void {
    if (aspect === this.current) return;
    this.current = aspect;
    const lit = LIT[aspect];
    for (const [lamp, { mat, glow }] of this.lamps) {
      const on = lit.includes(lamp);
      mat.color.setHex(on ? LAMP_COLOURS[lamp] : 0x222222);
      glow.visible = on;
    }
  }
}
