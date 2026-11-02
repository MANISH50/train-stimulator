// Landmark structures from a route's scene script, all procedural:
// - river bridge: open-web steel girder spans on concrete piers (61 m spans: one of the RDSO
//   standard girder lengths, docs/research/05);
// - viaduct: masonry piers and arches across a deep valley;
// - tunnel: an arched lining following the curve, with stone portals;
// - level crossing: road, barrier booms and a short queue of road vehicles.
import * as THREE from 'three';
import type { RailNetwork } from '../../sim/track/network';
import type { Track } from '../../sim/track/track';
import type { Landmark } from '../../sim/world/zones';
import { mergeByMaterial } from '../merge';
import { frameAt, headingAt } from '../trackMesh';

const SPAN_M = 61;
const yAxis = new THREE.Vector3(0, 1, 0);

export function buildLandmarks(
  track: Track,
  net: RailNetwork,
  landmarks: readonly Landmark[],
  heightAt: (s: number, side: number) => number,
): THREE.Group {
  const g = new THREE.Group();
  g.name = 'landmarks';
  const steel = new THREE.MeshStandardMaterial({
    color: 0x5b6670,
    metalness: 0.5,
    roughness: 0.55,
  });
  const concrete = new THREE.MeshStandardMaterial({ color: 0xa8a294, roughness: 0.9 });
  const stone = new THREE.MeshStandardMaterial({ color: 0x8a7f6c, roughness: 0.95 });
  const lining = new THREE.MeshStandardMaterial({
    color: 0x3b3934,
    roughness: 1,
    side: THREE.DoubleSide,
  });
  const lines = ['UP', 'DN'].filter((l) => net.has(l));
  for (const lm of landmarks) {
    const part = new THREE.Group();
    switch (lm.kind) {
      case 'river-bridge':
        for (const line of lines)
          girderBridge(part, track, lm, (s) => net.offsetAt(line, s), steel);
        piers(part, track, lm, SPAN_M, -12, 3.2, 9.5, concrete);
        break;
      case 'viaduct':
        viaduct(part, track, lm, heightAt, stone);
        break;
      case 'tunnel':
        tunnel(part, track, lm, lining, stone);
        break;
      case 'level-crossing':
        levelCrossing(part, track, lm);
        break;
    }
    mergeByMaterial(part);
    g.add(part);
  }
  return g;
}

function boxAt(
  parent: THREE.Group,
  track: Track,
  s: number,
  side: number,
  up: number,
  size: [number, number, number],
  mat: THREE.Material,
  tiltZ = 0,
): void {
  const m = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
  frameAt(track, s, side, up, m.position);
  m.quaternion.setFromAxisAngle(yAxis, headingAt(track, s));
  if (tiltZ) m.rotateZ(tiltZ);
  parent.add(m);
}

/** Through-girder spans: two trusses either side of the track with diagonals. */
function girderBridge(
  g: THREE.Group,
  track: Track,
  lm: Landmark,
  offset: (s: number) => number,
  steel: THREE.Material,
): void {
  const len = lm.toM - lm.fromM;
  const spans = Math.max(1, Math.round(len / SPAN_M));
  const span = len / spans;
  const H = 6.5;
  for (let k = 0; k < spans; k++) {
    const a = lm.fromM + k * span;
    for (const side of [-2.4, 2.4]) {
      for (let s = a; s < a + span - 0.1; s += 5) {
        const mid = s + 2.5;
        const y = offset(mid) + side;
        boxAt(g, track, mid, y, 0.2, [5.05, 0.5, 0.4], steel);
        boxAt(g, track, mid, y, H, [5.05, 0.5, 0.4], steel);
        boxAt(g, track, s, y, H / 2, [0.3, H, 0.3], steel);
        const up = ((s - a) / 5) % 2 < 1 ? 1 : -1;
        boxAt(
          g,
          track,
          mid,
          y,
          H / 2,
          [Math.hypot(5, H), 0.25, 0.25],
          steel,
          up * Math.atan2(H, 5),
        );
      }
    }
    // Cross bracing over the top.
    for (let s = a + 5; s < a + span; s += 10) {
      boxAt(g, track, s, offset(s), H, [0.3, 0.3, 5.1], steel);
    }
  }
}

function piers(
  g: THREE.Group,
  track: Track,
  lm: Landmark,
  every: number,
  depth: number,
  width: number,
  length: number,
  mat: THREE.Material,
): void {
  const len = lm.toM - lm.fromM;
  const n = Math.max(1, Math.round(len / every));
  for (let k = 0; k <= n; k++) {
    const s = lm.fromM + (k * len) / n;
    const h = -depth + 1;
    boxAt(g, track, s, 0, -h / 2 - 0.6, [width, h, length], mat);
  }
}

/** Masonry viaduct: tapering piers every 20 m and arch rings between them. */
function viaduct(
  g: THREE.Group,
  track: Track,
  lm: Landmark,
  heightAt: (s: number, side: number) => number,
  stone: THREE.Material,
): void {
  const bay = 20;
  for (let s = lm.fromM; s <= lm.toM + 0.1; s += bay) {
    const ground = Math.min(-2, heightAt(s, 0));
    const h = -ground;
    const pier = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.4, h, 4, 1), stone);
    frameAt(track, s, 0, -h / 2 - 0.7, pier.position);
    pier.quaternion.setFromAxisAngle(yAxis, headingAt(track, s) + Math.PI / 4);
    pier.scale.set(1, 1, 2.6);
    g.add(pier);
  }
  for (let s = lm.fromM; s < lm.toM - 0.1; s += bay) {
    const mid = s + bay / 2;
    const arch = new THREE.Mesh(new THREE.TorusGeometry(bay / 2 - 1.6, 1.1, 6, 14, Math.PI), stone);
    frameAt(track, mid, 0, -bay / 2 + 0.2, arch.position);
    arch.quaternion.setFromAxisAngle(yAxis, headingAt(track, mid));
    arch.scale.set(1, 1, 8);
    g.add(arch);
    // Spandrel deck the track sits on.
    boxAt(g, track, mid, 0, -0.9, [bay + 0.05, 1.4, 12], stone);
  }
}

/** Arched lining following the alignment, plus portals at both ends. */
function tunnel(
  g: THREE.Group,
  track: Track,
  lm: Landmark,
  lining: THREE.Material,
  stone: THREE.Material,
): void {
  const R = 7.6;
  const seg = 12;
  const step = 5;
  const rows = Math.ceil((lm.toM - lm.fromM) / step) + 1;
  const pos: number[] = [];
  const idx: number[] = [];
  const p = new THREE.Vector3();
  for (let r = 0; r < rows; r++) {
    const s = Math.min(lm.toM, lm.fromM + r * step);
    for (let k = 0; k <= seg; k++) {
      const a = (k / seg) * Math.PI;
      frameAt(track, s, Math.cos(a) * R, Math.sin(a) * (R - 0.5) + 0.3, p);
      pos.push(p.x, p.y, p.z);
    }
  }
  for (let r = 0; r < rows - 1; r++) {
    for (let k = 0; k < seg; k++) {
      const a = r * (seg + 1) + k;
      const b = a + seg + 1;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  g.add(new THREE.Mesh(geo, lining));
  // Portals: a stone face with an arched opening.
  const face = new THREE.Shape();
  face.moveTo(-14, -1);
  face.lineTo(14, -1);
  face.lineTo(14, 15);
  face.lineTo(-14, 15);
  face.lineTo(-14, -1);
  const hole = new THREE.Path();
  hole.moveTo(-R, 0);
  hole.absarc(0, 0.3, R, Math.PI, 0, true);
  hole.lineTo(R, -1);
  hole.lineTo(-R, -1);
  face.holes.push(hole);
  const portalGeo = new THREE.ExtrudeGeometry(face, { depth: 2.5, bevelEnabled: false });
  for (const s of [lm.fromM, lm.toM]) {
    const portal = new THREE.Mesh(portalGeo, stone);
    frameAt(track, s, 0, 0, portal.position);
    portal.quaternion.setFromAxisAngle(yAxis, headingAt(track, s) + Math.PI / 2);
    portal.translateZ(-1.25);
    g.add(portal);
  }
}

/** Road over the line with barrier booms raised clear and vehicles waiting either side. */
function levelCrossing(g: THREE.Group, track: Track, lm: Landmark): void {
  const s = (lm.fromM + lm.toM) / 2;
  const road = new THREE.MeshStandardMaterial({ color: 0x4a4a48, roughness: 1 });
  const red = new THREE.MeshStandardMaterial({ color: 0xc62d2d });
  const white = new THREE.MeshStandardMaterial({ color: 0xf0f0f0 });
  boxAt(g, track, s, 0, 0.05, [lm.toM - lm.fromM, 0.1, 160], road);
  for (const side of [-1, 1]) {
    const y = side * 11;
    boxAt(g, track, s - side * 8, y, 0.6, [0.4, 1.2, 0.4], white);
    // Boom lowered across the road (the train is approaching).
    for (let k = 0; k < 4; k++) {
      boxAt(g, track, s - side * (6 - k * 1.6), y, 1.1, [1.6, 0.15, 0.15], k % 2 ? white : red);
    }
    // Waiting road vehicles: a bus, a car, an auto-rickshaw-like three-wheeler, a tractor.
    const colours = [0xd9a13a, 0x9a3a2a, 0x2f6a3a, 0x3a5a9a];
    const sizes: [number, number, number][] = [
      [2.6, 3.0, 10],
      [1.8, 1.5, 4.2],
      [1.4, 1.7, 2.6],
      [2.0, 2.2, 3.6],
    ];
    sizes.forEach((sz, i) => {
      const mat = new THREE.MeshStandardMaterial({ color: colours[i] });
      boxAt(
        g,
        track,
        s + side * 1.8,
        side * (16 + i * 8 + sz[2] / 2),
        sz[1] / 2 + 0.4,
        [sz[0], sz[1], sz[2]],
        mat,
      );
    });
  }
}
