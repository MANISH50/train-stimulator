import type { RailNetwork } from '../track/network';
import type { Dir, LineDef, Station, StopSpec, TrainClass } from '../types';

/**
 * Two tracks closer than this (centre to centre) foul each other: a vehicle on one would strike
 * a vehicle on the other (body width 3.2 m plus clearance).
 */
export const FOULING_M = 3.4;

/** Window around a stop mark inside which a stopped train counts as at the platform (m). */
export const STOP_WINDOW_M = 30;

export interface StopState {
  dwellS: number;
  /** Booked platform number, if any. */
  platform?: number;
  dueS?: number;
  arrivedAtS?: number;
  done: boolean;
}

/** Anything that occupies track: the player's train and AI trains share this view. */
export interface Mover {
  readonly id: string;
  readonly label: string;
  readonly dir: Dir;
  readonly priority: number;
  readonly lengthM: number;
  readonly trainClass: TrainClass;
  readonly isPlayer: boolean;
  /** Chainage of the leading end and speed magnitude (m/s). */
  frontS: number;
  speedMs: number;
  /** Station id -> loop/platform line this train has been routed onto there. */
  readonly loopRoutes: Map<string, string>;
  readonly stops: Map<string, StopState>;
}

function varies(line: LineDef | undefined): boolean {
  return !!line && line.offsets.length > 1;
}

export function rearS(m: Mover): number {
  return m.frontS - m.dir * m.lengthM;
}

/** How far `s` is ahead of the mover's front in its direction of travel (negative = behind). */
export function aheadOf(m: Mover, s: number): number {
  return m.dir * (s - m.frontS);
}

/** Stopping mark for the front of a train travelling in `dir`. */
export function stopMarkFor(st: Station, dir: Dir): number {
  return dir === 1 ? st.stopMarkM : st.stopMarkM - st.platformLengthM + 80;
}

export function makeStops(
  specs: readonly StopSpec[],
  defaultDwellS: number,
): Map<string, StopState> {
  const stops = new Map<string, StopState>();
  for (const s of specs) {
    stops.set(s.stationId, {
      dwellS: s.dwellS ?? defaultDwellS,
      dueS: s.dueS,
      platform: s.platform,
      done: false,
    });
  }
  return stops;
}

interface Footprint {
  frontS: number;
  routes: number;
  lines: string[];
}
/** Per-mover line at each sample point, recomputed only when the mover moves or is rerouted. */
const footprints = new WeakMap<Mover, Footprint>();
const FOOTPRINT_STEP_M = 20;

function footprint(m: Mover, net: RailNetwork): Footprint {
  let fp = footprints.get(m);
  if (!fp) {
    fp = { frontS: NaN, routes: -1, lines: [] };
    footprints.set(m, fp);
  }
  if (fp.frontS !== m.frontS || fp.routes !== m.loopRoutes.size) {
    const n = Math.max(1, Math.ceil(m.lengthM / FOOTPRINT_STEP_M));
    fp.lines.length = n + 1;
    for (let i = 0; i <= n; i++) {
      const s = m.frontS - m.dir * Math.min(m.lengthM, i * FOOTPRINT_STEP_M);
      fp.lines[i] = net.lineFor(m.dir, m.loopRoutes, s);
    }
    fp.frontS = m.frontS;
    fp.routes = m.loopRoutes.size;
  }
  return fp;
}

/**
 * Whether a mover covers `lineId` between two chainages: sampled along its length, so a train
 * on a turnout occupies both lines, and a train foul of a line (too close to it laterally,
 * e.g. still on the points) counts as occupying it.
 */
export function occupies(
  m: Mover,
  net: RailNetwork,
  lineId: string,
  fromS: number,
  toS: number,
): boolean {
  const lo = Math.min(fromS, toS);
  const hi = Math.max(fromS, toS);
  const front = m.frontS;
  const rear = rearS(m);
  if (Math.max(front, rear) < lo || Math.min(front, rear) > hi) return false;
  const step = FOOTPRINT_STEP_M;
  const target = net.line(lineId);
  const targetVaries = varies(target);
  const fp = footprint(m, net);
  const n = fp.lines.length - 1;
  // Only the samples whose chainage falls inside [lo, hi] (sample i sits i*step behind the front).
  const nearD = m.dir === 1 ? front - hi : lo - front;
  const farD = m.dir === 1 ? front - lo : hi - front;
  const first = Math.max(0, Math.ceil(nearD / step));
  const last = Math.min(n, Math.floor(farD / step) + 1);
  for (let i = first; i <= last; i++) {
    const s = front - m.dir * Math.min(m.lengthM, i * step);
    if (s < lo || s > hi) continue;
    const own = fp.lines[i]!;
    if (own === lineId) return true;
    // Straight mains sit at fixed offsets and never foul each other; only loops (turnouts) can.
    if (!targetVaries && !varies(net.line(own))) continue;
    if (target && s >= target.fromM && s <= target.toM) {
      if (Math.abs(net.offsetAt(own, s) - net.offsetAt(lineId, s)) < FOULING_M) return true;
    }
  }
  return false;
}
