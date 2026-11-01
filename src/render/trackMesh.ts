import * as THREE from 'three';
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

const tmp = newSample();

/** World position offset sideways from the centre-line (+right of travel direction). */
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

/** Extrude a cross-section profile [side, up][] along the track into one mesh. */
function extrude(
  track: Track,
  profile: [number, number][],
  material: THREE.Material,
  uvScaleV = 1,
): THREE.Mesh {
  const rows = Math.floor(track.length / STEP_M) + 1;
  const cols = profile.length;
  const pos = new Float32Array(rows * cols * 3);
  const uv = new Float32Array(rows * cols * 2);
  const v = new THREE.Vector3();
  for (let r = 0; r < rows; r++) {
    const s = Math.min(track.length, r * STEP_M);
    for (let c = 0; c < cols; c++) {
      const [side, up] = profile[c]!;
      frameAt(track, s, side, up, v);
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

export function buildTrack(track: Track): THREE.Group {
  const group = new THREE.Group();
  group.name = 'track';

  const hb = BALLAST_BOTTOM_W / 2;
  const ht = BALLAST_TOP_W / 2;
  const ballastMat = new THREE.MeshStandardMaterial({ map: ballastTexture(), roughness: 1 });
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
      2.5,
    ),
  );

  const railMat = new THREE.MeshStandardMaterial({
    color: 0x8c8f94,
    metalness: 0.85,
    roughness: 0.35,
  });
  const top = BALLAST_H + 0.18;
  for (const sign of [-1, 1]) {
    const x = (sign * GAUGE_M) / 2;
    const w = RAIL_HEAD_W / 2;
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
      ),
    );
  }

  // Concrete sleepers, instanced.
  const count = Math.floor(track.length / SLEEPER_SPACING_M);
  const sleeper = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.25, 0.2, 2.75),
    new THREE.MeshStandardMaterial({ color: 0xa39f96, roughness: 0.95 }),
    count,
  );
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const scale = new THREE.Vector3(1, 1, 1);
  const p = new THREE.Vector3();
  const yAxis = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < count; i++) {
    const s = i * SLEEPER_SPACING_M;
    frameAt(track, s, 0, BALLAST_H + 0.08, p);
    q.setFromAxisAngle(yAxis, headingAt(track, s));
    sleeper.setMatrixAt(i, m.compose(p, q, scale));
  }
  sleeper.receiveShadow = true;
  group.add(sleeper);

  group.add(buildOhe(track));
  return group;
}

/** Overhead equipment: masts with cantilevers and a contact wire (25 kV AC electrified look). */
function buildOhe(track: Track): THREE.Group {
  const g = new THREE.Group();
  const count = Math.floor(track.length / OHE_SPACING_M) + 1;
  const steel = new THREE.MeshStandardMaterial({ color: 0x5d6166, metalness: 0.6, roughness: 0.6 });
  const mast = new THREE.InstancedMesh(new THREE.BoxGeometry(0.3, 8.5, 0.3), steel, count);
  const arm = new THREE.InstancedMesh(new THREE.BoxGeometry(0.08, 0.08, 4.2), steel, count);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const one = new THREE.Vector3(1, 1, 1);
  const p = new THREE.Vector3();
  const yAxis = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < count; i++) {
    const s = Math.min(track.length, i * OHE_SPACING_M);
    q.setFromAxisAngle(yAxis, headingAt(track, s));
    frameAt(track, s, 3.6, 4.25, p);
    mast.setMatrixAt(i, m.compose(p, q, one));
    frameAt(track, s, 1.6, 7.6, p);
    arm.setMatrixAt(i, m.compose(p, q, one));
  }
  mast.castShadow = true;
  g.add(mast, arm);

  const pts: THREE.Vector3[] = [];
  for (let s = 0; s <= track.length; s += 10) pts.push(frameAt(track, s, 0, 6.2));
  const wire = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: 0x2a2a2a }),
  );
  const catenary = wire.clone();
  catenary.position.y = 1.1;
  g.add(wire, catenary);
  return g;
}

export type { TrackSample };
