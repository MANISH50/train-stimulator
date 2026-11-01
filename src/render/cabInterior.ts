// Procedural loco cab interior with a driver's console (original design, generic layout).
// Coordinates are loco-local: +x forward, +y up, +z right; the driver sits on the left (-z).
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { BP_CHARGED } from '../sim/physics/brakes';
import type { Sim } from '../sim/sim';

const FLOOR = 2.3;
const ROOF = 4.85;
const HALF_W = 1.55;
const WINDSCREEN_X = 10.15;
const BACK_X = 7.3;
const SILL_Y = 3.55;
const REDRAW_S = 0.1;

/** Seated eye position of the loco pilot (loco-local). */
export const CAB_EYE = new THREE.Vector3(8.35, 3.95, -0.75);

export interface ConsoleReadings {
  speedKmh: number;
  limitKmh: number;
  bp: number;
  bc: number;
  bcMax: number;
  notch: number;
  notches: number;
  reverser: -1 | 0 | 1;
  autoBrake: number;
  indepBrake: number;
  slip: boolean;
  emergency: boolean;
}

export class CabInterior {
  readonly root = new THREE.Group();
  private readonly canvas = document.createElement('canvas');
  private readonly ctx: CanvasRenderingContext2D;
  private readonly texture: THREE.CanvasTexture;
  private readonly throttle: THREE.Object3D;
  private readonly autoHandle: THREE.Object3D;
  private readonly indepHandle: THREE.Object3D;
  private lastDraw = -1;
  private lastKey = '';
  private shadowCasters: THREE.Material[] = [];

  constructor() {
    this.root.name = 'cab-interior';
    this.canvas.width = 1024;
    this.canvas.height = 420;
    this.ctx = this.canvas.getContext('2d')!;
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 4;

    const wall = new THREE.MeshStandardMaterial({ color: 0x8fa3a0, roughness: 0.8 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x2b3133, roughness: 0.7 });
    const floor = new THREE.MeshStandardMaterial({ color: 0x3a3a36, roughness: 1 });
    const frame = new THREE.MeshStandardMaterial({ color: 0x1f2426, roughness: 0.6 });
    this.shadowCasters = [wall, frame];
    const add = (
      geo: THREE.BufferGeometry,
      mat: THREE.Material,
      x: number,
      y: number,
      z: number,
    ) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.receiveShadow = true;
      m.userData['merge'] = true;
      this.root.add(m);
      return m;
    };
    const len = WINDSCREEN_X - BACK_X;
    const midX = (WINDSCREEN_X + BACK_X) / 2;

    // Shell: floor, roof, back wall, side walls under the side windows, front wall under the windscreen.
    add(new THREE.BoxGeometry(len, 0.05, HALF_W * 2), floor, midX, FLOOR, 0);
    add(new THREE.BoxGeometry(len, 0.08, HALF_W * 2), wall, midX, ROOF, 0);
    add(new THREE.BoxGeometry(0.06, ROOF - FLOOR, HALF_W * 2), wall, BACK_X, (ROOF + FLOOR) / 2, 0);
    for (const side of [-1, 1]) {
      const z = side * HALF_W;
      add(new THREE.BoxGeometry(len, SILL_Y - FLOOR, 0.06), wall, midX, (SILL_Y + FLOOR) / 2, z);
      // Side window: rear pillar and top rail; the opening shows the lineside.
      add(
        new THREE.BoxGeometry(0.12, ROOF - SILL_Y, 0.08),
        frame,
        BACK_X + 0.9,
        (ROOF + SILL_Y) / 2,
        z,
      );
      add(new THREE.BoxGeometry(len, 0.18, 0.08), frame, midX, ROOF - 0.09, z);
      add(
        new THREE.BoxGeometry(0.12, ROOF - SILL_Y, 0.1),
        frame,
        WINDSCREEN_X - 0.05,
        (ROOF + SILL_Y) / 2,
        z,
      );
    }
    add(
      new THREE.BoxGeometry(0.08, SILL_Y - FLOOR, HALF_W * 2),
      wall,
      WINDSCREEN_X,
      (SILL_Y + FLOOR) / 2,
      0,
    );
    // Windscreen frame: sill, header, centre pillar and a tinted sun-visor strip.
    add(new THREE.BoxGeometry(0.25, 0.08, HALF_W * 2), frame, WINDSCREEN_X - 0.1, SILL_Y, 0);
    add(new THREE.BoxGeometry(0.12, 0.25, HALF_W * 2), frame, WINDSCREEN_X - 0.05, ROOF - 0.12, 0);
    add(
      new THREE.BoxGeometry(0.1, ROOF - SILL_Y, 0.14),
      frame,
      WINDSCREEN_X - 0.05,
      (ROOF + SILL_Y) / 2,
      0,
    );
    const visor = new THREE.Mesh(
      new THREE.PlaneGeometry(HALF_W * 2 - 0.2, 0.32),
      new THREE.MeshBasicMaterial({
        color: 0x0d1a1f,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      }),
    );
    visor.position.set(WINDSCREEN_X - 0.12, ROOF - 0.38, 0);
    visor.rotation.y = -Math.PI / 2;
    this.root.add(visor);

    // Driver's desk: body plus a sloped instrument face carrying the console texture.
    const deskTop = 3.42;
    add(
      new THREE.BoxGeometry(0.9, deskTop - FLOOR, HALF_W * 2 - 0.1),
      dark,
      9.6,
      (deskTop + FLOOR) / 2,
      0,
    );
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 0.58),
      new THREE.MeshStandardMaterial({
        map: this.texture,
        roughness: 0.55,
        emissive: 0xffffff,
        emissiveMap: this.texture,
        // Backlit instruments: readable without an extra cab light (which would force shader recompiles).
        emissiveIntensity: 0.5,
      }),
    );
    // Tilt the face toward the driver (normal points back and up).
    face.position.set(9.45, deskTop + 0.17, CAB_EYE.z + 0.02);
    face.rotation.set(0, -Math.PI / 2, 0);
    face.rotateX(-0.95);
    this.root.add(face);
    // Plain co-driver desk top.
    const coDesk = add(new THREE.BoxGeometry(0.75, 0.05, 1.2), dark, 9.4, deskTop + 0.05, 0.85);
    coDesk.rotation.z = 0.35;

    // Controls: throttle lever on the right of the console, train and loco brake handles on the left.
    const handleMat = new THREE.MeshStandardMaterial({
      color: 0xb8b8b8,
      metalness: 0.7,
      roughness: 0.35,
    });
    const knobRed = new THREE.MeshStandardMaterial({ color: 0xb3261e, roughness: 0.4 });
    const knobBlack = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.4 });
    this.throttle = lever(handleMat, knobBlack, 0.32);
    this.throttle.position.set(9.2, deskTop + 0.02, CAB_EYE.z + 0.68);
    this.autoHandle = lever(handleMat, knobRed, 0.26);
    this.autoHandle.position.set(9.1, deskTop - 0.05, CAB_EYE.z - 0.62);
    this.indepHandle = lever(handleMat, knobBlack, 0.22);
    this.indepHandle.position.set(8.95, deskTop - 0.05, CAB_EYE.z - 0.7);
    this.root.add(this.throttle, this.autoHandle, this.indepHandle);

    // Driver's seat.
    add(new THREE.BoxGeometry(0.5, 0.1, 0.5), dark, CAB_EYE.x - 0.25, 2.95, CAB_EYE.z);
    add(new THREE.BoxGeometry(0.1, 0.7, 0.5), dark, CAB_EYE.x - 0.5, 3.35, CAB_EYE.z);

    this.mergeStatic();
  }

  /** Merge the static shell boxes into one mesh per material to keep draw calls low. */
  private mergeStatic(): void {
    const buckets = new Map<THREE.Material, THREE.BufferGeometry[]>();
    for (const child of [...this.root.children]) {
      if (!(child instanceof THREE.Mesh) || !child.userData['merge']) continue;
      child.updateMatrix();
      const geo = (child.geometry as THREE.BufferGeometry).clone().applyMatrix4(child.matrix);
      const mat = child.material as THREE.Material;
      buckets.set(mat, [...(buckets.get(mat) ?? []), geo]);
      this.root.remove(child);
      child.geometry.dispose();
    }
    for (const [mat, geos] of buckets) {
      const mesh = new THREE.Mesh(mergeGeometries(geos), mat);
      // Only the roof, walls and frame shade the cab; floor and desk shadows are not visible.
      mesh.castShadow = mat === this.shadowCasters[0] || mat === this.shadowCasters[1];
      mesh.receiveShadow = true;
      this.root.add(mesh);
      geos.forEach((g) => g.dispose());
    }
  }

  /** Refresh handle positions every frame and redraw the gauges at ~10 Hz. */
  update(sim: Sim, timeS: number): void {
    const c = sim.controls;
    this.throttle.rotation.z = 0.6 - (c.notch / sim.consist.loco.notches) * 1.2;
    this.autoHandle.rotation.x = -0.7 + c.autoBrake * 1.4;
    this.indepHandle.rotation.x = -0.7 + c.indepBrake * 1.4;
    if (timeS - this.lastDraw < REDRAW_S) return;
    this.lastDraw = timeS;
    const r: ConsoleReadings = {
      speedKmh: Math.abs(sim.train.v) * 3.6,
      limitKmh: sim.currentLimitKmh(),
      bp: sim.train.brakes.bp,
      bc: sim.train.brakes.bc,
      bcMax: sim.consist.rake.bcMax,
      notch: c.notch,
      notches: sim.consist.loco.notches,
      reverser: c.reverser,
      autoBrake: c.autoBrake,
      indepBrake: c.indepBrake,
      slip: sim.train.wheelSlip,
      emergency: c.emergency,
    };
    const key = [
      r.speedKmh.toFixed(0),
      r.limitKmh,
      r.bp.toFixed(2),
      r.bc.toFixed(2),
      r.notch,
      r.reverser,
      r.slip,
      r.emergency,
    ].join('|');
    if (key === this.lastKey) return;
    this.lastKey = key;
    drawConsole(this.ctx, r);
    this.texture.needsUpdate = true;
  }
}

function lever(shaft: THREE.Material, knob: THREE.Material, length: number): THREE.Group {
  const g = new THREE.Group();
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.015, length, 8), shaft);
  rod.position.y = length / 2;
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), knob);
  ball.position.y = length;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.04, 12), shaft);
  g.add(rod, ball, base);
  return g;
}

// ---- Console face drawing (canvas 1024 x 420) ----

function drawConsole(g: CanvasRenderingContext2D, r: ConsoleReadings): void {
  g.fillStyle = '#20282b';
  g.fillRect(0, 0, 1024, 420);
  g.strokeStyle = '#3c474b';
  g.lineWidth = 4;
  g.strokeRect(6, 6, 1012, 408);

  dial(g, 190, 215, 170, r.speedKmh, 0, 140, 20, 'km/h', r.speedKmh.toFixed(0), r.limitKmh);
  dial(g, 500, 160, 105, r.bp, 0, 6, 1, 'BP kg/cm²', r.bp.toFixed(1), null, BP_CHARGED);
  dial(g, 500, 340, 70, r.bc, 0, 5, 1, 'BC', r.bc.toFixed(1), null);

  // Notch indicator.
  g.fillStyle = '#9fb0ac';
  g.font = '22px sans-serif';
  g.textAlign = 'left';
  g.fillText('NOTCH', 650, 60);
  for (let i = 0; i < r.notches; i++) {
    g.fillStyle = i < r.notch ? '#e0a63a' : '#384246';
    g.fillRect(650 + i * 40, 75, 32, 40);
  }
  g.fillStyle = '#eef2f0';
  g.font = 'bold 34px sans-serif';
  g.fillText(`${r.notch}/${r.notches}`, 975 - 60, 108);

  // Reverser lamps.
  g.fillStyle = '#9fb0ac';
  g.font = '22px sans-serif';
  g.fillText('REVERSER', 650, 170);
  (['F', 'N', 'R'] as const).forEach((label, i) => {
    const on =
      (label === 'F' && r.reverser === 1) ||
      (label === 'N' && r.reverser === 0) ||
      (label === 'R' && r.reverser === -1);
    lamp(g, 680 + i * 80, 210, on ? '#3ddc6a' : '#2a3235', label);
  });

  // Brake handle positions.
  g.fillStyle = '#9fb0ac';
  g.fillText(`TRAIN BRAKE ${Math.round(r.autoBrake * 100)}%`, 650, 290);
  g.fillText(`LOCO BRAKE ${Math.round(r.indepBrake * 100)}%`, 650, 325);

  // Warning lamps.
  warn(g, 650, 350, 'WHEEL SLIP', r.slip);
  warn(g, 830, 350, 'EMERGENCY', r.emergency);
}

function dial(
  g: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  value: number,
  min: number,
  max: number,
  majorStep: number,
  label: string,
  readout: string,
  limitMark: number | null,
  normalMark?: number,
): void {
  const a0 = Math.PI * 0.75;
  const a1 = Math.PI * 2.25;
  const ang = (v: number) =>
    a0 + ((Math.min(max, Math.max(min, v)) - min) / (max - min)) * (a1 - a0);
  g.fillStyle = '#0f1416';
  g.beginPath();
  g.arc(cx, cy, radius, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#5d6a6e';
  g.lineWidth = 3;
  g.stroke();

  if (limitMark !== null) {
    g.strokeStyle = '#ff3b2f';
    g.lineWidth = 8;
    g.beginPath();
    g.arc(cx, cy, radius - 8, ang(limitMark), a1);
    g.stroke();
  }
  if (normalMark !== undefined) {
    g.strokeStyle = '#3ddc6a';
    g.lineWidth = 8;
    g.beginPath();
    g.arc(cx, cy, radius - 8, ang(normalMark - 0.15), ang(normalMark + 0.15));
    g.stroke();
  }

  g.strokeStyle = '#dfe6e3';
  g.fillStyle = '#dfe6e3';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `${Math.round(radius * 0.16)}px sans-serif`;
  for (let v = min; v <= max + 1e-6; v += majorStep) {
    const a = ang(v);
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(cx + Math.cos(a) * (radius - 16), cy + Math.sin(a) * (radius - 16));
    g.lineTo(cx + Math.cos(a) * (radius - 4), cy + Math.sin(a) * (radius - 4));
    g.stroke();
    g.fillText(String(v), cx + Math.cos(a) * (radius - 34), cy + Math.sin(a) * (radius - 34));
  }

  g.font = `${Math.round(radius * 0.14)}px sans-serif`;
  g.fillStyle = '#9fb0ac';
  g.fillText(label, cx, cy + radius * 0.45);
  g.font = `bold ${Math.round(radius * 0.26)}px sans-serif`;
  g.fillStyle = '#ffffff';
  g.fillText(readout, cx, cy + radius * 0.72);

  const a = ang(value);
  g.strokeStyle = '#ffb414';
  g.lineWidth = Math.max(3, radius * 0.04);
  g.beginPath();
  g.moveTo(cx, cy);
  g.lineTo(cx + Math.cos(a) * (radius - 20), cy + Math.sin(a) * (radius - 20));
  g.stroke();
  g.fillStyle = '#ffb414';
  g.beginPath();
  g.arc(cx, cy, radius * 0.07, 0, Math.PI * 2);
  g.fill();
  g.textBaseline = 'alphabetic';
}

function lamp(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  colour: string,
  label: string,
): void {
  g.fillStyle = colour;
  g.beginPath();
  g.arc(x, y, 24, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#0f1416';
  g.font = 'bold 24px sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(label, x, y + 1);
  g.textBaseline = 'alphabetic';
  g.textAlign = 'left';
}

function warn(g: CanvasRenderingContext2D, x: number, y: number, label: string, on: boolean): void {
  g.fillStyle = on ? '#ff3b2f' : '#2a3235';
  g.fillRect(x, y, 160, 46);
  g.fillStyle = on ? '#ffffff' : '#56636a';
  g.font = 'bold 22px sans-serif';
  g.textAlign = 'center';
  g.fillText(label, x + 80, y + 31);
  g.textAlign = 'left';
}
