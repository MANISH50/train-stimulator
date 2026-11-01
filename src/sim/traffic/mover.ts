import type { RailNetwork } from '../track/network';
import type { Dir, Station, StopSpec, TrainClass } from '../types';

/** Window around a stop mark inside which a stopped train counts as at the platform (m). */
export const STOP_WINDOW_M = 30;

export interface StopState {
  dwellS: number;
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
  /** Stations at which this train has been routed into the loop. */
  readonly loopRoutes: Set<string>;
  readonly stops: Map<string, StopState>;
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
    stops.set(s.stationId, { dwellS: s.dwellS ?? defaultDwellS, dueS: s.dueS, done: false });
  }
  return stops;
}

/** Lines a mover covers: sampled along its length so trains on a turnout occupy both lines. */
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
  const step = 20;
  const n = Math.max(1, Math.ceil(m.lengthM / step));
  for (let i = 0; i <= n; i++) {
    const s = front - m.dir * Math.min(m.lengthM, i * step);
    if (s >= lo && s <= hi && net.lineFor(m.dir, m.loopRoutes, s) === lineId) return true;
  }
  return false;
}
