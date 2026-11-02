// Draws station crowds from the sim (src/sim/station/crowd.ts): one instanced body mesh and
// one instanced head mesh for every visible agent, a walking bob, and waving. Agents beyond
// CROWD_VIEW_M from the camera are skipped; the quality preset caps how many are drawn.
import * as THREE from 'three';
import type { Agent, Crowds } from '../../sim/station/crowd';
import type { Track } from '../../sim/track/track';
import type { QualityName } from '../quality';
import { frameAt } from '../trackMesh';

const PLATFORM_TOP = 0.84;
const CROWD_VIEW_M = 320;
const MAX_DRAWN: Record<QualityName, number> = { low: 160, medium: 400, high: 700 };

/** Clothing palettes (original choices): bright everyday colours for passengers. */
const PASSENGER = [
  0xd94f4f, 0xe8a33d, 0x3f7fbf, 0x2f9e6e, 0xb04fae, 0xf2f2ee, 0x6a4c9c, 0xe2c84a, 0x4b4b4b,
  0xc76e2e,
];
const KIND_COLOUR = {
  porter: 0xb3261e, // red uniform (docs/IMMERSION_IDEAS.md, station life)
  police: 0x8b7d4f,
  staff: 0x243a6a,
  vendor: 0xe0d6c0,
} as const;
const SKIN = [0x8d5a3b, 0xa86f4c, 0x6e4430, 0xb98563, 0x5c3a28];

export class CrowdView {
  readonly root = new THREE.Group();
  private readonly bodies: THREE.InstancedMesh;
  private readonly heads: THREE.InstancedMesh;
  private readonly m = new THREE.Matrix4();
  private readonly p = new THREE.Vector3();
  private readonly q = new THREE.Quaternion();
  private readonly sc = new THREE.Vector3();
  private readonly c = new THREE.Color();
  private max: number;

  constructor(quality: QualityName) {
    this.max = MAX_DRAWN[quality];
    const cap = MAX_DRAWN.high;
    const body = new THREE.CylinderGeometry(0.2, 0.26, 1.15, 7).translate(0, 0.62, 0);
    const head = new THREE.SphereGeometry(0.14, 8, 6).translate(0, 1.36, 0);
    this.bodies = new THREE.InstancedMesh(
      body,
      new THREE.MeshStandardMaterial({ roughness: 0.8 }),
      cap,
    );
    this.heads = new THREE.InstancedMesh(
      head,
      new THREE.MeshStandardMaterial({ roughness: 0.7 }),
      cap,
    );
    for (const mesh of [this.bodies, this.heads]) {
      mesh.count = 0;
      mesh.frustumCulled = false;
      for (let i = 0; i < cap; i++) mesh.setColorAt(i, this.c.set(0xffffff));
    }
    this.bodies.castShadow = true;
    this.root.name = 'crowds';
    this.root.add(this.bodies, this.heads);
  }

  setQuality(q: QualityName): void {
    this.max = MAX_DRAWN[q];
  }

  update(track: Track, crowds: Crowds, cameraS: number, timeS: number): void {
    let n = 0;
    for (const st of crowds.stations) {
      if (Math.abs(st.station.stopMarkM - cameraS) > CROWD_VIEW_M + st.station.platformLengthM)
        continue;
      for (const a of st.agents) {
        if (n >= this.max) break;
        if (a.state === 'gone' || Math.abs(a.s - cameraS) > CROWD_VIEW_M) continue;
        this.place(track, a, timeS, n++);
      }
    }
    this.bodies.count = n;
    this.heads.count = n;
    for (const mesh of [this.bodies, this.heads]) {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  }

  private place(track: Track, a: Agent, timeS: number, i: number): void {
    const walking =
      a.state === 'mill' ||
      a.state === 'queue' ||
      a.state === 'board' ||
      a.state === 'alight' ||
      a.state === 'leave' ||
      a.state === 'run';
    const moving = walking && (Math.abs(a.ts - a.s) > 0.05 || Math.abs(a.ty - a.y) > 0.05);
    let bob = moving ? Math.abs(Math.sin(a.phase * 6)) * (a.state === 'run' ? 0.12 : 0.05) : 0;
    if (a.state === 'wave') bob = Math.abs(Math.sin(timeS * 7 + a.look * 10)) * 0.18; // little hops while waving
    const height = 0.88 + a.look * 0.22;
    frameAt(track, a.s, a.y, PLATFORM_TOP + bob, this.p);
    this.q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, a.look * Math.PI * 2);
    this.m.compose(this.p, this.q, this.sc.set(1, height, 1));
    this.bodies.setMatrixAt(i, this.m);
    this.heads.setMatrixAt(i, this.m);
    const kind = a.kind;
    const colour =
      kind === 'passenger' ? PASSENGER[Math.floor(a.look * PASSENGER.length)]! : KIND_COLOUR[kind];
    this.bodies.setColorAt(i, this.c.setHex(colour));
    this.heads.setColorAt(i, this.c.setHex(SKIN[Math.floor(a.look * 37) % SKIN.length]!));
  }

  dispose(): void {
    for (const mesh of [this.bodies, this.heads]) {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
  }
}
