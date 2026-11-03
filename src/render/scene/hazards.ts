// Scenario hazards on the line: the cattle of the "animals near the line" incident. A small
// herd stands on the track bed near the crossing while the incident is active and wanders off
// to the left as the train closes in. Procedural, original.
import * as THREE from 'three';
import type { Sim } from '../../sim/sim';
import type { Track } from '../../sim/track/track';
import { mergeByMaterial } from '../merge';
import { frameAt, headingAt } from '../trackMesh';

const yAxis = new THREE.Vector3(0, 1, 0);
/** The herd starts moving off when the train is this close (m), and is clear after MOVE_M more. */
const MOVE_FROM_M = 160;
const MOVE_M = 90;

function cow(brown: number): THREE.Group {
  const g = new THREE.Group();
  const hide = new THREE.MeshStandardMaterial({ color: brown, roughness: 1 });
  const pale = new THREE.MeshStandardMaterial({ color: 0xe8dfcf, roughness: 1 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x3a2a20, roughness: 1 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.95, 0.7), hide);
  body.position.set(0, 1.05, 0);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.45, 0.4), pale);
  head.position.set(1.25, 1.25, 0);
  const hump = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.5), hide);
  hump.position.set(0.5, 1.7, 0);
  g.add(body, head, hump);
  for (const x of [-0.75, 0.75]) {
    for (const z of [-0.22, 0.22]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.6, 0.16), dark);
      leg.position.set(x, 0.3, z);
      g.add(leg);
    }
  }
  mergeByMaterial(g);
  return g;
}

export class Hazards {
  readonly root = new THREE.Group();
  private readonly cows: { g: THREE.Group; ds: number; side: number; yaw: number }[] = [];

  constructor(private readonly track: Track) {
    this.root.name = 'hazards';
    const layout: [number, number, number][] = [
      [-8, -2.4, 1.6],
      [-1, -3.0, 0.3],
      [6, -2.2, 2.4],
      [13, -3.4, 1.0],
    ];
    layout.forEach(([ds, side, yaw], i) => {
      const g = cow(i % 2 ? 0x7a5a3a : 0xb0865a);
      g.visible = false;
      this.cows.push({ g, ds, side, yaw });
      this.root.add(g);
    });
  }

  update(sim: Sim): void {
    const h = sim.incidents.find((i) => i.hazard?.active)?.hazard;
    for (const c of this.cows) {
      c.g.visible = !!h;
      if (!h) continue;
      const dist = h.s - sim.train.s;
      const away = Math.min(1, Math.max(0, (MOVE_FROM_M - dist) / MOVE_M));
      const eased = away * away * (3 - 2 * away);
      const s = h.s + c.ds;
      const side = sim.net.offsetAt('UP', s) + c.side - eased * (10 + Math.abs(c.ds));
      frameAt(this.track, s, side, 0.3, c.g.position);
      c.g.quaternion.setFromAxisAngle(yAxis, headingAt(this.track, s) + c.yaw);
    }
  }
}
