// Procedural low-poly loco and coaches with an original "Training Ground" livery.
import * as THREE from 'three';
import type { Consist } from '../sim/physics/forces';
import type { Track } from '../sim/track/track';
import { CAB_EYE, CabInterior } from './cabInterior';
import { frameAt, headingAt } from './trackMesh';
import { coachSideTexture, glowTexture, locoSideTexture } from './textures';

const RAIL_TOP = 0.79;
const BODY_W = 3.2;
const yAxis = new THREE.Vector3(0, 1, 0);

interface Vehicle {
  object: THREE.Object3D;
  /** Distance from the train front to this vehicle's centre (m). */
  offsetM: number;
  halfLengthM: number;
}

export class TrainModel {
  readonly root = new THREE.Group();
  readonly headlight: THREE.SpotLight;
  readonly cab: CabInterior;
  private readonly exterior: THREE.Group;
  private readonly vehicles: Vehicle[] = [];
  private readonly a = new THREE.Vector3();
  private readonly b = new THREE.Vector3();

  constructor(consist: Consist) {
    this.root.name = 'train';
    const { loco, rake } = consist;

    // Loco = exterior body + cab interior (shown only in the cab view) + headlight.
    const locoObj = new THREE.Group();
    this.exterior = buildLoco(loco.lengthM);
    this.cab = new CabInterior();
    this.cab.root.visible = false;
    locoObj.add(this.exterior, this.cab.root);
    this.vehicles.push({
      object: locoObj,
      offsetM: loco.lengthM / 2,
      halfLengthM: loco.lengthM / 2,
    });
    this.root.add(locoObj);

    const coachGeo = new THREE.BoxGeometry(rake.vehicleLengthM - 0.8, 3.3, BODY_W);
    const side = coachSideTexture();
    const sideMat = new THREE.MeshStandardMaterial({ map: side, roughness: 0.6 });
    const endMat = new THREE.MeshStandardMaterial({ color: 0x2a3b3d, roughness: 0.7 });
    // Light aluminium roofs so the rake reads clearly against the ballast from above.
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xd4d8da, roughness: 0.45 });
    // Box material order: +x, -x, +y, -y, +z, -z.
    const coachMats = [endMat, endMat, roofMat, endMat, sideMat, sideMat];
    const bogie = bogieGeometry();
    const bogieMat = new THREE.MeshStandardMaterial({ color: 0x1e1e1e, roughness: 0.8 });
    for (let i = 0; i < rake.vehicles; i++) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(coachGeo, coachMats);
      body.position.y = RAIL_TOP + 2.55;
      body.castShadow = true;
      g.add(body);
      for (const x of [-(rake.vehicleLengthM / 2 - 3.5), rake.vehicleLengthM / 2 - 3.5]) {
        const bg = new THREE.Mesh(bogie, bogieMat);
        bg.position.set(x, RAIL_TOP + 0.5, 0);
        g.add(bg);
      }
      this.root.add(g);
      this.vehicles.push({
        object: g,
        offsetM: loco.lengthM + rake.vehicleLengthM * (i + 0.5),
        halfLengthM: rake.vehicleLengthM / 2,
      });
    }

    this.headlight = new THREE.SpotLight(0xfff3d6, 0, 420, Math.PI / 9, 0.45, 1.2);
    this.headlight.position.set(loco.lengthM / 2, RAIL_TOP + 3.6, 0);
    this.headlight.target.position.set(loco.lengthM / 2 + 50, 0, 0);
    locoObj.add(this.headlight, this.headlight.target);
  }

  /** Place every vehicle along the track for the train front at chainage `frontS`. */
  update(track: Track, frontS: number): void {
    for (const v of this.vehicles) {
      const centre = frontS - v.offsetM;
      // Align each body between its two bogie centres for a smooth look on curves.
      frameAt(track, centre + v.halfLengthM * 0.7, 0, 0, this.a);
      frameAt(track, centre - v.halfLengthM * 0.7, 0, 0, this.b);
      v.object.position.addVectors(this.a, this.b).multiplyScalar(0.5);
      v.object.quaternion.setFromAxisAngle(yAxis, headingAt(track, centre));
      const pitch = Math.atan2(this.a.y - this.b.y, this.a.distanceTo(this.b));
      v.object.rotateZ(pitch);
    }
  }

  /** Inside the cab the exterior body is hidden and the interior with its console shown. */
  setCabView(on: boolean): void {
    this.exterior.visible = !on;
    this.cab.root.visible = on;
  }

  /**
   * World-space seated eye position and look direction for the cab camera.
   * `yaw` (left positive) and `pitch` (up positive) are the pilot's head turn in radians.
   */
  cabView(out: THREE.Vector3, dir: THREE.Vector3, yaw: number, pitch: number): void {
    const loco = this.vehicles[0]!.object;
    out.copy(CAB_EYE);
    loco.localToWorld(out);
    dir
      .set(Math.cos(pitch) * Math.cos(yaw), Math.sin(pitch), -Math.cos(pitch) * Math.sin(yaw))
      .applyQuaternion(loco.quaternion);
  }

  get locoObject(): THREE.Object3D {
    return this.vehicles[0]!.object;
  }
}

function bogieGeometry(): THREE.BufferGeometry {
  return new THREE.BoxGeometry(3.0, 0.8, 2.4);
}

function buildLoco(length: number): THREE.Group {
  const g = new THREE.Group();
  const side = new THREE.MeshStandardMaterial({
    map: locoSideTexture(),
    roughness: 0.45,
    metalness: 0.2,
  });
  const paint = new THREE.MeshStandardMaterial({
    color: 0x1f5f5b,
    roughness: 0.45,
    metalness: 0.2,
  });
  const roof = new THREE.MeshStandardMaterial({ color: 0xb9bfc2, roughness: 0.5 });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x9fc4d8,
    roughness: 0.05,
    metalness: 0.3,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
  });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(length - 2.6, 3.2, BODY_W), [
    paint,
    paint,
    roof,
    dark,
    side,
    side,
  ]);
  body.position.y = RAIL_TOP + 2.5;
  body.castShadow = true;
  g.add(body);

  // Sloped cab noses at both ends.
  for (const dir of [1, -1]) {
    const nose = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.0, BODY_W), paint);
    nose.position.set(dir * (length / 2 - 0.7), RAIL_TOP + 1.9, 0);
    nose.castShadow = true;
    const windscreen = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.0, BODY_W - 0.5), glass);
    windscreen.position.set(dir * (length / 2 - 1.35), RAIL_TOP + 3.45, 0);
    windscreen.rotation.z = dir * 0.25;
    const cabTop = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, BODY_W), paint);
    cabTop.position.set(dir * (length / 2 - 0.7 - 0.2), RAIL_TOP + 3.5, 0);
    cabTop.scale.x = 0.6;
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.3, BODY_W),
      new THREE.MeshStandardMaterial({ color: 0xe0a63a }),
    );
    stripe.position.set(dir * (length / 2), RAIL_TOP + 1.9, 0);
    g.add(nose, windscreen, cabTop, stripe);
  }

  // Twin headlights at the leading (+x) end with a glow sprite.
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

  // Bogies, roof equipment and a pantograph.
  const bogie = bogieGeometry();
  for (const x of [-(length / 2 - 4), length / 2 - 4]) {
    const b = new THREE.Mesh(bogie, dark);
    b.position.set(x, RAIL_TOP + 0.5, 0);
    g.add(b);
  }
  const panto = new THREE.Group();
  const bar = new THREE.MeshStandardMaterial({ color: 0x9a9a9a, metalness: 0.7, roughness: 0.4 });
  const armA = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.06, 0.06), bar);
  armA.rotation.z = 0.55;
  armA.position.set(-0.4, 0.55, 0);
  const armB = armA.clone();
  armB.rotation.z = -0.55;
  armB.position.set(-0.4, 1.6, 0);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.08, 1.8), bar);
  head.position.set(-0.4 + 0.45, 2.1, 0);
  panto.add(armA, armB, head);
  panto.position.set(-length / 4, RAIL_TOP + 4.1, 0);
  g.add(panto);
  return g;
}
