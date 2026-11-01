// Deterministic kinematic driver for AI trains. It accelerates to line speed, follows a
// braking curve to stop short of red signals and at its booked stops, dwells, then leaves
// when the starter clears. It never passes a signal at danger.
import type { Consist } from '../physics/forces';
import type { Aspect, Dir, SignalDef, TrainClass, TrainType } from '../types';
import { makeStops, type Mover, type StopState } from './mover';

/** Stand this far short of a red signal (m). */
const SIGNAL_STAND_M = 20;

export interface AiContext {
  /** Next stop signal ahead on this train's route, with its aspect and distance (m). */
  nextStopSignal(m: Mover): { sig: SignalDef; aspect: Aspect; distM: number } | null;
  /** Next booked, not yet completed stop ahead, with distance to its stop mark (m). */
  nextStop(m: Mover): { stop: StopState; distM: number } | null;
  /** Permitted speed for the whole train at its position (m/s). */
  speedCapMs(m: Mover): number;
}

export class AiTrain implements Mover {
  readonly isPlayer = false;
  readonly loopRoutes = new Set<string>();
  readonly stops: Map<string, StopState>;
  readonly lengthM: number;
  readonly priority: number;
  readonly trainClass: TrainClass;
  readonly label: string;
  frontS: number;
  speedMs = 0;

  constructor(
    readonly id: string,
    readonly type: TrainType,
    readonly consist: Consist,
    readonly dir: Dir,
    startS: number,
    stops: Parameters<typeof makeStops>[0],
  ) {
    this.frontS = startS;
    this.lengthM = consist.lengthM;
    this.priority = type.priority;
    this.trainClass = type.class;
    this.label = type.name;
    this.stops = makeStops(stops, type.dwellS);
  }

  step(dt: number, ctx: AiContext): void {
    const b = this.type.aiDecelMs2;
    let authority = Infinity;
    const sig = ctx.nextStopSignal(this);
    if (sig && sig.aspect === 'RED') authority = sig.distM - SIGNAL_STAND_M;
    const stop = ctx.nextStop(this);
    if (stop) authority = Math.min(authority, stop.distM);

    const cap = ctx.speedCapMs(this);
    const curve = authority === Infinity ? Infinity : Math.sqrt(2 * b * Math.max(0, authority));
    const target = Math.min(cap, curve);
    if (this.speedMs < target) {
      this.speedMs = Math.min(target, this.speedMs + this.type.aiAccelMs2 * dt);
    } else {
      // Brake up to ~2x service rate if the authority shortened suddenly.
      this.speedMs = Math.max(target, this.speedMs - 2 * b * dt);
    }
    let move = this.speedMs * dt;
    if (move >= authority) {
      move = Math.max(0, authority);
      this.speedMs = 0;
    }
    if (authority <= 0.05) this.speedMs = 0;
    this.frontS += this.dir * move;
  }
}
