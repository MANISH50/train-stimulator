// Deterministic kinematic driver for AI trains. It accelerates to line speed, follows a
// braking curve to stop short of red signals and at its booked stops, dwells, then leaves
// when the starter clears. It never passes a signal at danger.
import type { Consist } from '../physics/forces';
import type { Aspect, Dir, SignalDef, TrainClass, TrainType } from '../types';
import { makeStops, type Mover, type StopState } from './mover';

/** Stand this far short of a red signal (m). */
const SIGNAL_STAND_M = 20;
/** Driver's reaction time before an emergency application on sighting an obstruction (s). */
const REACTION_S = 1.5;
/** Emergency braking rate, approximate (m/s²). */
const EMERGENCY_MAX_MS2 = 1.2;

export interface AiContext {
  /** Next stop signal ahead on this train's route, with its aspect and distance (m). */
  nextStopSignal(m: Mover): { sig: SignalDef; aspect: Aspect; distM: number } | null;
  /** Next booked, not yet completed stop ahead, with distance to its stop mark (m). */
  nextStop(m: Mover): { stop: StopState; distM: number } | null;
  /** Permitted speed for the whole train at its position (m/s). */
  speedCapMs(m: Mover): number;
  /** Distance to the end of the line ahead (e.g. a buffer stop), or Infinity. */
  limitAhead(m: Mover): number;
  /**
   * Obstruction seen ahead: a train foul of this one's line, or wreckage. `wreck` means it
   * must not be passed at all (stop dead short of it).
   */
  hazardAhead(m: Mover): { distM: number; wreck: boolean } | null;
  readonly timeS: number;
}

export class AiTrain implements Mover {
  readonly isPlayer = false;
  readonly loopRoutes = new Map<string, string>();
  readonly stops: Map<string, StopState>;
  readonly lengthM: number;
  readonly priority: number;
  readonly trainClass: TrainClass;
  readonly label: string;
  frontS: number;
  speedMs = 0;
  /** Taken out of service by an accident (its vehicles belong to the crash sim). */
  crashed = false;
  /** Emergency brake applied on sighting an obstruction. */
  emergency = false;
  private hazardSinceS: number | null = null;

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
    if (this.crashed) return;
    const hazard = ctx.hazardAhead(this);
    if (hazard) {
      this.hazardSinceS ??= ctx.timeS;
      if (ctx.timeS - this.hazardSinceS >= REACTION_S) this.emergency = true;
    } else if (this.speedMs === 0) {
      this.hazardSinceS = null;
      this.emergency = false;
    }
    if (this.emergency) {
      const eb = Math.min(EMERGENCY_MAX_MS2, this.type.aiDecelMs2 * 2.5);
      this.speedMs = Math.max(0, this.speedMs - eb * dt);
      let move = this.speedMs * dt;
      if (hazard?.wreck && move >= hazard.distM - 10) {
        move = Math.max(0, hazard.distM - 10);
        this.speedMs = 0;
      }
      this.frontS += this.dir * move;
      return;
    }

    const b = this.type.aiDecelMs2;
    let authority = ctx.limitAhead(this) - SIGNAL_STAND_M;
    if (hazard?.wreck) authority = Math.min(authority, hazard.distM - SIGNAL_STAND_M);
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
