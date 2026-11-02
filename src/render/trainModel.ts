// Procedural low-poly trains with original liveries: electric, diesel and EMU power units,
// coaches, EMU cars and open goods wagons. Vehicles of the rake are instanced (one draw call
// for all bodies, one for all bogies) so long goods trains stay cheap.
import * as THREE from 'three';
import type { CrashBody } from '../sim/crash/crashSim';
import type { Consist } from '../sim/physics/forces';
import type { Track } from '../sim/track/track';
import type { Dir, Livery } from '../sim/types';
import { CAB_EYE, CabInterior } from './cabInterior';
import { bodyMatrix } from './crash/pose';
import { mergeByMaterial } from './merge';
import {
  coachSideTexture,
  emuSideTexture,
  glowTexture,
  locoSideTexture,
  wagonSideTexture,
} from './textures';
import { frameAt, type OffsetFn } from './trackMesh';

const RAIL_TOP = 0.79;
const BODY_W = 3.2;
const yAxis = new THREE.Vector3(0, 1, 0);
/** Wrecked bodies darken toward this colour with damage. */
const SCORCH = new THREE.Color(0x2b2622);

export type LocoStyle = 'electric' | 'diesel' | 'emu';
export type RakeStyle = 'coach' | 'emu' | 'wagon';

export interface TrainLook {
  loco: LocoStyle;
  rake: RakeStyle;
  livery: Livery;
  locoLivery: Livery;
  /** Player's train: driver's cab interior and a real headlight. */
  isPlayer: boolean;
  number?: string;
}

interface Placement {
  offsetM: number;
  halfLengthM: number;
}

export class TrainModel {
  readonly root = new THREE.Group();
  readonly headlight: THREE.SpotLight | null = null;
  readonly cab: CabInterior | null = null;
  private readonly loco = new THREE.Group();
  private readonly exterior: THREE.Group;
  private readonly bodies: THREE.InstancedMesh;
  private readonly bogies: THREE.InstancedMesh;
  private readonly rakePlacements: Placement[] = [];
  private readonly locoPlacement: Placement;
  private readonly a = new THREE.Vector3();
  private readonly b = new THREE.Vector3();
  private readonly q = new THREE.Quaternion();
  private readonly e = new THREE.Euler(0, 0, 0, 'YZX');
  private readonly m = new THREE.Matrix4();
  private readonly one = new THREE.Vector3(1, 1, 1);
  private readonly bogieOffsetM: number;
  private readonly white = new THREE.Color(0xffffff);
  private readonly tint = new THREE.Color();
  private locoMats: { mat: THREE.MeshStandardMaterial; base: THREE.Color }[] | null = null;
  private readonly hidden = new THREE.Matrix4().makeScale(0, 0, 0);
  private readonly vPos = new THREE.Vector3();
  private readonly vQuat = new THREE.Quaternion();
  private readonly vScale = new THREE.Vector3();

  constructor(consist: Consist, look: TrainLook) {
    this.root.name = 'train';
    const { loco, rake } = consist;

    this.exterior = buildLoco(loco.lengthM, look);
    this.loco.add(this.exterior);
    if (look.isPlayer) {
      this.cab = new CabInterior();
      this.cab.root.visible = false;
      this.loco.add(this.cab.root);
      this.headlight = new THREE.SpotLight(0xfff3d6, 0, 450, Math.PI / 10, 0.5, 1.1);
      this.headlight.position.set(loco.lengthM / 2, RAIL_TOP + 3.0, 0);
      this.headlight.target.position.set(loco.lengthM / 2 + 60, 0, 0);
      this.loco.add(this.headlight, this.headlight.target);
    }
    this.root.add(this.loco);
    this.locoPlacement = { offsetM: loco.lengthM / 2, halfLengthM: loco.lengthM / 2 };

    const len = rake.vehicleLengthM;
    const { geo, mats, bogieOffset } = rakeBody(look, len);
    this.bogieOffsetM = bogieOffset;
    this.bodies = new THREE.InstancedMesh(geo, mats, rake.vehicles);
    this.bodies.castShadow = true;
    this.bogies = new THREE.InstancedMesh(
      new THREE.BoxGeometry(look.rake === 'wagon' ? 2.0 : 3.0, 0.8, 2.4),
      new THREE.MeshStandardMaterial({ color: 0x1e1e1e, roughness: 0.8 }),
      rake.vehicles * 2,
    );
    // Instances move every frame; their bounds are refreshed in update().
    this.bodies.frustumCulled = false;
    this.bogies.frustumCulled = false;
    for (let i = 0; i < rake.vehicles; i++) this.bodies.setColorAt(i, this.white);
    for (let i = 0; i < rake.vehicles; i++) {
      this.rakePlacements.push({ offsetM: loco.lengthM + len * (i + 0.5), halfLengthM: len / 2 });
    }
    this.root.add(this.bodies, this.bogies);
  }

  /** Inside the cab the exterior body is hidden and the interior with its console shown. */
  setCabView(on: boolean): void {
    this.exterior.visible = !on;
    if (this.cab) this.cab.root.visible = on;
  }

  /**
   * Place every vehicle for a train whose front is at chainage `frontS`, travelling `dir`,
   * with `offset(s)` giving its line's lateral position.
   */
  update(track: Track, frontS: number, dir: Dir, offset: OffsetFn): void {
    this.loco.scale.set(1, 1, 1);
    this.place(track, frontS, dir, offset, this.locoPlacement);
    this.loco.position.copy(this.tmpPos);
    this.loco.quaternion.copy(this.q);
    this.rakePlacements.forEach((p, i) => {
      this.place(track, frontS, dir, offset, p);
      this.bodies.setMatrixAt(i, this.m.compose(this.tmpPos, this.q, this.one));
      for (const [k, sign] of [
        [0, 1],
        [1, -1],
      ] as const) {
        this.bogiePos
          .set(sign * this.bogieOffsetM, 0, 0)
          .applyQuaternion(this.q)
          .add(this.tmpPos);
        this.bogies.setMatrixAt(i * 2 + k, this.m.compose(this.bogiePos, this.q, this.one));
      }
    });
    this.bodies.instanceMatrix.needsUpdate = true;
    this.bogies.instanceMatrix.needsUpdate = true;
  }

  /**
   * Draw the train as wreckage from crash-sim bodies (index 0 = loco). Bogies follow their
   * vehicle until they break away, then their own bodies.
   */
  updateCrashed(
    track: Track,
    bodies: readonly CrashBody[],
    bogies: readonly (CrashBody | null)[],
  ): void {
    const loco = bodies[0];
    if (loco) {
      bodyMatrix(track, loco, this.m);
      this.m.decompose(this.loco.position, this.loco.quaternion, this.loco.scale);
      this.tintLoco(loco.damage);
    }
    this.rakePlacements.forEach((_, i) => {
      const b = bodies[i + 1];
      if (!b) return;
      bodyMatrix(track, b, this.m);
      this.bodies.setMatrixAt(i, this.m);
      this.bodies.setColorAt(i, this.tint.copy(this.white).lerp(SCORCH, b.damage * 0.75));
      this.m.decompose(this.vPos, this.vQuat, this.vScale);
      for (const k of [0, 1] as const) {
        const loose = bogies[(i + 1) * 2 + k];
        if (loose) {
          bodyMatrix(track, loose, this.m);
        } else if (b.bogiesOff) {
          this.m.copy(this.hidden);
        } else {
          this.bogiePos
            .set((k === 0 ? 1 : -1) * this.bogieOffsetM, 0, 0)
            .applyQuaternion(this.vQuat)
            .add(this.vPos);
          this.m.compose(this.bogiePos, this.vQuat, this.one);
        }
        this.bogies.setMatrixAt(i * 2 + k, this.m);
      }
    });
    this.bodies.instanceMatrix.needsUpdate = true;
    if (this.bodies.instanceColor) this.bodies.instanceColor.needsUpdate = true;
    this.bogies.instanceMatrix.needsUpdate = true;
  }

  /** Back to an undamaged look (after a replay or restart reuses the model). */
  clearDamage(): void {
    this.loco.scale.set(1, 1, 1);
    this.tintLoco(0);
    for (let i = 0; i < this.rakePlacements.length; i++) this.bodies.setColorAt(i, this.white);
    if (this.bodies.instanceColor) this.bodies.instanceColor.needsUpdate = true;
  }

  private tintLoco(damage: number): void {
    if (!this.locoMats) {
      this.locoMats = [];
      const seen = new Set<THREE.Material>();
      this.exterior.traverse((o) => {
        const mats = (o as THREE.Mesh).material;
        for (const mat of Array.isArray(mats) ? mats : mats ? [mats] : []) {
          if (seen.has(mat) || !(mat instanceof THREE.MeshStandardMaterial)) continue;
          seen.add(mat);
          this.locoMats!.push({ mat, base: mat.color.clone() });
        }
      });
    }
    for (const { mat, base } of this.locoMats) mat.color.copy(base).lerp(SCORCH, damage * 0.7);
  }

  /** World-space seated eye position and look direction (yaw left +, pitch up +). */
  cabView(out: THREE.Vector3, dirOut: THREE.Vector3, yaw: number, pitch: number): void {
    out.copy(CAB_EYE);
    this.loco.localToWorld(out);
    dirOut
      .set(Math.cos(pitch) * Math.cos(yaw), Math.sin(pitch), -Math.cos(pitch) * Math.sin(yaw))
      .applyQuaternion(this.loco.quaternion);
  }

  get locoObject(): THREE.Object3D {
    return this.loco;
  }

  dispose(): void {
    this.root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      mesh.geometry?.dispose();
      const mats = Array.isArray(mesh.material)
        ? mesh.material
        : mesh.material
          ? [mesh.material]
          : [];
      for (const mat of mats) {
        (mat as THREE.MeshStandardMaterial).map?.dispose();
        mat.dispose();
      }
    });
  }

  private readonly tmpPos = new THREE.Vector3();
  private readonly bogiePos = new THREE.Vector3();

  /** Body centre and orientation from the two bogie points (smooth on curves and crossovers). */
  private place(track: Track, frontS: number, dir: Dir, offset: OffsetFn, p: Placement): void {
    const centre = frontS - dir * p.offsetM;
    const sa = centre + dir * p.halfLengthM * 0.7;
    const sb = centre - dir * p.halfLengthM * 0.7;
    frameAt(track, sa, offset(sa), 0, this.a);
    frameAt(track, sb, offset(sb), 0, this.b);
    this.tmpPos.addVectors(this.a, this.b).multiplyScalar(0.5);
    const dx = this.a.x - this.b.x;
    const dz = this.a.z - this.b.z;
    this.e.set(0, Math.atan2(-dz, dx), Math.atan2(this.a.y - this.b.y, Math.hypot(dx, dz)));
    this.q.setFromEuler(this.e);
  }
}

function paintMat(hex: string): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: hex, roughness: 0.45, metalness: 0.2 });
}

function rakeBody(
  look: TrainLook,
  len: number,
): { geo: THREE.BufferGeometry; mats: THREE.Material[]; bogieOffset: number } {
  const l = look.livery;
  const dark = new THREE.MeshStandardMaterial({ color: 0x2a3b3d, roughness: 0.7 });
  const roof = new THREE.MeshStandardMaterial({ color: l.roof, roughness: 0.45 });
  if (look.rake === 'wagon') {
    // Open wagon: low body, dark load visible from above.
    const side = new THREE.MeshStandardMaterial({ map: wagonSideTexture(l), roughness: 0.85 });
    const load = new THREE.MeshStandardMaterial({ color: l.roof, roughness: 1 });
    const geo = new THREE.BoxGeometry(len - 0.6, 2.3, BODY_W - 0.1);
    geo.translate(0, RAIL_TOP + 2.0, 0);
    return { geo, mats: [side, side, load, dark, side, side], bogieOffset: len / 2 - 1.8 };
  }
  const tex = look.rake === 'emu' ? emuSideTexture(l) : coachSideTexture(l);
  const side = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 });
  const geo = new THREE.BoxGeometry(len - 0.8, 3.3, BODY_W);
  geo.translate(0, RAIL_TOP + 2.55, 0);
  // Box material order: +x, -x, +y, -y, +z, -z.
  return { geo, mats: [dark, dark, roof, dark, side, side], bogieOffset: len / 2 - 3.5 };
}

function buildLoco(length: number, look: TrainLook): THREE.Group {
  const g = new THREE.Group();
  const l = look.locoLivery;
  const isEmu = look.loco === 'emu';
  const sideTex = isEmu ? emuSideTexture(l) : locoSideTexture(l, look.number);
  const side = new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.45, metalness: 0.2 });
  const paint = paintMat(l.body);
  const stripe = paintMat(l.stripe);
  const roof = new THREE.MeshStandardMaterial({ color: l.roof, roughness: 0.5 });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x9fc4d8,
    roughness: 0.05,
    metalness: 0.3,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
  });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });

  const bodyLen = isEmu ? length - 1.6 : length - 2.6;
  const body = new THREE.Mesh(new THREE.BoxGeometry(bodyLen, isEmu ? 3.3 : 3.2, BODY_W), [
    paint,
    paint,
    roof,
    dark,
    side,
    side,
  ]);
  body.position.set(isEmu ? -0.4 : 0, RAIL_TOP + (isEmu ? 2.55 : 2.5), 0);
  body.userData['keep'] = true;
  body.castShadow = true;
  g.add(body);

  // Cab ends: both ends on locos, the leading end only on an EMU driving car.
  for (const end of isEmu ? [1] : [1, -1]) {
    const nose = new THREE.Mesh(new THREE.BoxGeometry(isEmu ? 0.8 : 1.4, 2.0, BODY_W), paint);
    nose.position.set(end * (length / 2 - (isEmu ? 0.4 : 0.7)), RAIL_TOP + 1.9, 0);
    const cabTop = new THREE.Mesh(new THREE.BoxGeometry(0.84, 1.2, BODY_W), paint);
    cabTop.position.set(end * (length / 2 - 0.9), RAIL_TOP + 3.5, 0);
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, BODY_W), stripe);
    band.position.set(end * (length / 2), RAIL_TOP + 1.9, 0);
    const windscreen = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.0, BODY_W - 0.5), glass);
    windscreen.position.set(end * (length / 2 - 1.35), RAIL_TOP + 3.45, 0);
    windscreen.rotation.z = end * 0.25;
    windscreen.userData['keep'] = true;
    g.add(nose, cabTop, band, windscreen);
  }

  // Twin headlight glows at the leading (+x) end.
  const glow = new THREE.SpriteMaterial({
    map: glowTexture(),
    color: 0xfff1c9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  for (const z of [-0.9, 0.9]) {
    const lamp = new THREE.Sprite(glow);
    lamp.scale.setScalar(0.9);
    lamp.position.set(length / 2 + 0.05, RAIL_TOP + 2.4, z);
    g.add(lamp);
  }

  for (const x of [-(length / 2 - 4), length / 2 - 4]) {
    const bg = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.8, 2.4), dark);
    bg.position.set(x, RAIL_TOP + 0.5, 0);
    g.add(bg);
  }

  if (look.loco === 'diesel') {
    // Roof radiator grilles and an exhaust stack; no pantograph.
    const grille = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.9 });
    for (const x of [-4.5, -1.5, 1.5]) {
      const rad = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.35, BODY_W - 0.6), grille);
      rad.position.set(x, RAIL_TOP + 4.25, 0);
      g.add(rad);
    }
    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.5, 10), dark);
    stack.position.set(3.5, RAIL_TOP + 4.35, 0);
    g.add(stack);
  } else {
    const bar = new THREE.MeshStandardMaterial({ color: 0x9a9a9a, metalness: 0.7, roughness: 0.4 });
    const panto = new THREE.Group();
    const armA = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.06, 0.06), bar);
    armA.rotation.z = 0.55;
    armA.position.set(-0.4, 0.55, 0);
    const armB = armA.clone();
    armB.rotation.z = -0.55;
    armB.position.set(-0.4, 1.6, 0);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.08, 1.8), bar);
    head.position.set(0.05, 2.1, 0);
    panto.add(armA, armB, head);
    panto.position.set(isEmu ? length / 4 : -length / 4, RAIL_TOP + 4.1, 0);
    g.add(panto);
  }
  mergeByMaterial(g);
  return g;
}

export { yAxis };
