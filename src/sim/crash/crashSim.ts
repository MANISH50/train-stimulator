// Deterministic crash simulation. When trains collide or derail, every vehicle becomes a rigid
// body (plan-view capsule plus height, pitch and roll) in track-relative coordinates: chainage
// s, lateral y (+ = right of increasing chainage) and height z above the rail-top reference.
// Bodies stay rail-bound until a lateral push beats the flange force, a buckling coupler
// throws them sideways, or they ride up over another vehicle. Ends crumple under a capped
// crush force, so energy is absorbed the way crumple zones do. Parts that come off (bogies,
// panels, glass, pantographs) fly as debris. Values are stylised game approximations, not
// engineering figures. Same setup → same crash, which is what replays rely on.
import { mulberry32 } from '../rng';
import { G, type Consist } from '../physics/forces';
import type { RailNetwork } from '../track/network';
import type { Track } from '../track/track';
import type { Dir } from '../types';

export type CrashKind = 'rear-end' | 'head-on' | 'side' | 'derailment' | 'buffer';

export interface CrashTrainSpec {
  owner: string;
  label: string;
  consist: Consist;
  dir: Dir;
  frontS: number;
  /** Velocity along +chainage (m/s). */
  v: number;
  loopRoutes: readonly string[];
  /** Body colour used for debris (0xRRGGBB). */
  colour: number;
}

export interface CrashSetup {
  kind: CrashKind;
  seed: number;
  trains: CrashTrainSpec[];
  /** Buffer stop for an overrun: chainage of its face and lateral position. */
  bufferStop?: { s: number; y: number };
  /** Derailment: which vehicle leaves the rails first and to which side. */
  derail?: { owner: string; vehicle: number; side: 1 | -1 };
  /** Where it happened (for cameras and effects). */
  impact: { s: number; y: number };
}

export type BodyKind = 'loco' | 'vehicle' | 'bogie' | 'buffer';

export interface CrashBody {
  readonly kind: BodyKind;
  readonly owner: string;
  /** Vehicle index in its train (0 = loco); for bogies, vehicle * 2 + k. */
  readonly index: number;
  readonly train: number;
  readonly lengthM: number;
  readonly widthM: number;
  readonly heightM: number;
  massKg: number;
  invMass: number;
  invInertia: number;
  s: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  roll: number;
  vs: number;
  vy: number;
  vz: number;
  wYaw: number;
  wPitch: number;
  wRoll: number;
  onRails: boolean;
  onGround: boolean;
  asleep: boolean;
  sleepS: number;
  /** Crumpled length at the local +x (front) and -x (rear) ends (m). */
  crushFront: number;
  crushRear: number;
  readonly maxCrushM: number;
  readonly crushForceN: number;
  /** 0..1, drives scorch tint. */
  damage: number;
  bogiesOff: boolean;
  readonly bogieOffsetM: number;
  readonly colour: number;
  /** Height of the body's underside above its origin when upright (m). */
  readonly bottomM: number;
  /** Buffer stop still fixed to the ground. */
  anchored: boolean;
  anchorImpulse: number;
}

export interface Debris {
  active: boolean;
  /** 0 panel, 1 glass, 2 dark metal, 3 pantograph. */
  kind: number;
  colour: number;
  s: number;
  y: number;
  z: number;
  vs: number;
  vy: number;
  vz: number;
  rx: number;
  ry: number;
  rz: number;
  wx: number;
  wy: number;
  wz: number;
  size: number;
  resting: boolean;
}

export interface Impact {
  s: number;
  y: number;
  z: number;
  /** Rough intensity 0..1. */
  strength: number;
  timeS: number;
}

interface Coupler {
  a: number;
  b: number;
  broken: boolean;
}

const SUBSTEPS = 4;
const ITERATIONS = 4;
const COUPLER_SLACK_M = 0.3;
const COUPLER_BREAK_STRETCH_M = 1.6;
const COUPLER_BREAK_ANGLE = 1.35;
/** Lateral force a flange can resist before the wheel climbs the rail, as a share of weight. */
const FLANGE_FRACTION = 0.6;
/** Coupler compression that makes a rake buckle sideways (N, approximate). */
const BUCKLE_FORCE_N = 1.6e6;
const RESTITUTION = 0.05;
const MU_CONTACT = 0.3;
const MU_GROUND = 0.45;
const MU_ON_SIDE = 0.65;
const TIP_SPEED_MS = 1.8;
const TIP_ANGLE = 0.6;
const GROUND_LEVEL = -0.1;
const MAX_DEBRIS = 160;
const MAX_IMPACTS = 64;
const SETTLE_MAX_S = 15;
const BUFFER_BREAK_IMPULSE = 1.5e5;

export class CrashSim {
  readonly bodies: CrashBody[] = [];
  readonly debris: Debris[] = [];
  readonly impacts: Impact[] = [];
  /** Total impacts ever logged (ring buffer write counter). */
  impactCount = 0;
  timeS = 0;
  settled = false;
  /** Number of debris pieces launched so far. */
  debrisLaunched = 0;
  private readonly couplers: Coupler[] = [];
  private readonly vehicleBodies = new Map<string, CrashBody[]>();
  private readonly bogieBodies = new Map<string, (CrashBody | null)[]>();
  private readonly lineFns: ((s: number) => number)[] = [];
  private readonly brakeDecel: number[] = [];
  private readonly lastSide: number[] = [];
  private readonly rng: () => number;
  private readonly overridden = new Set<number>();
  private readonly pairs: number[] = [];
  private readonly order: number[] = [];
  private debrisBudget = 0;
  /** Closing speed at the moment of impact (m/s); harder crashes buckle rakes more readily. */
  readonly severity: number;
  private crushedThisStep = new Set<number>();
  private readonly tmp = { x: 0, y: 0 };
  private readonly segA = { x0: 0, y0: 0, x1: 0, y1: 0 };
  private readonly segB = { x0: 0, y0: 0, x1: 0, y1: 0 };
  private readonly cp = { ax: 0, ay: 0, bx: 0, by: 0 };

  constructor(
    readonly setup: CrashSetup,
    private readonly track: Track,
    private readonly net: RailNetwork,
  ) {
    this.rng = mulberry32(setup.seed);
    const [t0, t1] = setup.trains;
    this.severity = Math.abs((t0?.v ?? 0) - (t1?.v ?? 0));
    setup.trains.forEach((t, ti) => this.addTrain(t, ti));
    if (setup.bufferStop) this.addBuffer(setup.bufferStop.s, setup.bufferStop.y);
    for (let i = 0; i < MAX_DEBRIS; i++) {
      this.debris.push({
        active: false,
        kind: 0,
        colour: 0,
        s: 0,
        y: 0,
        z: 0,
        vs: 0,
        vy: 0,
        vz: 0,
        rx: 0,
        ry: 0,
        rz: 0,
        wx: 0,
        wy: 0,
        wz: 0,
        size: 1,
        resting: false,
      });
    }
    for (let i = 0; i < MAX_IMPACTS; i++)
      this.impacts.push({ s: 0, y: 0, z: 0, strength: 0, timeS: 0 });
    const d = setup.derail;
    if (d) {
      const b = this.vehicleBodies.get(d.owner)?.[d.vehicle];
      if (b) {
        const speed = Math.abs(b.vs);
        this.derailBody(b);
        b.vy += d.side * Math.min(2.5, 0.6 + speed * 0.06);
        b.wYaw += d.side * Math.min(0.5, speed * 0.012) * Math.sign(b.vs || 1);
        b.wRoll += d.side * 0.2;
      }
    }
    this.logImpact(setup.impact.s, setup.impact.y, 1.5, 1);
  }

  /** Vehicle bodies of a train, index 0 = loco. */
  vehiclesOf(owner: string): readonly CrashBody[] {
    return this.vehicleBodies.get(owner) ?? [];
  }

  /** Detached bogie bodies of a train (vehicle * 2 + k), or null while still attached. */
  bogiesOf(owner: string): readonly (CrashBody | null)[] {
    return this.bogieBodies.get(owner) ?? [];
  }

  get bufferBody(): CrashBody | undefined {
    return this.bodies.find((b) => b.kind === 'buffer');
  }

  /** Vehicles (incl. locos) no longer on the rails. */
  derailedCount(): number {
    return this.bodies.filter((b) => (b.kind === 'vehicle' || b.kind === 'loco') && !b.onRails)
      .length;
  }

  detachedBogieCount(): number {
    return this.bodies.filter((b) => b.kind === 'bogie').length;
  }

  kineticEnergy(): number {
    let e = 0;
    for (const b of this.bodies) {
      if (b.invMass === 0) continue;
      e += 0.5 * b.massKg * (b.vs * b.vs + b.vy * b.vy + b.vz * b.vz);
      if (b.invInertia > 0) e += (0.5 * b.wYaw * b.wYaw) / b.invInertia;
    }
    return e;
  }

  step(dt: number): void {
    if (this.settled) return;
    const h = dt / SUBSTEPS;
    for (let k = 0; k < SUBSTEPS; k++) this.substep(h);
    this.timeS += dt;
    this.stepDebris(dt);
    const resting = this.bodies.every(
      (b) => b.asleep || b.invMass === 0 || (b.onRails && b.vs === 0),
    );
    if ((this.timeS > 2 && resting) || this.timeS >= SETTLE_MAX_S) this.settled = true;
  }

  // ---------------------------------------------------------------- setup

  private addTrain(t: CrashTrainSpec, ti: number): void {
    const { loco, rake } = t.consist;
    const loopRoutes = new Set(t.loopRoutes);
    this.lineFns[ti] = (s) => this.net.offsetAt(this.net.lineFor(t.dir, loopRoutes, s), s);
    this.brakeDecel[ti] = Math.max(0.8, rake.brakeForceRatio * G);
    this.lastSide[ti] = this.rng() < 0.5 ? -1 : 1;
    const list: CrashBody[] = [];
    const wagon = rake.style === 'wagon';
    const yaw0 = t.dir === 1 ? 0 : Math.PI;
    const place = (offsetM: number) => t.frontS - t.dir * offsetM;
    list.push(
      this.makeBody({
        kind: 'loco',
        owner: t.owner,
        index: 0,
        train: ti,
        lengthM: loco.lengthM,
        widthM: 3.2,
        heightM: 4.3,
        massKg: loco.massT * 1000,
        s: place(loco.lengthM / 2),
        v: t.v,
        yaw0,
        maxCrushM: 2.2,
        crushForceN: 4.5e6,
        bogieOffsetM: loco.lengthM / 2 - 4,
        colour: t.colour,
        bottomM: 1.69,
      }),
    );
    for (let i = 0; i < rake.vehicles; i++) {
      const len = rake.vehicleLengthM;
      list.push(
        this.makeBody({
          kind: 'vehicle',
          owner: t.owner,
          index: i + 1,
          train: ti,
          lengthM: len,
          widthM: 3.2,
          heightM: wagon ? 3.3 : 4.2,
          massKg: rake.vehicleMassT * 1000,
          s: place(loco.lengthM + len * (i + 0.5)),
          v: t.v,
          yaw0,
          maxCrushM: wagon ? 1.6 : 3.0,
          crushForceN: wagon ? 3.5e6 : 2.6e6,
          bogieOffsetM: wagon ? len / 2 - 1.8 : len / 2 - 3.5,
          colour: t.colour,
          bottomM: wagon ? 1.64 : 1.69,
        }),
      );
    }
    for (let i = 0; i + 1 < list.length; i++) {
      this.couplers.push({
        a: this.bodies.indexOf(list[i]!),
        b: this.bodies.indexOf(list[i + 1]!),
        broken: false,
      });
    }
    this.vehicleBodies.set(t.owner, list);
    this.bogieBodies.set(
      t.owner,
      Array.from({ length: list.length * 2 }, () => null),
    );
  }

  private addBuffer(s: number, y: number): void {
    const b = this.makeBody({
      kind: 'buffer',
      owner: 'buffer',
      index: 0,
      train: -1,
      lengthM: 3.2,
      widthM: 3.4,
      heightM: 1.8,
      massKg: 25000,
      s: s + 1.6,
      v: 0,
      yaw0: 0,
      maxCrushM: 0,
      crushForceN: 0,
      bogieOffsetM: 0,
      colour: 0xc8a020,
      bottomM: 0,
    });
    b.y = y;
    b.onRails = false;
    b.onGround = true;
    b.anchored = true;
    b.invMass = 0;
    b.invInertia = 0;
    b.z = 0;
  }

  private makeBody(o: {
    kind: BodyKind;
    owner: string;
    index: number;
    train: number;
    lengthM: number;
    widthM: number;
    heightM: number;
    massKg: number;
    s: number;
    v: number;
    yaw0: number;
    maxCrushM: number;
    crushForceN: number;
    bogieOffsetM: number;
    colour: number;
    bottomM: number;
  }): CrashBody {
    const slope = o.train >= 0 ? this.slopeOf(o.train, o.s) : 0;
    const b: CrashBody = {
      kind: o.kind,
      owner: o.owner,
      index: o.index,
      train: o.train,
      lengthM: o.lengthM,
      widthM: o.widthM,
      heightM: o.heightM,
      massKg: o.massKg,
      invMass: 1 / o.massKg,
      invInertia: 12 / (o.massKg * (o.lengthM * o.lengthM + o.widthM * o.widthM)),
      s: o.s,
      y: o.train >= 0 ? this.lineFns[o.train]!(o.s) : 0,
      z: 0,
      yaw: o.yaw0 + Math.atan(slope),
      pitch: 0,
      roll: 0,
      vs: o.v,
      vy: o.v * slope,
      vz: 0,
      wYaw: 0,
      wPitch: 0,
      wRoll: 0,
      onRails: o.train >= 0,
      onGround: true,
      asleep: false,
      sleepS: 0,
      crushFront: 0,
      crushRear: 0,
      maxCrushM: o.maxCrushM,
      crushForceN: o.crushForceN,
      damage: 0,
      bogiesOff: false,
      bogieOffsetM: o.bogieOffsetM,
      colour: o.colour,
      bottomM: o.bottomM,
      anchored: false,
      anchorImpulse: 0,
    };
    this.bodies.push(b);
    return b;
  }

  // ---------------------------------------------------------------- stepping

  private substep(h: number): void {
    this.crushedThisStep.clear();
    for (const b of this.bodies) this.integrate(b, h);
    this.broadphase();
    for (let it = 0; it < ITERATIONS; it++) {
      for (const c of this.couplers) if (!c.broken) this.solveCoupler(c, h, it);
      for (let p = 0; p < this.pairs.length; p += 2) {
        this.solveContact(this.bodies[this.pairs[p]!]!, this.bodies[this.pairs[p + 1]!]!, h, it);
      }
    }
    for (const b of this.bodies) this.postStep(b, h);
  }

  private integrate(b: CrashBody, h: number): void {
    if (b.invMass === 0 || b.asleep) return;
    if (b.onRails) {
      // Emergency brakes on every vehicle (the brake pipe parts in a collision).
      const dv = this.brakeDecel[b.train]! * h;
      b.vs = Math.abs(b.vs) <= dv ? 0 : b.vs - Math.sign(b.vs) * dv;
      b.s += b.vs * h;
      return;
    }
    b.vz -= G * h;
    // Free bodies keep going straight while the track curves away underneath them.
    const kappa = this.curvature(b.s);
    b.vy += b.vs * b.vs * kappa * h;
    b.yaw += kappa * b.vs * h;
    b.s += b.vs * h;
    b.y += b.vy * h;
    b.z += b.vz * h;
    b.yaw += b.wYaw * h;
    b.pitch += b.wPitch * h;
    b.roll += b.wRoll * h;

    const support = this.supportZ(b);
    b.onGround = b.z <= support + 0.03;
    if (b.z < support) {
      b.z = support;
      if (b.vz < -2) b.vz = -b.vz * 0.2;
      else if (b.vz < 0) b.vz = 0;
    }
    if (b.onGround) {
      const mu = Math.abs(b.roll) > 0.9 ? MU_ON_SIDE : MU_GROUND;
      const speed = Math.hypot(b.vs, b.vy);
      if (speed > 1e-6) {
        const k = Math.max(0, speed - mu * G * h) / speed;
        b.vs *= k;
        b.vy *= k;
      }
      const wDrop = 1.6 * h;
      b.wYaw = Math.abs(b.wYaw) <= wDrop ? 0 : b.wYaw - Math.sign(b.wYaw) * wDrop;
      // Sideways sliding trips the body over; gravity rights it or completes the fall.
      const u = -Math.sin(b.yaw) * b.vs + Math.cos(b.yaw) * b.vy;
      if (Math.abs(u) > TIP_SPEED_MS)
        b.wRoll += Math.sign(u) * (Math.abs(u) - TIP_SPEED_MS) * 1.4 * h;
      if (Math.abs(b.roll) < TIP_ANGLE) b.wRoll += -b.roll * 6 * h;
      else b.wRoll += Math.sign(b.roll) * 5 * h;
      b.wRoll *= 1 - 2 * h;
      b.wPitch += (-b.pitch * 9 - b.wPitch * 3) * h;
    }
    if (Math.abs(b.roll) > Math.PI / 2) {
      b.roll = (Math.sign(b.roll) * Math.PI) / 2;
      b.wRoll = -b.wRoll * 0.2;
    }
    b.pitch = Math.max(-0.7, Math.min(0.7, b.pitch));
  }

  private postStep(b: CrashBody, h: number): void {
    if (b.invMass === 0) return;
    if (b.onRails) {
      const slope = this.slopeOf(b.train, b.s);
      b.y = this.lineFns[b.train]!(b.s);
      b.yaw = (this.setup.trains[b.train]!.dir === 1 ? 0 : Math.PI) + Math.atan(slope);
      b.vy = b.vs * slope;
      b.z = 0;
      return;
    }
    if (
      b.kind === 'vehicle' &&
      !b.bogiesOff &&
      (Math.abs(b.roll) > 0.5 || b.z > 0.4 || b.damage > 0.7)
    ) {
      this.detachBogies(b);
    }
    if (b.asleep) return;
    const still =
      b.onGround &&
      Math.hypot(b.vs, b.vy, b.vz) < 0.08 &&
      Math.abs(b.wYaw) + Math.abs(b.wRoll) + Math.abs(b.wPitch) < 0.08;
    b.sleepS = still ? b.sleepS + h : 0;
    if (b.sleepS > 0.5) {
      b.asleep = true;
      b.vs = b.vy = b.vz = b.wYaw = b.wRoll = b.wPitch = 0;
    }
  }

  /** Origin height at which the body rests on the ground for its current roll and pitch. */
  private supportZ(b: CrashBody): number {
    if (b.kind === 'bogie') return 0.3;
    if (b.kind === 'buffer') return 0;
    const bottom = b.bogiesOff ? b.bottomM : 0.35;
    return (
      GROUND_LEVEL -
      bottom * Math.cos(b.roll) * Math.cos(b.pitch) +
      (b.widthM / 2) * Math.abs(Math.sin(b.roll)) +
      (b.lengthM / 2 - Math.max(b.crushFront, b.crushRear)) * Math.abs(Math.sin(b.pitch)) * 0.5
    );
  }

  private derailBody(b: CrashBody): void {
    if (!b.onRails) return;
    b.onRails = false;
    b.asleep = false;
    b.sleepS = 0;
    b.z = 0;
    b.onGround = true;
  }

  private detachBogies(b: CrashBody): void {
    b.bogiesOff = true;
    const list = this.bogieBodies.get(b.owner);
    if (!list) return;
    const ax = Math.cos(b.yaw);
    const ay = Math.sin(b.yaw);
    for (const k of [0, 1]) {
      const sign = k === 0 ? 1 : -1;
      const bogie = this.makeBody({
        kind: 'bogie',
        owner: b.owner,
        index: b.index * 2 + k,
        train: -1,
        lengthM: 3,
        widthM: 2.4,
        heightM: 1.0,
        massKg: 6000,
        s: b.s + ax * sign * b.bogieOffsetM,
        v: b.vs * 0.8 + (this.rng() - 0.5) * 2,
        yaw0: b.yaw + (this.rng() - 0.5) * 0.6,
        maxCrushM: 0,
        crushForceN: 0,
        bogieOffsetM: 0,
        colour: 0x1e1e1e,
        bottomM: 0,
      });
      bogie.y = b.y + ay * sign * b.bogieOffsetM;
      bogie.vy = b.vy * 0.8 + (this.rng() - 0.5) * 2;
      bogie.z = 0.3;
      bogie.onRails = false;
      bogie.wYaw = (this.rng() - 0.5) * 1.5;
      list[b.index * 2 + k] = bogie;
    }
  }

  private broadphase(): void {
    const n = this.bodies.length;
    this.order.length = n;
    for (let i = 0; i < n; i++) this.order[i] = i;
    const bodies = this.bodies;
    this.order.sort((a, b) => bodies[a]!.s - bodies[b]!.s || a - b);
    this.pairs.length = 0;
    for (let oi = 0; oi < n; oi++) {
      const i = this.order[oi]!;
      const A = bodies[i]!;
      for (let oj = oi + 1; oj < n; oj++) {
        const j = this.order[oj]!;
        const B = bodies[j]!;
        const reach = (A.lengthM + B.lengthM) / 2 + 2;
        if (B.s - A.s > reach) break;
        if (Math.abs(A.y - B.y) > reach) continue;
        if (A.asleep && B.asleep) continue;
        if (A.invMass === 0 && B.invMass === 0) continue;
        // Rail-bound vehicles of one train interact only through their couplers.
        if (A.onRails && B.onRails && A.train === B.train && A.train >= 0) continue;
        if (this.coupled(i, j)) continue;
        this.pairs.push(i, j);
      }
    }
  }

  private coupled(i: number, j: number): boolean {
    for (const c of this.couplers) {
      if (!c.broken && ((c.a === i && c.b === j) || (c.a === j && c.b === i))) return true;
    }
    return false;
  }

  // ---------------------------------------------------------------- constraints

  private solveCoupler(c: Coupler, h: number, it: number): void {
    const A = this.bodies[c.a]!;
    const B = this.bodies[c.b]!;
    // A's trailing end (-x) meets B's leading end (+x).
    const aAx = Math.cos(A.yaw);
    const aAy = Math.sin(A.yaw);
    const aBx = Math.cos(B.yaw);
    const aBy = Math.sin(B.yaw);
    const hA = A.lengthM / 2 - A.crushRear;
    const hB = B.lengthM / 2 - B.crushFront;
    const pAx = A.s - aAx * hA;
    const pAy = A.y - aAy * hA;
    const pBx = B.s + aBx * hB;
    const pBy = B.y + aBy * hB;
    const dx = pBx - pAx;
    const dy = pBy - pAy;
    // Outward direction from A's trailing end.
    const ux = -aAx;
    const uy = -aAy;
    const sep = dx * ux + dy * uy;

    if (it === 0) {
      const angle = Math.abs(wrapAngle(A.yaw - B.yaw));
      if (angle > COUPLER_BREAK_ANGLE || Math.hypot(dx, dy) > COUPLER_BREAK_STRETCH_M) {
        c.broken = true;
        return;
      }
    }

    if (sep < 0) {
      // Buffers in compression: push apart along A's axis; ends crumple under the crush force.
      const rAx = pAx - A.s;
      const rAy = pAy - A.y;
      const rBx = pBx - B.s;
      const rBy = pBy - B.y;
      const vn = this.relNormalVel(A, B, rAx, rAy, rBx, rBy, ux, uy);
      if (vn < 0) {
        const k = this.effMass(A, rAx, rAy, ux, uy) + this.effMass(B, rBx, rBy, ux, uy);
        if (k < 1e-12) return;
        let j = -vn / k;
        const capA = A.crushRear < A.maxCrushM ? A.crushForceN : Infinity;
        const capB = B.crushFront < B.maxCrushM ? B.crushForceN : Infinity;
        const cap = Math.min(capA, capB) * h;
        let capped = false;
        if (j > cap) {
          j = cap;
          capped = true;
        }
        this.applyImpulse(A, rAx, rAy, -j * ux, -j * uy, h);
        this.applyImpulse(B, rBx, rBy, j * ux, j * uy, h);
        if (it === 0 && j / h > BUCKLE_FORCE_N && this.rng() < this.buckleChance(B)) {
          this.buckle(A, B, this.severity);
        }
        if (capped && it === 0) {
          const pen = -sep;
          if (capA !== Infinity) A.crushRear = Math.min(A.maxCrushM, A.crushRear + pen * 0.5);
          if (capB !== Infinity) B.crushFront = Math.min(B.maxCrushM, B.crushFront + pen * 0.5);
          A.damage = Math.min(1, A.damage + pen * 0.15);
          B.damage = Math.min(1, B.damage + pen * 0.15);
        }
      }
      if (A.crushRear >= A.maxCrushM && B.crushFront >= B.maxCrushM) {
        this.correct(A, B, ux, uy, -sep * 0.3);
      }
      return;
    }

    // Draw-gear: keep the ends together within the slack (lateral and tension).
    const dist = Math.hypot(dx, dy);
    if (dist <= COUPLER_SLACK_M) return;
    const nx = dx / dist;
    const ny = dy / dist;
    const rAx = pAx - A.s;
    const rAy = pAy - A.y;
    const rBx = pBx - B.s;
    const rBy = pBy - B.y;
    const vn = this.relNormalVel(A, B, rAx, rAy, rBx, rBy, nx, ny);
    const k = this.effMass(A, rAx, rAy, nx, ny) + this.effMass(B, rBx, rBy, nx, ny);
    if (vn > 0 && k > 1e-12) {
      const j = vn / k;
      this.applyImpulse(A, rAx, rAy, j * nx, j * ny, h);
      this.applyImpulse(B, rBx, rBy, -j * nx, -j * ny, h);
    }
    this.correct(A, B, -nx, -ny, (dist - COUPLER_SLACK_M) * 0.3);
  }

  /**
   * Chance per substep that an overloaded coupler kinks the rake: higher for harder crashes,
   * fading with distance from the impact (the shock is absorbed along the train).
   */
  private buckleChance(b: CrashBody): number {
    const reach = this.severity * 12;
    const fade = Math.max(0, 1 - Math.abs(b.s - this.setup.impact.s) / Math.max(1, reach));
    return Math.min(0.5, Math.max(0, this.severity - 3) * 0.03) * fade;
  }

  private buckle(A: CrashBody, B: CrashBody, closing: number): void {
    // The vehicle being shoved from behind is the one that kinks out of line.
    const victim = B.onRails ? B : A.onRails ? A : null;
    if (!victim || victim.train < 0) return;
    const side = -this.lastSide[victim.train]!;
    this.lastSide[victim.train] = side;
    this.derailBody(victim);
    const k = Math.min(2.5, closing / 6);
    victim.vy += side * (0.5 + this.rng() * 0.8) * k;
    victim.wYaw += side * (0.12 + this.rng() * 0.2) * k;
  }

  private solveContact(A: CrashBody, B: CrashBody, h: number, it: number): void {
    // Riding on top of another body: no side contact.
    if (A.z >= B.z + B.heightM - 0.6 || B.z >= A.z + A.heightM - 0.6) return;
    this.segment(A, this.segA);
    this.segment(B, this.segB);
    closestPoints(this.segA, this.segB, this.cp);
    const rA = A.widthM / 2;
    const rB = B.widthM / 2;
    let dx = this.cp.bx - this.cp.ax;
    let dy = this.cp.by - this.cp.ay;
    let dist = Math.hypot(dx, dy);
    if (dist >= rA + rB) return;
    if (dist < 1e-6) {
      dx = B.s >= A.s ? 1 : -1;
      dy = 0;
      dist = 1;
    }
    const nx = dx / dist;
    const ny = dy / dist;
    const pen = rA + rB - dist;
    const cx = this.cp.ax + nx * rA;
    const cy = this.cp.ay + ny * rA;
    const rAx = cx - A.s;
    const rAy = cy - A.y;
    const rBx = cx - B.s;
    const rBy = cy - B.y;

    // End-on contacts crumple the end that is hit.
    const aAx = Math.cos(A.yaw);
    const aAy = Math.sin(A.yaw);
    const aBx = Math.cos(B.yaw);
    const aBy = Math.sin(B.yaw);
    const lxA = rAx * aAx + rAy * aAy;
    const lxB = rBx * aBx + rBy * aBy;
    const endA = Math.abs(nx * aAx + ny * aAy) > 0.6 && Math.abs(lxA) > A.lengthM / 2 - 3.5;
    const endB = Math.abs(nx * aBx + ny * aBy) > 0.6 && Math.abs(lxB) > B.lengthM / 2 - 3.5;
    const crushA = endA ? (lxA > 0 ? A.crushFront : A.crushRear) < A.maxCrushM : false;
    const crushB = endB ? (lxB > 0 ? B.crushFront : B.crushRear) < B.maxCrushM : false;

    const vn = this.relNormalVel(A, B, rAx, rAy, rBx, rBy, nx, ny);
    let capped = false;
    if (vn < 0) {
      // A blow from the side knocks a rail-bound vehicle off the track.
      if (Math.abs(ny) > 0.35 && -vn > 0.5) {
        if (A.onRails) this.derailBody(A);
        if (B.onRails) this.derailBody(B);
      }
    }
    if (vn < 0) {
      const kA = this.effMass(A, rAx, rAy, nx, ny);
      const kB = this.effMass(B, rBx, rBy, nx, ny);
      if (kA + kB < 1e-12) return;
      let j = (-(1 + RESTITUTION) * vn) / (kA + kB);
      if (crushA || crushB) {
        const cap =
          Math.min(crushA ? A.crushForceN : Infinity, crushB ? B.crushForceN : Infinity) * h;
        if (j > cap) {
          j = cap;
          capped = true;
        }
      }
      this.applyImpulse(A, rAx, rAy, -j * nx, -j * ny, h);
      this.applyImpulse(B, rBx, rBy, j * nx, j * ny, h);
      this.anchorHit(A, j);
      this.anchorHit(B, j);

      // Friction along the contact (scraping).
      const tx = -ny;
      const ty = nx;
      const vt = this.relNormalVel(A, B, rAx, rAy, rBx, rBy, tx, ty);
      const kt = this.effMass(A, rAx, rAy, tx, ty) + this.effMass(B, rBx, rBy, tx, ty);
      if (kt > 1e-12) {
        const jt = Math.max(-MU_CONTACT * j, Math.min(MU_CONTACT * j, -vt / kt));
        this.applyImpulse(A, rAx, rAy, -jt * tx, -jt * ty, h);
        this.applyImpulse(B, rBx, rBy, jt * tx, jt * ty, h);
      }

      if (it === 0) {
        const dmg = Math.min(0.2, (j / (A.massKg + B.massKg)) * 0.5);
        A.damage = Math.min(1, A.damage + dmg);
        B.damage = Math.min(1, B.damage + dmg);
        this.launchDebris(A, B, cx, cy, nx, ny, j);
        if (endA && endB && -vn > 6) this.maybeOverride(A, B, lxA, lxB, -vn);
      }
    }
    if (capped && it === 0) {
      const key = this.bodies.indexOf(A) * 4096 + this.bodies.indexOf(B);
      if (!this.crushedThisStep.has(key)) {
        this.crushedThisStep.add(key);
        if (crushA) {
          if (lxA > 0) A.crushFront = Math.min(A.maxCrushM, A.crushFront + pen * 0.5);
          else A.crushRear = Math.min(A.maxCrushM, A.crushRear + pen * 0.5);
        }
        if (crushB) {
          if (lxB > 0) B.crushFront = Math.min(B.maxCrushM, B.crushFront + pen * 0.5);
          else B.crushRear = Math.min(B.maxCrushM, B.crushRear + pen * 0.5);
        }
      }
    }
    if (!capped && pen > 0.02) this.correct(A, B, nx, ny, (pen - 0.02) * 0.4);
  }

  private maybeOverride(
    A: CrashBody,
    B: CrashBody,
    lxA: number,
    lxB: number,
    closing: number,
  ): void {
    const key = this.bodies.indexOf(A) * 4096 + this.bodies.indexOf(B);
    if (this.overridden.has(key)) return;
    const fullA = (lxA > 0 ? A.crushFront : A.crushRear) >= A.maxCrushM * 0.85;
    const fullB = (lxB > 0 ? B.crushFront : B.crushRear) >= B.maxCrushM * 0.85;
    if (!fullA && !fullB) return;
    if (A.invMass === 0 || B.invMass === 0) return;
    this.overridden.add(key);
    // The lighter vehicle is lifted and rides up over the heavier one's end.
    const rider = A.massKg < B.massKg ? A : B.massKg < A.massKg ? B : this.rng() < 0.5 ? A : B;
    const lx = rider === A ? lxA : lxB;
    this.derailBody(rider);
    rider.vz = Math.min(4.5, 0.25 * closing);
    rider.wPitch = (lx > 0 ? 1 : -1) * Math.min(0.9, 0.05 * closing);
    rider.onGround = false;
  }

  private anchorHit(b: CrashBody, j: number): void {
    if (!b.anchored) return;
    b.anchorImpulse += j;
    if (b.anchorImpulse < BUFFER_BREAK_IMPULSE) return;
    b.anchored = false;
    b.invMass = 1 / b.massKg;
    b.invInertia = 12 / (b.massKg * (b.lengthM * b.lengthM + b.widthM * b.widthM));
    b.damage = 1;
  }

  /** Inverse effective mass of a body for an impulse along n at offset r. */
  private effMass(b: CrashBody, rx: number, ry: number, nx: number, ny: number): number {
    if (b.invMass === 0) return 0;
    if (b.onRails) return b.invMass * nx * nx;
    const rn = rx * ny - ry * nx;
    return b.invMass + rn * rn * b.invInertia;
  }

  private pointVel(b: CrashBody, rx: number, ry: number, out: { x: number; y: number }): void {
    if (b.onRails || b.invMass === 0) {
      out.x = b.vs;
      out.y = b.vy;
      return;
    }
    out.x = b.vs - b.wYaw * ry;
    out.y = b.vy + b.wYaw * rx;
  }

  private relNormalVel(
    A: CrashBody,
    B: CrashBody,
    rAx: number,
    rAy: number,
    rBx: number,
    rBy: number,
    nx: number,
    ny: number,
  ): number {
    this.pointVel(B, rBx, rBy, this.tmp);
    const bx = this.tmp.x;
    const by = this.tmp.y;
    this.pointVel(A, rAx, rAy, this.tmp);
    return (bx - this.tmp.x) * nx + (by - this.tmp.y) * ny;
  }

  private applyImpulse(
    b: CrashBody,
    rx: number,
    ry: number,
    jx: number,
    jy: number,
    h: number,
  ): void {
    if (b.invMass === 0) return;
    if (b.onRails) {
      // The rails take side loads up to the flange force; beyond that the wheels climb out.
      if (Math.abs(jy) > FLANGE_FRACTION * b.massKg * G * h) {
        this.derailBody(b);
      } else {
        b.vs += jx * b.invMass;
        return;
      }
    }
    b.asleep = false;
    b.sleepS = 0;
    b.vs += jx * b.invMass;
    b.vy += jy * b.invMass;
    b.wYaw += (rx * jy - ry * jx) * b.invInertia;
  }

  /** Push two bodies apart by `depth` along n (from A to B), weighted by inverse mass. */
  private correct(A: CrashBody, B: CrashBody, nx: number, ny: number, depth: number): void {
    const wA = A.onRails ? A.invMass * nx * nx : A.invMass;
    const wB = B.onRails ? B.invMass * nx * nx : B.invMass;
    const sum = wA + wB;
    if (sum <= 0) return;
    const cA = (depth * wA) / sum;
    const cB = (depth * wB) / sum;
    A.s -= nx * cA;
    B.s += nx * cB;
    if (!A.onRails) A.y -= ny * cA;
    if (!B.onRails) B.y += ny * cB;
  }

  private segment(b: CrashBody, out: { x0: number; y0: number; x1: number; y1: number }): void {
    const ax = Math.cos(b.yaw);
    const ay = Math.sin(b.yaw);
    const r = b.widthM / 2;
    const front = Math.max(0, b.lengthM / 2 - r - b.crushFront);
    const rear = Math.max(0, b.lengthM / 2 - r - b.crushRear);
    out.x0 = b.s - ax * rear;
    out.y0 = b.y - ay * rear;
    out.x1 = b.s + ax * front;
    out.y1 = b.y + ay * front;
  }

  // ---------------------------------------------------------------- debris and effects

  private launchDebris(
    A: CrashBody,
    B: CrashBody,
    cx: number,
    cy: number,
    nx: number,
    ny: number,
    j: number,
  ): void {
    if (j > 4000) this.logImpact(cx, cy, Math.min(1, j / 1.5e5), 1.5 + this.rng() * 1.5);
    this.debrisBudget += j / 30000;
    while (this.debrisBudget >= 1 && this.debrisLaunched < MAX_DEBRIS) {
      this.debrisBudget -= 1;
      const src = this.rng() < 0.5 ? A : B;
      const d = this.debris[this.debrisLaunched++]!;
      const r = this.rng();
      d.kind = r < 0.5 ? 0 : r < 0.8 ? 1 : 2;
      if (src.kind === 'loco' && src.damage > 0.3 && this.rng() < 0.05) d.kind = 3;
      d.colour = d.kind === 0 ? src.colour : d.kind === 1 ? 0x9fc4d8 : 0x2a2a2a;
      d.size = d.kind === 1 ? 0.25 + this.rng() * 0.35 : d.kind === 3 ? 1 : 0.4 + this.rng() * 0.9;
      const side = this.rng() < 0.5 ? -1 : 1;
      const spread = 2 + this.rng() * 7;
      d.s = cx;
      d.y = cy;
      d.z = 1 + this.rng() * 2.5;
      d.vs = (A.vs + B.vs) * 0.5 + -ny * side * spread + (this.rng() - 0.5) * 3;
      d.vy = (A.vy + B.vy) * 0.5 + nx * side * spread + (this.rng() - 0.5) * 3;
      d.vz = 2 + this.rng() * 6;
      d.rx = this.rng() * 6;
      d.ry = this.rng() * 6;
      d.rz = this.rng() * 6;
      d.wx = (this.rng() - 0.5) * 18;
      d.wy = (this.rng() - 0.5) * 18;
      d.wz = (this.rng() - 0.5) * 18;
      d.resting = false;
      d.active = true;
    }
  }

  private stepDebris(dt: number): void {
    for (const d of this.debris) {
      if (!d.active || d.resting) continue;
      d.vz -= G * dt;
      d.s += d.vs * dt;
      d.y += d.vy * dt;
      d.z += d.vz * dt;
      d.rx += d.wx * dt;
      d.ry += d.wy * dt;
      d.rz += d.wz * dt;
      const floor = GROUND_LEVEL + 0.05;
      if (d.z < floor) {
        d.z = floor;
        d.vz = d.vz < -2 ? -d.vz * 0.3 : 0;
        d.vs *= 0.6;
        d.vy *= 0.6;
        d.wx *= 0.5;
        d.wy *= 0.5;
        d.wz *= 0.5;
        if (Math.hypot(d.vs, d.vy, d.vz) < 0.3) {
          d.resting = true;
          // Lie flat.
          d.rx = Math.round(d.rx / Math.PI) * Math.PI;
          d.rz = Math.round(d.rz / Math.PI) * Math.PI;
        }
      }
    }
  }

  private logImpact(s: number, y: number, z: number, strength: number): void {
    const last = this.impacts[(this.impactCount + MAX_IMPACTS - 1) % MAX_IMPACTS]!;
    if (
      this.impactCount > 0 &&
      this.timeS - last.timeS < 0.12 &&
      Math.hypot(last.s - s, last.y - y) < 6
    ) {
      last.strength = Math.max(last.strength, strength);
      return;
    }
    const e = this.impacts[this.impactCount % MAX_IMPACTS]!;
    e.s = s;
    e.y = y;
    e.z = z;
    e.strength = strength;
    e.timeS = this.timeS;
    this.impactCount++;
  }

  // ---------------------------------------------------------------- track helpers

  private slopeOf(train: number, s: number): number {
    const f = this.lineFns[train]!;
    return (f(s + 1) - f(s - 1)) / 2;
  }

  private readonly sampleA = { x: 0, y: 0, z: 0, heading: 0, grade: 0 };
  private readonly sampleB = { x: 0, y: 0, z: 0, heading: 0, grade: 0 };

  /** Signed track curvature dh/ds (left-hand curves positive). */
  private curvature(s: number): number {
    const a = this.track.sample(s - 2, this.sampleA).heading;
    const b = this.track.sample(s + 2, this.sampleB).heading;
    return (b - a) / 4;
  }
}

function wrapAngle(a: number): number {
  let x = a;
  while (x > Math.PI) x -= 2 * Math.PI;
  while (x < -Math.PI) x += 2 * Math.PI;
  return x;
}

/** Closest points between two 2D segments (Ericson, Real-Time Collision Detection §5.1.9). */
function closestPoints(
  p: { x0: number; y0: number; x1: number; y1: number },
  q: { x0: number; y0: number; x1: number; y1: number },
  out: { ax: number; ay: number; bx: number; by: number },
): void {
  const d1x = p.x1 - p.x0;
  const d1y = p.y1 - p.y0;
  const d2x = q.x1 - q.x0;
  const d2y = q.y1 - q.y0;
  const rx = p.x0 - q.x0;
  const ry = p.y0 - q.y0;
  const a = d1x * d1x + d1y * d1y;
  const e = d2x * d2x + d2y * d2y;
  const f = d2x * rx + d2y * ry;
  let s = 0;
  let t = 0;
  if (a <= 1e-9 && e <= 1e-9) {
    s = t = 0;
  } else if (a <= 1e-9) {
    t = clamp01(f / e);
  } else {
    const c = d1x * rx + d1y * ry;
    if (e <= 1e-9) {
      s = clamp01(-c / a);
    } else {
      const b = d1x * d2x + d1y * d2y;
      const denom = a * e - b * b;
      s = denom > 1e-9 ? clamp01((b * f - c * e) / denom) : 0;
      t = (b * s + f) / e;
      if (t < 0) {
        t = 0;
        s = clamp01(-c / a);
      } else if (t > 1) {
        t = 1;
        s = clamp01((b - c) / a);
      }
    }
  }
  out.ax = p.x0 + d1x * s;
  out.ay = p.y0 + d1y * s;
  out.bx = q.x0 + d2x * t;
  out.by = q.y0 + d2y * t;
}

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}
