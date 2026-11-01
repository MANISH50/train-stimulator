import { SIM_DT } from './clock';
import { CrashSim, type CrashKind, type CrashSetup, type CrashTrainSpec } from './crash/crashSim';
import { classify, findContact, lateralAt, type Contact } from './crash/detect';
import { hashString } from './rng';
import type { SimEvent } from './events';
import { makeConsist, type Consist } from './physics/forces';
import { initialTrain, stepTrain, type TrainState } from './physics/train';
import { Interlocking } from './signalling/interlocking';
import { RailNetwork, mainLine, signalDir, signalLine } from './track/network';
import { Track } from './track/track';
import { AiTrain, type AiContext } from './traffic/aiTrain';
import { Dispatcher, type HoldReason } from './traffic/dispatcher';
import {
  FOULING_M,
  STOP_WINDOW_M,
  aheadOf,
  makeStops,
  occupies,
  rearS,
  stopMarkFor,
  type Mover,
  type StopState,
} from './traffic/mover';
import type {
  Aspect,
  Controls,
  Dir,
  Livery,
  LocoParams,
  RakeParams,
  RouteDef,
  SignalDef,
  Station,
  StopSpec,
  TrainClass,
  TrainType,
  WeatherId,
} from './types';
import { WEATHER, type WeatherEffects } from './weather';

const OVERSPEED_TOLERANCE_KMH = 2;
// Accident thresholds: game rules, approximate (docs/DESIGN.md "Accidents").
/** Derail on points when running faster than this multiple of the turnout's speed limit. */
export const POINTS_DERAIL_FACTOR = 1.6;
/** Derail on a curve above this unbalanced lateral acceleration v²/R (m/s²). */
export const CURVE_DERAIL_MS2 = 2.5;
/** Contact with a buffer stop at or below this speed is only a bump (km/h). */
export const BUFFER_SAFE_KMH = 8;
/** A turnout is where a line's lateral offset changes faster than this (m per m). */
const TURNOUT_SLOPE = 0.004;
/** Farthest an AI driver can see an obstruction in clear weather (m). */
const AI_SIGHTING_M = 1200;
/** Notify about a train on the other line when it comes this close (m). */
const PASSING_NOTICE_M = 700;

export interface AiSetup {
  id: string;
  type: TrainType;
  loco: LocoParams;
  rake: RakeParams;
  dir: Dir;
  spawnAtS: number;
  spawnS: number;
  stops: StopSpec[];
}

export interface SimSetup {
  route: RouteDef;
  loco: LocoParams;
  rake: RakeParams;
  /** Initial chainage of the train front. */
  startS: number;
  /** The player's train type (name, priority, class); defaults to a generic express. */
  playerType?: Pick<TrainType, 'name' | 'priority' | 'class' | 'dwellS'> & { livery?: Livery };
  playerStops?: StopSpec[];
  traffic?: AiSetup[];
  weather?: WeatherId;
  /**
   * Realistic consequences: a SPAD does not end the run, so the train can collide; overspeed
   * on points or curves derails; buffer stops can be overrun. Off: a SPAD fails at once.
   */
  accidents?: boolean;
  /** Seed for crash variation (deterministic). */
  seed?: string;
}

export type SimStatus = 'running' | 'failed' | 'finished' | 'crashed';

/** What the accident inquiry reports. */
export interface AccidentReport {
  kind: CrashKind;
  timeS: number;
  speedKmh: number;
  closingKmh: number;
  otherLabel?: string;
  cause: string;
  spad?: { label: string; timeS: number; speedKmh: number };
  limitKmh?: number;
}

export interface SignalView {
  def: SignalDef;
  aspect: Aspect;
  distM: number;
  /** Whether the lamp can be read from the cab in this weather (distance is always known). */
  visible: boolean;
}

class PlayerMover implements Mover {
  readonly id = 'player';
  readonly dir = 1 as const;
  readonly isPlayer = true;
  readonly loopRoutes = new Set<string>();
  frontS: number;
  speedMs = 0;
  constructor(
    readonly label: string,
    readonly priority: number,
    readonly trainClass: TrainClass,
    readonly lengthM: number,
    readonly stops: Map<string, StopState>,
    startS: number,
  ) {
    this.frontS = startS;
  }
}

/** The whole deterministic game simulation for one run. */
export class Sim {
  readonly track: Track;
  readonly net: RailNetwork;
  readonly consist: Consist;
  readonly train: TrainState;
  readonly weather: WeatherEffects;
  readonly weatherId: WeatherId;
  readonly controls: Controls = {
    reverser: 1,
    notch: 0,
    autoBrake: 0,
    indepBrake: 1,
    emergency: false,
  };
  readonly player: PlayerMover;
  readonly ai: AiTrain[] = [];
  readonly interlocking: Interlocking;
  readonly dispatcher: Dispatcher;
  timeS = 0;
  status: SimStatus = 'running';
  failReason = '';
  readonly accidents: boolean;
  /** Live crash simulation once an accident has happened. */
  crash: CrashSim | null = null;
  crashSetup: CrashSetup | null = null;
  accident: AccidentReport | null = null;
  /** Signal passed at danger while accidents are on (the train is running on past it). */
  spad: { signalId: string; label: string; timeS: number; speedKmh: number; s: number } | null =
    null;
  /** Events produced since the last `drainEvents()` call. */
  private events: SimEvent[] = [];
  private overspeeding = false;
  private stoppedAt = new Set<string>();
  private pending: AiSetup[];
  private watched: { id: string; aspect: Aspect } | null = null;
  private passingNoticed = new Set<string>();
  private bufferBumped = false;
  private settledEmitted = false;
  private readonly contact: Contact = { s: 0, y: 0, lateralM: 0 };
  private readonly aiCtx: AiContext;

  constructor(readonly setup: SimSetup) {
    this.track = new Track(setup.route);
    this.net = new RailNetwork(setup.route, this.track.length);
    this.consist = makeConsist(setup.loco, setup.rake);
    this.train = initialTrain(setup.startS);
    this.weatherId = setup.weather ?? 'clear';
    this.weather = WEATHER[this.weatherId];
    this.accidents = setup.accidents ?? false;
    const pt = setup.playerType ?? {
      name: 'Your train',
      priority: 3,
      class: 'express',
      dwellS: 20,
    };
    this.player = new PlayerMover(
      pt.name,
      pt.priority,
      pt.class,
      this.consist.lengthM,
      makeStops(setup.playerStops ?? [], pt.dwellS),
      setup.startS,
    );
    this.pending = [...(setup.traffic ?? [])].sort((a, b) => a.spawnAtS - b.spawnAtS);
    this.interlocking = new Interlocking(this.net, setup.route.signals);
    this.dispatcher = new Dispatcher(this.net, setup.route.stations, setup.route.signals);
    const timeOf = () => this.timeS;
    this.aiCtx = {
      nextStopSignal: (m) => this.nextStopSignalFor(m),
      nextStop: (m) => this.nextStopFor(m),
      speedCapMs: (m) => this.speedCapKmhFor(m) / 3.6,
      limitAhead: (m) => this.limitAheadFor(m),
      hazardAhead: (m) => this.hazardFor(m),
      get timeS() {
        return timeOf();
      },
    };
    this.spawnDue();
    this.updateSignalling();
  }

  get movers(): Mover[] {
    return [this.player, ...this.ai];
  }

  step(dt = SIM_DT): void {
    if (this.status === 'crashed') {
      this.stepCrashed(dt);
      return;
    }
    if (this.status !== 'running') return;
    const prevS = this.train.s;
    stepTrain(this.train, this.consist, this.controls, this.track, dt, this.weather);
    this.player.frontS = this.train.s;
    this.player.speedMs = Math.abs(this.train.v);
    this.timeS += dt;

    for (const t of this.ai) t.step(dt, this.aiCtx);
    this.despawn();
    this.spawnDue();

    // Aspects used for the SPAD check are the ones shown before this step's movement.
    this.checkSignals(prevS);
    if (this.status !== 'running') return;
    this.updateSignalling();
    this.checkSpeed();
    this.checkStations();
    this.checkNotifications();
    if (this.accidents) {
      this.checkCollisions();
      if (this.status === 'running') this.checkDerailment();
    }
    if (this.status === 'running') this.checkBufferStop();
    if (this.status === 'running') this.checkSpadOutcome();
    if (this.status !== 'running') return;
    if (this.setup.route.bufferStopM === undefined && this.train.s >= this.track.length) {
      this.train.s = this.track.length;
      this.train.v = 0;
      this.status = 'finished';
      this.emit({ type: 'END_OF_TRACK', timeS: this.timeS });
    }
  }

  drainEvents(): SimEvent[] {
    const out = this.events;
    this.events = [];
    return out;
  }

  aspectOf(sig: SignalDef): Aspect {
    return this.interlocking.aspect(sig.id);
  }

  /** Line the player's train is on at chainage s (main or a station loop). */
  playerLineAt(s: number): string {
    return this.net.lineFor(1, this.player.loopRoutes, s);
  }

  /** Next signal (including distants) ahead on the player's route. */
  nextSignalView(): SignalView | null {
    let best: SignalView | null = null;
    for (const sig of this.setup.route.signals) {
      if (signalDir(sig) !== 1) continue;
      const d = sig.chainageM - this.train.s;
      if (d <= 0 || (best && d >= best.distM)) continue;
      if (signalLine(sig) !== this.playerLineAt(sig.chainageM)) continue;
      best = {
        def: sig,
        aspect: this.aspectOf(sig),
        distM: d,
        visible: d <= this.weather.visibilityM,
      };
    }
    return best;
  }

  /** Why the player's train is being held at a station, if it is. */
  playerHold(): HoldReason | undefined {
    return this.dispatcher.holdReason(this.player.id);
  }

  /** Next booked stop for the player with timetable info. */
  playerNextStop(): { station: Station; stop: StopState; distM: number } | null {
    let best: { station: Station; stop: StopState; distM: number } | null = null;
    for (const st of this.setup.route.stations) {
      const stop = this.player.stops.get(st.id);
      if (!stop || stop.done) continue;
      const d = stopMarkFor(st, 1) - this.train.s;
      if (d < -STOP_WINDOW_M) continue;
      if (!best || d < best.distM) best = { station: st, stop, distM: d };
    }
    return best;
  }

  /** Lowest speed limit over the whole train length (restrictions apply until the rear clears). */
  currentLimitKmh(): number {
    return this.speedCapKmhFor(this.player);
  }

  private speedCapKmhFor(m: Mover): number {
    const front = m.frontS;
    const rear = rearS(m);
    const lo = Math.min(front, rear);
    const hi = Math.max(front, rear);
    let limit = m.isPlayer
      ? this.consist.loco.maxSpeedKmh
      : ((m as AiTrain).consist.loco.maxSpeedKmh ?? 100);
    for (const lim of this.setup.route.speedLimits) {
      if (lim.fromM < hi && lim.toM > lo) limit = Math.min(limit, lim.kmh);
    }
    for (const s of [front, (front + rear) / 2, rear]) {
      const lineLimit = this.net.speedLimitKmh(this.net.lineFor(m.dir, m.loopRoutes, s));
      if (lineLimit !== undefined) limit = Math.min(limit, lineLimit);
    }
    if (this.weather.speedCapKmh !== undefined) limit = Math.min(limit, this.weather.speedCapKmh);
    return limit;
  }

  private nextStopSignalFor(m: Mover): { sig: SignalDef; aspect: Aspect; distM: number } | null {
    let best: { sig: SignalDef; aspect: Aspect; distM: number } | null = null;
    for (const sig of this.setup.route.signals) {
      if (sig.kind === 'distant' || signalDir(sig) !== m.dir) continue;
      const d = aheadOf(m, sig.chainageM);
      if (d <= 0 || (best && d >= best.distM)) continue;
      if (signalLine(sig) !== this.net.lineFor(m.dir, m.loopRoutes, sig.chainageM)) continue;
      best = { sig, aspect: this.aspectOf(sig), distM: d };
    }
    return best;
  }

  private nextStopFor(m: Mover): { stop: StopState; distM: number } | null {
    let best: { stop: StopState; distM: number } | null = null;
    for (const st of this.setup.route.stations) {
      const stop = m.stops.get(st.id);
      if (!stop || stop.done) continue;
      const d = aheadOf(m, stopMarkFor(st, m.dir));
      if (d < -STOP_WINDOW_M) continue;
      if (!best || d < best.distM) best = { stop, distM: Math.max(0, d) };
    }
    return best;
  }

  private updateSignalling(): void {
    const movers = this.movers;
    this.dispatcher.update(this.timeS, movers);
    this.interlocking.update(this.timeS, movers, this.dispatcher);
  }

  private spawnDue(): void {
    while (this.pending.length && this.pending[0]!.spawnAtS <= this.timeS) {
      const spec = this.pending[0]!;
      const consist = makeConsist(spec.loco, spec.rake);
      const line = mainLine(spec.dir);
      const tailS = spec.spawnS - spec.dir * (consist.lengthM + 300);
      const blocked = this.movers.some(
        (m) =>
          m.dir === spec.dir && occupies(m, this.net, line, tailS, spec.spawnS + spec.dir * 300),
      );
      if (blocked) return; // try again next step
      this.pending.shift();
      this.ai.push(new AiTrain(spec.id, spec.type, consist, spec.dir, spec.spawnS, spec.stops));
    }
  }

  private despawn(): void {
    const buffer = this.setup.route.bufferStopM;
    for (let i = this.ai.length - 1; i >= 0; i--) {
      const t = this.ai[i]!;
      if (t.crashed) continue;
      const atBuffer =
        buffer !== undefined &&
        t.dir === 1 &&
        t.speedMs === 0 &&
        buffer - t.frontS < 100 &&
        [...t.stops.values()].every((st) => st.done);
      if (
        atBuffer ||
        (t.dir === 1 && t.frontS >= this.track.length - 1) ||
        (t.dir === -1 && t.frontS <= 1)
      ) {
        this.ai.splice(i, 1);
      }
    }
  }

  private limitAheadFor(m: Mover): number {
    const buffer = this.setup.route.bufferStopM;
    if (buffer === undefined || m.dir !== 1) return Infinity;
    return aheadOf(m, buffer);
  }

  /**
   * What an AI driver can see ahead that is not protected by signals: the player's train
   * after it has run past a red signal and is foul of this train's line, or wreckage.
   */
  private hazardFor(m: Mover): { distM: number; wreck: boolean } | null {
    const sight = Math.min(AI_SIGHTING_M, this.weather.visibilityM);
    if (this.crash) {
      let best = Infinity;
      for (const b of this.crash.bodies) {
        const near = m.dir * (b.s - m.frontS) - b.lengthM / 2;
        if (near <= -5 || near > sight || near >= best) continue;
        if (Math.abs(b.y - lateralAt(this.net, m, b.s)) < FOULING_M + 1) best = Math.max(0, near);
      }
      return best < Infinity ? { distM: best, wreck: true } : null;
    }
    if (!this.spad) return null;
    const p = this.player;
    const line = this.net.lineFor(m.dir, m.loopRoutes, m.frontS + m.dir * 50);
    const far = m.frontS + m.dir * sight;
    if (!occupies(p, this.net, line, m.frontS, far)) return null;
    const pLo = Math.min(p.frontS, rearS(p));
    const pHi = Math.max(p.frontS, rearS(p));
    const dist = m.dir === 1 ? pLo - m.frontS : m.frontS - pHi;
    return dist >= 0 ? { distM: dist, wreck: false } : null;
  }

  // ---------------------------------------------------------------- accidents

  private checkCollisions(): void {
    for (const t of this.ai) {
      if (t.crashed) continue;
      const c = findContact(this.net, this.player, t, this.contact);
      if (!c) continue;
      this.startCrash(classify(this.player, t, c), c.s, c.y, t);
      return;
    }
  }

  private readonly derailSample = { x: 0, y: 0, z: 0, heading: 0, grade: 0 };

  private checkDerailment(): void {
    const v = Math.abs(this.train.v);
    if (v < 5) return;
    const kmh = v * 3.6;
    const len = this.consist.lengthM;
    for (let d = 0; d <= len; d += 20) {
      const s = this.train.s - Math.min(d, len);
      const line = this.playerLineAt(s);
      const lim = this.net.speedLimitKmh(line);
      const slope = (this.net.offsetAt(line, s + 1) - this.net.offsetAt(line, s - 1)) / 2;
      if (
        lim !== undefined &&
        Math.abs(slope) > TURNOUT_SLOPE &&
        kmh > lim * POINTS_DERAIL_FACTOR
      ) {
        this.derail('points', d, slope < 0 ? 1 : -1, lim, s);
        return;
      }
      const r = this.track.radiusAt(s);
      if (Number.isFinite(r) && (v * v) / r > CURVE_DERAIL_MS2) {
        const h0 = this.track.sample(s - 2, this.derailSample).heading;
        const h1 = this.track.sample(s + 2, this.derailSample).heading;
        this.derail(
          'curve',
          d,
          h1 > h0 ? 1 : -1,
          Math.round(Math.sqrt(CURVE_DERAIL_MS2 * r) * 3.6),
          s,
        );
        return;
      }
    }
  }

  private derail(
    cause: 'points' | 'curve',
    fromFrontM: number,
    side: 1 | -1,
    limitKmh: number,
    s: number,
  ): void {
    const { loco, rake } = this.consist;
    const vehicle =
      fromFrontM < loco.lengthM
        ? 0
        : Math.min(
            rake.vehicles,
            1 + Math.floor((fromFrontM - loco.lengthM) / rake.vehicleLengthM),
          );
    const speedKmh = Math.abs(this.train.v) * 3.6;
    this.startCrash('derailment', s, lateralAt(this.net, this.player, s), undefined, {
      owner: this.player.id,
      vehicle,
      side,
    });
    const report = this.accident!;
    report.limitKmh = limitKmh;
    report.cause =
      cause === 'points'
        ? `Taken through the loop points at ${speedKmh.toFixed(0)} km/h — ${(speedKmh / limitKmh).toFixed(1)}× the ${limitKmh} km/h limit`
        : `Taken round a curve at ${speedKmh.toFixed(0)} km/h, far above what the curve allows`;
    this.failReason = report.cause;
    this.emit({ type: 'DERAILMENT', timeS: this.timeS, cause, speedKmh, limitKmh });
  }

  private checkBufferStop(): void {
    const buffer = this.setup.route.bufferStopM;
    if (buffer === undefined) return;
    if (this.train.s < buffer - 0.5) {
      if (this.train.s < buffer - 5) this.bufferBumped = false;
      return;
    }
    const kmh = Math.abs(this.train.v) * 3.6;
    if (kmh <= BUFFER_SAFE_KMH) {
      this.train.s = buffer - 0.5;
      this.train.v = Math.min(0, this.train.v);
      this.player.frontS = this.train.s;
      if (!this.bufferBumped) {
        this.bufferBumped = true;
        this.emit({ type: 'BUFFER_BUMP', timeS: this.timeS, speedKmh: kmh });
      }
      return;
    }
    if (this.accidents) {
      this.startCrash('buffer', buffer, lateralAt(this.net, this.player, buffer));
      return;
    }
    this.train.s = buffer - 0.5;
    this.train.v = 0;
    this.status = 'failed';
    this.failReason = `Buffer stop overrun at ${kmh.toFixed(0)} km/h`;
    this.emit({ type: 'BUFFER_OVERRUN', timeS: this.timeS, speedKmh: kmh });
  }

  /** After a SPAD the run ends when the train stands; if it hit nothing, it was a near miss. */
  private checkSpadOutcome(): void {
    if (!this.spad || this.train.v !== 0) return;
    const beyondM = Math.max(0, this.train.s - this.spad.s);
    this.status = 'failed';
    this.failReason =
      `Signal ${this.spad.label} passed at danger at ${this.spad.speedKmh.toFixed(0)} km/h. ` +
      `You stopped ${beyondM.toFixed(0)} m beyond it — no collision this time.`;
    this.emit({ type: 'SPAD_STOPPED', timeS: this.timeS, label: this.spad.label, beyondM });
  }

  private startCrash(
    kind: CrashKind,
    s: number,
    y: number,
    other?: AiTrain,
    derail?: CrashSetup['derail'],
  ): void {
    const pv = this.train.v;
    const trains: CrashTrainSpec[] = [
      {
        owner: this.player.id,
        label: this.player.label,
        consist: this.consist,
        dir: 1,
        frontS: this.train.s,
        v: pv,
        loopRoutes: [...this.player.loopRoutes],
        colour: colourOf(this.setup.playerType?.livery),
      },
    ];
    let closing = Math.abs(pv);
    if (other) {
      other.crashed = true;
      trains.push({
        owner: other.id,
        label: other.label,
        consist: other.consist,
        dir: other.dir,
        frontS: other.frontS,
        v: other.dir * other.speedMs,
        loopRoutes: [...other.loopRoutes],
        colour: colourOf(other.type.livery),
      });
      closing = Math.abs(pv - other.dir * other.speedMs);
    }
    const route = this.setup.route;
    this.crashSetup = {
      kind,
      seed: hashString(`${this.setup.seed ?? route.id}:${Math.round(this.timeS * 60)}`),
      trains,
      impact: { s, y },
      ...(kind === 'buffer' && route.bufferStopM !== undefined
        ? { bufferStop: { s: route.bufferStopM, y } }
        : {}),
      ...(derail ? { derail } : {}),
    };
    this.crash = new CrashSim(this.crashSetup, this.track, this.net);
    this.status = 'crashed';
    this.controls.notch = 0;
    this.controls.emergency = true;
    this.interlocking.allDanger = true;
    this.updateSignalling();
    const speedKmh = Math.abs(pv) * 3.6;
    const spad = this.spad
      ? { label: this.spad.label, timeS: this.spad.timeS, speedKmh: this.spad.speedKmh }
      : undefined;
    this.accident = {
      kind,
      timeS: this.timeS,
      speedKmh,
      closingKmh: closing * 3.6,
      otherLabel: other?.label,
      cause: spad
        ? `Signal ${spad.label} passed at danger at ${spad.speedKmh.toFixed(0)} km/h`
        : kind === 'buffer'
          ? `Approached the terminus too fast and hit the buffer stop at ${speedKmh.toFixed(0)} km/h`
          : 'The train ran into an obstruction',
      spad,
    };
    this.failReason = this.accident.cause;
    this.train.v = 0;
    this.player.speedMs = 0;
    if (kind !== 'derailment') {
      this.emit({
        type: 'COLLISION',
        timeS: this.timeS,
        kind,
        otherLabel: other?.label,
        speedKmh,
        closingKmh: closing * 3.6,
      });
    }
  }

  private stepCrashed(dt: number): void {
    this.timeS += dt;
    this.crash!.step(dt);
    for (const t of this.ai) t.step(dt, this.aiCtx);
    this.despawn();
    this.updateSignalling();
    if (this.crash!.settled && !this.settledEmitted) {
      this.settledEmitted = true;
      this.emit({ type: 'CRASH_SETTLED', timeS: this.timeS });
    }
  }

  private checkSignals(prevS: number): void {
    const s = this.train.s;
    for (const sig of this.setup.route.signals) {
      if (signalDir(sig) !== 1) continue;
      if (!(prevS < sig.chainageM && s >= sig.chainageM)) continue;
      if (signalLine(sig) !== this.playerLineAt(sig.chainageM)) continue;
      const aspect = this.aspectOf(sig);
      if (aspect === 'RED' && sig.kind !== 'distant') {
        const speedKmh = Math.abs(this.train.v) * 3.6;
        this.failReason = `Signal ${sig.label} passed at danger (SPAD) at ${speedKmh.toFixed(0)} km/h`;
        this.emit({
          type: 'SPAD',
          timeS: this.timeS,
          signalId: sig.id,
          label: sig.label,
          speedKmh,
          fatal: !this.accidents,
        });
        if (!this.accidents) {
          this.status = 'failed';
          return;
        }
        this.spad ??= {
          signalId: sig.id,
          label: sig.label,
          timeS: this.timeS,
          speedKmh,
          s: sig.chainageM,
        };
      } else {
        this.emit({ type: 'SIGNAL_PASSED', timeS: this.timeS, signalId: sig.id, aspect });
      }
    }
  }

  private checkSpeed(): void {
    const kmh = Math.abs(this.train.v) * 3.6;
    const limit = this.currentLimitKmh();
    if (!this.overspeeding && kmh > limit + OVERSPEED_TOLERANCE_KMH) {
      this.overspeeding = true;
      this.emit({ type: 'OVERSPEED', timeS: this.timeS, speedKmh: kmh, limitKmh: limit });
    } else if (this.overspeeding && kmh <= limit) {
      this.overspeeding = false;
      this.emit({ type: 'OVERSPEED_CLEARED', timeS: this.timeS });
    }
  }

  private checkStations(): void {
    if (this.train.v !== 0) return;
    for (const st of this.setup.route.stations) {
      const offset = this.train.s - stopMarkFor(st, 1);
      if (!this.stoppedAt.has(st.id) && Math.abs(offset) <= STOP_WINDOW_M) {
        this.stoppedAt.add(st.id);
        const due = this.player.stops.get(st.id)?.dueS;
        this.emit({
          type: 'STATION_STOP',
          timeS: this.timeS,
          stationId: st.id,
          offsetM: offset,
          lateS: due !== undefined ? this.timeS - due : undefined,
        });
        // A terminus ends the journey once the train has drawn up at its platform.
        const route = this.setup.route;
        const last = route.stations[route.stations.length - 1];
        if (route.bufferStopM !== undefined && last === st && !this.spad) {
          this.status = 'finished';
          this.emit({ type: 'END_OF_TRACK', timeS: this.timeS });
        }
      }
    }
  }

  private checkNotifications(): void {
    // Signal ahead clearing from danger.
    const next = this.nextSignalView();
    if (next) {
      const prev = this.watched;
      if (prev && prev.id === next.def.id && prev.aspect === 'RED' && next.aspect !== 'RED') {
        this.emit({
          type: 'SIGNAL_CLEARED',
          timeS: this.timeS,
          signalId: next.def.id,
          label: next.def.label,
          aspect: next.aspect,
          stopped: this.train.v === 0,
        });
      }
      this.watched = { id: next.def.id, aspect: next.aspect };
    } else {
      this.watched = null;
    }

    for (const r of this.dispatcher.newLoopRoutings.splice(0)) {
      const st = this.setup.route.stations.find((s) => s.id === r.stationId);
      const stationName = st?.name ?? r.stationId;
      if (r.moverId === this.player.id) {
        this.emit({
          type: 'ROUTED_LOOP',
          timeS: this.timeS,
          stationId: r.stationId,
          stationName,
          forTrain: r.forTrain,
        });
      } else if (r.forTrain === this.player.label) {
        const t = this.ai.find((a) => a.id === r.moverId);
        if (t)
          this.emit({
            type: 'TRAIN_HELD_FOR_YOU',
            timeS: this.timeS,
            trainLabel: t.label,
            stationName,
          });
      }
    }

    for (const t of this.ai) {
      if (this.passingNoticed.has(t.id)) continue;
      const gap = Math.abs(t.frontS - this.train.s);
      const approaching = t.dir === -1 ? t.frontS > this.train.s : t.speedMs > this.player.speedMs;
      if (gap < PASSING_NOTICE_M && approaching) {
        this.passingNoticed.add(t.id);
        this.emit({
          type: 'TRAIN_PASSING',
          timeS: this.timeS,
          trainLabel: t.label,
          sameDirection: t.dir === 1,
        });
      }
    }
  }

  private emit(e: SimEvent): void {
    this.events.push(e);
  }
}

function colourOf(livery: Livery | undefined): number {
  return livery ? parseInt(livery.body.replace('#', ''), 16) || 0x8a2f2a : 0x8a2f2a;
}
