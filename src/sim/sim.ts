import { SIM_DT } from './clock';
import type { SimEvent } from './events';
import { makeConsist, type Consist } from './physics/forces';
import { initialTrain, stepTrain, type TrainState } from './physics/train';
import { Interlocking } from './signalling/interlocking';
import { RailNetwork, mainLine, signalDir, signalLine } from './track/network';
import { Track } from './track/track';
import { AiTrain, type AiContext } from './traffic/aiTrain';
import { Dispatcher, type HoldReason } from './traffic/dispatcher';
import {
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
  playerType?: Pick<TrainType, 'name' | 'priority' | 'class' | 'dwellS'>;
  playerStops?: StopSpec[];
  traffic?: AiSetup[];
  weather?: WeatherId;
}

export type SimStatus = 'running' | 'failed' | 'finished';

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
  /** Events produced since the last `drainEvents()` call. */
  private events: SimEvent[] = [];
  private overspeeding = false;
  private stoppedAt = new Set<string>();
  private pending: AiSetup[];
  private watched: { id: string; aspect: Aspect } | null = null;
  private passingNoticed = new Set<string>();
  private readonly aiCtx: AiContext;

  constructor(readonly setup: SimSetup) {
    this.track = new Track(setup.route);
    this.net = new RailNetwork(setup.route, this.track.length);
    this.consist = makeConsist(setup.loco, setup.rake);
    this.train = initialTrain(setup.startS);
    this.weatherId = setup.weather ?? 'clear';
    this.weather = WEATHER[this.weatherId];
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
    this.aiCtx = {
      nextStopSignal: (m) => this.nextStopSignalFor(m),
      nextStop: (m) => this.nextStopFor(m),
      speedCapMs: (m) => this.speedCapKmhFor(m) / 3.6,
    };
    this.spawnDue();
    this.updateSignalling();
  }

  get movers(): Mover[] {
    return [this.player, ...this.ai];
  }

  step(dt = SIM_DT): void {
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
    this.updateSignalling();
    this.checkSpeed();
    this.checkStations();
    this.checkNotifications();
    if (this.train.s >= this.track.length) {
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
      best = { def: sig, aspect: this.aspectOf(sig), distM: d, visible: d <= this.weather.visibilityM };
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
    for (let i = this.ai.length - 1; i >= 0; i--) {
      const t = this.ai[i]!;
      if ((t.dir === 1 && t.frontS >= this.track.length - 1) || (t.dir === -1 && t.frontS <= 1)) {
        this.ai.splice(i, 1);
      }
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
        this.emit({ type: 'SPAD', timeS: this.timeS, signalId: sig.id, speedKmh });
        this.status = 'failed';
        this.failReason = `Signal ${sig.label} passed at danger (SPAD) at ${speedKmh.toFixed(0)} km/h`;
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
