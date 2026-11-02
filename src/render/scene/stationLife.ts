// Station life props (procedural, original): tea and book stalls, benches, a departures
// board, parcel trolleys, a foot-over-bridge at junctions and a stray dog at small halts.
// Also the junction-type route indicator on home signals: a row of five lunar-white lamps
// lit at an angle for a diverging route (docs/research/07-yards.md). The arm numbering per
// platform is a game convention (UNVERIFIED).
import * as THREE from 'three';
import type { Sim } from '../../sim/sim';
import type { RailNetwork } from '../../sim/track/network';
import type { Track } from '../../sim/track/track';
import type { RouteDef, SignalDef, Station } from '../../sim/types';
import { mergeByMaterial } from '../merge';
import { glowTexture } from '../textures';
import { frameAt, headingAt } from '../trackMesh';

const yAxis = new THREE.Vector3(0, 1, 0);
const TOP = 0.84;

function put(
  g: THREE.Group,
  track: Track,
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  s: number,
  side: number,
  up: number,
  yaw = 0,
): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  frameAt(track, s, side, up, m.position);
  m.quaternion.setFromAxisAngle(yAxis, headingAt(track, s) + yaw);
  g.add(m);
  return m;
}

export function buildStationLife(track: Track, route: RouteDef): THREE.Group {
  const all = new THREE.Group();
  all.name = 'stationLife';
  const wood = new THREE.MeshStandardMaterial({ color: 0x7a5232, roughness: 0.9 });
  const tin = new THREE.MeshStandardMaterial({ color: 0x3f7a6a, roughness: 0.6 });
  const cream = new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.8 });
  const steel = new THREE.MeshStandardMaterial({ color: 0x6d747a, metalness: 0.5, roughness: 0.5 });
  const kettle = new THREE.MeshStandardMaterial({
    color: 0xb8b8b8,
    metalness: 0.8,
    roughness: 0.3,
  });
  const red = new THREE.MeshStandardMaterial({ color: 0x8e2c22, roughness: 0.7 });
  for (const st of route.stations) {
    const g = new THREE.Group();
    const size = st.crowd?.size ?? 'town';
    const start = st.stopMarkM - st.platformLengthM + 40;
    const platforms = st.platforms ?? [{ offsetM: -5.6, widthM: 4.5 }];
    const stalls = size === 'halt' ? 1 : size === 'town' ? 2 : 4;
    platforms.forEach((pf, pi) => {
      const w = pf.widthM;
      for (let k = 0; k < stalls; k++) {
        const s = start + st.platformLengthM * ((k + 1 + pi * 0.37) / (stalls + 1));
        const tea = (k + pi) % 2 === 0;
        put(
          g,
          track,
          new THREE.BoxGeometry(2.4, 1.1, Math.min(1.4, w * 0.35)),
          wood,
          s,
          pf.offsetM,
          TOP + 0.55,
        );
        put(
          g,
          track,
          new THREE.BoxGeometry(2.8, 0.08, Math.min(1.8, w * 0.45)),
          tea ? tin : red,
          s,
          pf.offsetM,
          TOP + 2.3,
        ).rotateX(0.12);
        for (const dx of [-1.25, 1.25]) {
          put(
            g,
            track,
            new THREE.BoxGeometry(0.08, 1.8, 0.08),
            wood,
            s + dx,
            pf.offsetM,
            TOP + 1.4,
          );
        }
        if (tea)
          put(
            g,
            track,
            new THREE.CylinderGeometry(0.18, 0.22, 0.4, 10),
            kettle,
            s - 0.6,
            pf.offsetM,
            TOP + 1.3,
          );
        else put(g, track, new THREE.BoxGeometry(2.0, 0.9, 0.3), cream, s, pf.offsetM, TOP + 1.6);
      }
      // Benches.
      for (
        let s = start + 30;
        s < start + st.platformLengthM - 20;
        s += size === 'halt' ? 120 : 60
      ) {
        put(g, track, new THREE.BoxGeometry(2.2, 0.08, 0.5), wood, s, pf.offsetM, TOP + 0.48);
        put(
          g,
          track,
          new THREE.BoxGeometry(2.2, 0.5, 0.08),
          wood,
          s,
          pf.offsetM + 0.25,
          TOP + 0.78,
        );
      }
      // Parcel trolleys at bigger stations.
      if (size !== 'halt') {
        put(
          g,
          track,
          new THREE.BoxGeometry(2.4, 0.15, 1.2),
          steel,
          start + 70 + pi * 40,
          pf.offsetM,
          TOP + 0.45,
        );
        put(
          g,
          track,
          new THREE.BoxGeometry(1.8, 0.7, 0.9),
          cream,
          start + 70 + pi * 40,
          pf.offsetM,
          TOP + 0.9,
        );
      }
    });
    if (size === 'junction' || size === 'terminus') {
      g.add(departureBoard(track, st, platforms[0]!.offsetM));
    }
    if (size === 'junction') footOverBridge(g, track, st, platforms, steel, cream);
    if (size === 'halt') strayDog(g, track, st, platforms[0]!.offsetM);
    mergeByMaterial(g);
    all.add(g);
  }
  return all;
}

function departureBoard(track: Track, st: Station, side: number): THREE.Mesh {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 96;
  const g = c.getContext('2d')!;
  g.fillStyle = '#101418';
  g.fillRect(0, 0, 256, 96);
  g.fillStyle = '#ffb341';
  g.font = 'bold 15px monospace';
  g.fillText('TRAIN          TO       PF  TIME', 8, 20);
  g.fillStyle = '#ffd27a';
  const rows = [
    ['GHAT EXP', 'MEGHGARH', '1', '06:03'],
    ['LOCAL', 'NAGARPUR', '2', '06:05'],
    ['PASSENGER', 'KHETPURA', '4', '06:12'],
  ];
  rows.forEach((r, i) => {
    g.fillText(`${r[0]!.padEnd(11)}${r[1]!.padEnd(10)}${r[2]!.padEnd(3)}${r[3]}`, 8, 44 + i * 20);
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 1.2, 3.2),
    new THREE.MeshStandardMaterial({ map: tex, emissive: 0x332200, emissiveMap: tex }),
  );
  const s = st.stopMarkM - st.platformLengthM * 0.55;
  frameAt(track, s, side, TOP + 3.4, board.position);
  board.quaternion.setFromAxisAngle(yAxis, headingAt(track, s));
  board.name = `board-${st.id}`;
  return board;
}

function footOverBridge(
  g: THREE.Group,
  track: Track,
  st: Station,
  platforms: readonly { offsetM: number; widthM: number }[],
  steel: THREE.Material,
  cream: THREE.Material,
): void {
  const s = st.stopMarkM - st.platformLengthM * 0.3;
  const lo = Math.min(...platforms.map((p) => p.offsetM));
  const hi = Math.max(...platforms.map((p) => p.offsetM));
  const deck = 7.8;
  put(g, track, new THREE.BoxGeometry(3.2, 0.4, hi - lo + 3), cream, s, (lo + hi) / 2, deck);
  for (const side of [-1, 1]) {
    put(
      g,
      track,
      new THREE.BoxGeometry(3.2, 1.2, hi - lo + 3),
      steel,
      s + side * 1.6,
      (lo + hi) / 2,
      deck + 0.8,
    ).scale.set(0.05, 1, 1);
  }
  for (const pf of platforms) {
    // Stair column down to each platform.
    put(
      g,
      track,
      new THREE.BoxGeometry(2.4, deck - TOP, 1.4),
      cream,
      s + 3,
      pf.offsetM,
      TOP + (deck - TOP) / 2,
    );
  }
}

function strayDog(g: THREE.Group, track: Track, st: Station, side: number): void {
  const fur = new THREE.MeshStandardMaterial({ color: 0xa0784a, roughness: 1 });
  const s = st.stopMarkM - 60;
  put(g, track, new THREE.BoxGeometry(0.7, 0.3, 0.25), fur, s, side + 0.5, TOP + 0.45);
  put(g, track, new THREE.BoxGeometry(0.25, 0.22, 0.2), fur, s + 0.42, side + 0.5, TOP + 0.62);
  for (const dx of [-0.25, 0.25])
    put(g, track, new THREE.BoxGeometry(0.08, 0.3, 0.2), fur, s + dx, side + 0.5, TOP + 0.15);
}

/** Junction-type route indicators on home signals with numbered platform routes. */
export class RouteIndicators {
  readonly root = new THREE.Group();
  private readonly items: { sig: SignalDef; arms: Map<number, THREE.Sprite[]> }[] = [];

  constructor(track: Track, net: RailNetwork, route: RouteDef) {
    const lamp = new THREE.SpriteMaterial({
      map: glowTexture(),
      color: 0xf4f6ff,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const back = new THREE.MeshStandardMaterial({ color: 0x111111 });
    for (const sig of route.signals) {
      if (sig.kind !== 'home' || !sig.stationId) continue;
      const loops = net.loopsAt(sig.stationId, 1).filter((l) => l.platform !== undefined);
      if (!loops.length) continue;
      const side = net.offsetAt('UP', sig.chainageM) - 3.2;
      const base = new THREE.Vector3();
      frameAt(track, sig.chainageM, side, 7.4, base);
      const h = headingAt(track, sig.chainageM);
      const right = new THREE.Vector3(Math.sin(h), 0, Math.cos(h));
      const arms = new Map<number, THREE.Sprite[]>();
      loops.forEach((l, i) => {
        // Arm i+1 leans left at 45° and 30° above horizontal (game convention).
        const angle = i === 0 ? Math.PI / 4 : Math.PI / 6;
        const lamps: THREE.Sprite[] = [];
        for (let k = 1; k <= 5; k++) {
          const sp = new THREE.Sprite(lamp);
          sp.scale.setScalar(0.45);
          sp.position.copy(base).addScaledVector(right, -Math.cos(angle) * k * 0.32);
          sp.position.y += Math.sin(angle) * k * 0.32;
          sp.visible = false;
          lamps.push(sp);
          this.root.add(sp);
        }
        arms.set(l.platform!, lamps);
      });
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 1.8), back);
      plate.position.copy(base).addScaledVector(right, -0.7);
      plate.position.y += 0.5;
      plate.quaternion.setFromAxisAngle(yAxis, h);
      this.root.add(plate);
      this.items.push({ sig, arms });
    }
  }

  update(sim: Sim): void {
    for (const it of this.items) {
      const platform = sim.routeIndicator(it.sig);
      for (const [p, lamps] of it.arms) for (const l of lamps) l.visible = p === platform;
    }
  }
}
