import * as THREE from 'three';
import type { RailNetwork } from '../sim/track/network';
import { Track, newSample, type TrackSample } from '../sim/track/track';
import { ballastTexture } from './textures';

/** Broad gauge, 1676 mm between rails. */
export const GAUGE_M = 1.676;
const RAIL_HEAD_W = 0.07;
const RAIL_H = 0.16;
const BALLAST_TOP_W = 3.4;
const BALLAST_BOTTOM_W = 5.6;
const BALLAST_H = 0.45;
const SLEEPER_SPACING_M = 0.65;
const OHE_SPACING_M = 60;
const STEP_M = 2;

export type OffsetFn = (s: number) => number;

const tmp = newSample();

/** World position offset sideways from the centre-line (+right of increasing chainage). */
export function frameAt(
  track: Track,
  s: number,
  side: number,
  up: number,
  out = new THREE.Vector3(),
): THREE.Vector3 {
  const p = track.sample(s, tmp);
  // Tangent (cos h, 0, -sin h); right of travel = tangent × up = (sin h, 0, cos h).
  return out.set(p.x + Math.sin(p.heading) * side, p.y + up, p.z + Math.cos(p.heading) * side);
}

export function headingAt(track: Track, s: number): number {
  return track.sample(s, tmp).heading;
}

/** Extrude a cross-section profile [side, up][] along a line into one mesh. */
function extrude(
  track: Track,
  profile: [number, number][],
  material: THREE.Material,
  offset: OffsetFn,
  fromM: number,
  toM: number,
  uvScaleV = 1,
): THREE.Mesh {
  const rows = Math.max(2, Math.floor((toM - fromM) / STEP_M) + 1);
  const cols = profile.length;
  const pos = new Float32Array(rows * cols * 3);
  const uv = new Float32Array(rows * cols * 2);
  const v = new THREE.Vector3();
  for (let r = 0; r < rows; r++) {
    const s = Math.min(toM, fromM + r * STEP_M);
    const off = offset(s);
    for (let c = 0; c < cols; c++) {
      const [side, up] = profile[c]!;
      frameAt(track, s, side + off, up, v);
      const i = (r * cols + c) * 3;
      pos[i] = v.x;
      pos[i + 1] = v.y;
      pos[i + 2] = v.z;
      uv[(r * cols + c) * 2] = c / (cols - 1);
      uv[(r * cols + c) * 2 + 1] = (s / 100) * uvScaleV;
    }
  }
  const index: number[] = [];
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const a = r * cols + c;
      const b = a + cols;
      index.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(index);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, material);
  mesh.receiveShadow = true;
  return mesh;
}

export function buildTrack(track: Track, net: RailNetwork): THREE.Group {
  const group = new THREE.Group();
  group.name = 'track';

  const hb = BALLAST_BOTTOM_W / 2;
  const ht = BALLAST_TOP_W / 2;
  const ballastMat = new THREE.MeshStandardMaterial({ map: ballastTexture(), roughness: 1 });
  const railMat = new THREE.MeshStandardMaterial({
    color: 0x8c8f94,
    metalness: 0.85,
    roughness: 0.35,
  });
  const top = BALLAST_H + 0.18;
  const w = RAIL_HEAD_W / 2;

  let sleeperCount = 0;
  for (const line of net.lines)
    sleeperCount += Math.floor((line.toM - line.fromM) / SLEEPER_SPACING_M);
  const sleepers = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.25, 0.2, 2.75),
    new THREE.MeshStandardMaterial({ color: 0xa39f96, roughness: 0.95 }),
    sleeperCount,
  );
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const scale = new THREE.Vector3(1, 1, 1);
  const p = new THREE.Vector3();
  const yAxis = new THREE.Vector3(0, 1, 0);
  let n = 0;

  for (const line of net.lines) {
    const off: OffsetFn = (s) => net.offsetAt(line.id, s);
    group.add(
      extrude(
        track,
        [
          [-hb - 1.5, -0.05],
          [-hb, 0],
          [-ht, BALLAST_H],
          [ht, BALLAST_H],
          [hb, 0],
          [hb + 1.5, -0.05],
        ],
        ballastMat,
        off,
        line.fromM,
        line.toM,
        2.5,
      ),
    );
    for (const sign of [-1, 1]) {
      const x = (sign * GAUGE_M) / 2;
      group.add(
        extrude(
          track,
          [
            [x - w, top],
            [x - w, top + RAIL_H],
            [x + w, top + RAIL_H],
            [x + w, top],
          ],
          railMat,
          off,
          line.fromM,
          line.toM,
        ),
      );
    }
    const count = Math.floor((line.toM - line.fromM) / SLEEPER_SPACING_M);
    for (let i = 0; i < count; i++) {
      const s = line.fromM + i * SLEEPER_SPACING_M;
      frameAt(track, s, off(s), BALLAST_H + 0.08, p);
      // Sleepers stay square to the line, including through a loop's diverging S-curve.
      const slope = (off(s + 1) - off(s - 1)) / 2;
      q.setFromAxisAngle(yAxis, headingAt(track, s) - Math.atan(slope));
      sleepers.setMatrixAt(n++, m.compose(p, q, scale));
    }
  }
  sleepers.receiveShadow = true;
  group.add(sleepers);
  group.add(buildOhe(track, net));
  return group;
}

/** Overhead equipment: masts outside the outermost lines, a contact wire over each line. */
function buildOhe(track: Track, net: RailNetwork): THREE.Group {
  const g = new THREE.Group();
  const count = Math.floor(track.length / OHE_SPACING_M) + 1;
  const steel = new THREE.MeshStandardMaterial({ color: 0x5d6166, metalness: 0.6, roughness: 0.6 });
  const mast = new THREE.InstancedMesh(new THREE.BoxGeometry(0.3, 8.5, 0.3), steel, count * 2);
  const arm = new THREE.InstancedMesh(new THREE.BoxGeometry(0.08, 0.08, 1), steel, count * 2);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const one = new THREE.Vector3(1, 1, 1);
  const armScale = new THREE.Vector3(1, 1, 1);
  const p = new THREE.Vector3();
  const yAxis = new THREE.Vector3(0, 1, 0);
  let n = 0;
  for (let i = 0; i < count; i++) {
    const s = Math.min(track.length, i * OHE_SPACING_M);
    let lo = Infinity;
    let hi = -Infinity;
    for (const line of net.lines) {
      if (s < line.fromM || s > line.toM) continue;
      const o = net.offsetAt(line.id, s);
      lo = Math.min(lo, o);
      hi = Math.max(hi, o);
    }
    q.setFromAxisAngle(yAxis, headingAt(track, s));
    const span = hi - lo;
    for (const [mastSide, armCentre] of [
      [lo - 3.4, lo - 3.4 + (span / 2 + 3.4) / 2],
      [hi + 3.4, hi + 3.4 - (span / 2 + 3.4) / 2],
    ] as const) {
      frameAt(track, s, mastSide, 4.25, p);
      mast.setMatrixAt(n, m.compose(p, q, one));
      frameAt(track, s, armCentre, 7.6, p);
      armScale.set(1, 1, span / 2 + 3.4);
      arm.setMatrixAt(n, m.compose(p, q, armScale));
      n++;
    }
  }
  mast.castShadow = true;
  g.add(mast, arm);

  const wireMat = new THREE.LineBasicMaterial({ color: 0x2a2a2a });
  for (const line of net.lines) {
    const pts: THREE.Vector3[] = [];
    for (let s = line.fromM; s <= line.toM; s += 10) {
      pts.push(frameAt(track, s, net.offsetAt(line.id, s), 6.2));
    }
    const wire = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wireMat);
    const catenary = wire.clone();
    catenary.position.y = 1.1;
    g.add(wire, catenary);
  }
  return g;
}

export type { TrackSample };
