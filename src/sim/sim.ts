import { SIM_DT } from './clock';
import type { SimEvent } from './events';
import { makeConsist, type Consist } from './physics/forces';
import { initialTrain, stepTrain, type TrainState } from './physics/train';
import { aspectAt } from './signalling/signal';
import { Track } from './track/track';
import type { Controls, LocoParams, RakeParams, RouteDef } from './types';

const OVERSPEED_TOLERANCE_KMH = 2;
const STATION_STOP_WINDOW_M = 30;

export interface SimSetup {
  route: RouteDef;
  loco: LocoParams;
  rake: RakeParams;
  /** Initial chainage of the train front. */
  startS: number;
}

export type SimStatus = 'running' | 'failed' | 'finished';

/** The whole deterministic game simulation for one run. */
export class Sim {
  readonly track: Track;
  readonly consist: Consist;
  readonly train: TrainState;
  readonly controls: Controls = {
    reverser: 1,
    notch: 0,
    autoBrake: 0,
    indepBrake: 1,
    emergency: false,
  };
  timeS = 0;
  status: SimStatus = 'running';
  failReason = '';
  /** Events produced since the last `drainEvents()` call. */
  private events: SimEvent[] = [];
  private overspeeding = false;
  private stoppedAt = new Set<string>();

  constructor(readonly setup: SimSetup) {
    this.track = new Track(setup.route);
    this.consist = makeConsist(setup.loco, setup.rake);
    this.train = initialTrain(setup.startS);
  }

  step(dt = SIM_DT): void {
    if (this.status !== 'running') return;
    const prevS = this.train.s;
    stepTrain(this.train, this.consist, this.controls, this.track, dt);
    this.timeS += dt;
    this.checkSignals(prevS);
    this.checkSpeed();
    this.checkStations();
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

  /** Lowest speed limit over the whole train length (restrictions apply until the rear clears). */
  currentLimitKmh(): number {
    const maxKmh = this.consist.loco.maxSpeedKmh;
    const front = this.train.s;
    const rear = front - this.consist.lengthM;
    let limit = maxKmh;
    for (const lim of this.setup.route.speedLimits) {
      if (lim.fromM < front && lim.toM > rear) limit = Math.min(limit, lim.kmh);
    }
    return limit;
  }

  private checkSignals(prevS: number): void {
    const s = this.train.s;
    for (const sig of this.setup.route.signals) {
      if (prevS < sig.chainageM && s >= sig.chainageM) {
        const aspect = aspectAt(sig, this.timeS);
        if (aspect === 'RED') {
          const speedKmh = Math.abs(this.train.v) * 3.6;
          this.emit({ type: 'SPAD', timeS: this.timeS, signalId: sig.id, speedKmh });
          this.status = 'failed';
          this.failReason = `Signal ${sig.label} passed at danger (SPAD) at ${speedKmh.toFixed(0)} km/h`;
        } else {
          this.emit({ type: 'SIGNAL_PASSED', timeS: this.timeS, signalId: sig.id, aspect });
        }
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
      const offset = this.train.s - st.stopMarkM;
      if (!this.stoppedAt.has(st.id) && Math.abs(offset) <= STATION_STOP_WINDOW_M) {
        this.stoppedAt.add(st.id);
        this.emit({ type: 'STATION_STOP', timeS: this.timeS, stationId: st.id, offsetM: offset });
      }
    }
  }

  private emit(e: SimEvent): void {
    this.events.push(e);
  }
}
