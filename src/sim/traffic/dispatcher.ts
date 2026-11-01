// Station dispatcher (the Station Master's panel): sets routes at home signals, decides loop
// overtakes by priority (superfast > express > passenger > goods), tracks dwell at stops and
// keeps starter signals at danger until a train may leave.
import { mainLine, signalDir, signalLine, type RailNetwork } from '../track/network';
import type { Dir, LoopDef, SignalDef, Station } from '../types';
import type { RouteControl } from '../signalling/interlocking';
import { STOP_WINDOW_M, aheadOf, rearS, stopMarkFor, type Mover } from './mover';

/** A home signal sets its route once a train is this close (m). */
export const ROUTE_SETTING_M = 3000;
/** A faster train this far behind (m) earns an overtake at the next loop. */
export const OVERTAKE_GAP_M = 9000;
/** Closer than this to the home signal (m) the route can no longer change to the loop. */
export const ROUTE_LOCK_M = 400;

export type HoldReason =
  | { kind: 'dwell'; stationId: string; leftS: number }
  | { kind: 'overtake'; stationId: string; byTrain: string }
  | { kind: 'not-at-mark'; stationId: string };

export interface LoopRouting {
  moverId: string;
  stationId: string;
  /** Label of the train being given precedence, if this is an overtake. */
  forTrain?: string;
}

interface StationSignals {
  station: Station;
  dir: Dir;
  home?: SignalDef;
  starters: SignalDef[];
  loop?: LoopDef;
}

export class Dispatcher implements RouteControl {
  private readonly groups: StationSignals[] = [];
  private readonly decided = new Map<string, Set<string>>(); // stationId:dir -> mover ids
  /** moverId:stationId -> id of the train it is waiting for. */
  private readonly overtakeFor = new Map<string, string>();
  private readonly holds = new Map<string, boolean>();
  private readonly homeRoute = new Map<string, string>();
  private readonly holdReasons = new Map<string, HoldReason>();
  /** Loop routings decided since the sim last drained them, for notifications. */
  newLoopRoutings: LoopRouting[] = [];

  constructor(net: RailNetwork, stations: readonly Station[], signals: readonly SignalDef[]) {
    for (const station of stations) {
      for (const dir of [1, -1] as Dir[]) {
        const mine = signals.filter(
          (s) => s.stationId === station.id && signalDir(s) === dir && !s.timeline,
        );
        if (!mine.length) continue;
        this.groups.push({
          station,
          dir,
          home: mine.find((s) => s.kind === 'home'),
          starters: mine.filter((s) => s.kind === 'starter'),
          loop: net.loopAt(station.id, dir),
        });
      }
    }
  }

  isHeld(sig: SignalDef): boolean {
    return this.holds.get(sig.id) ?? false;
  }

  lineBeyond(sig: SignalDef): string {
    return this.homeRoute.get(sig.id) ?? signalLine(sig);
  }

  /** Why the given mover is being held at its next station, if it is. */
  holdReason(moverId: string): HoldReason | undefined {
    return this.holdReasons.get(moverId);
  }

  update(timeS: number, movers: readonly Mover[]): void {
    this.holdReasons.clear();
    this.trackDwell(timeS, movers);
    for (const g of this.groups) {
      this.setRoutes(g, movers);
      this.workHome(g, movers);
      this.workStarters(g, movers, timeS);
    }
  }

  private trackDwell(timeS: number, movers: readonly Mover[]): void {
    for (const m of movers) {
      if (m.speedMs > 0.01) continue;
      for (const g of this.groups) {
        if (g.dir !== m.dir) continue;
        const stop = m.stops.get(g.station.id);
        if (!stop || stop.done) continue;
        const mark = stopMarkFor(g.station, m.dir);
        if (Math.abs(m.frontS - mark) <= STOP_WINDOW_M) {
          stop.arrivedAtS ??= timeS;
          if (timeS - stop.arrivedAtS >= stop.dwellS) stop.done = true;
        }
      }
    }
  }

  private setRoutes(g: StationSignals, movers: readonly Mover[]): void {
    if (!g.home) return;
    const key = `${g.station.id}:${g.dir}`;
    const decided = this.decided.get(key) ?? new Set<string>();
    this.decided.set(key, decided);
    for (const m of movers) {
      if (m.dir !== g.dir || decided.has(m.id)) continue;
      const toHome = aheadOf(m, g.home.chainageM);
      if (toHome < 0 || toHome > ROUTE_SETTING_M) continue;
      if (!g.loop) {
        decided.add(m.id);
        continue;
      }
      // The route stays open to a loop overtake until the train is too close to the home.
      if (toHome < ROUTE_LOCK_M) decided.add(m.id);
      const overtaker = this.findOvertaker(m, movers);
      if (overtaker && !this.loopClaimed(g, movers, m)) {
        decided.add(m.id);
        m.loopRoutes.add(g.station.id);
        this.overtakeFor.set(`${m.id}:${g.station.id}`, overtaker.id);
        this.newLoopRoutings.push({
          moverId: m.id,
          stationId: g.station.id,
          forTrain: overtaker.label,
        });
      }
    }
  }

  /** Nearest higher-priority train following in the same direction within the overtake gap. */
  private findOvertaker(m: Mover, movers: readonly Mover[]): Mover | undefined {
    let best: Mover | undefined;
    for (const o of movers) {
      if (o === m || o.dir !== m.dir || o.priority <= m.priority) continue;
      const behind = -aheadOf(m, o.frontS);
      if (behind <= 0 || behind > OVERTAKE_GAP_M) continue;
      if (!best || -aheadOf(m, best.frontS) > behind) best = o;
    }
    return best;
  }

  private loopClaimed(g: StationSignals, movers: readonly Mover[], except: Mover): boolean {
    return movers.some(
      (o) =>
        o !== except &&
        o.loopRoutes.has(g.station.id) &&
        o.dir === g.dir &&
        aheadOf(o, g.loop!.toM) > -o.lengthM,
    );
  }

  /** The home clears for the nearest approaching train, onto its decided route. */
  private workHome(g: StationSignals, movers: readonly Mover[]): void {
    const home = g.home;
    if (!home) return;
    let next: Mover | undefined;
    for (const m of movers) {
      if (m.dir !== g.dir) continue;
      const d = aheadOf(m, home.chainageM);
      if (d < 0 || d > ROUTE_SETTING_M) continue;
      if (!next || d < aheadOf(next, home.chainageM)) next = m;
    }
    this.holds.set(home.id, !next);
    const main = mainLine(g.dir);
    this.homeRoute.set(
      home.id,
      next && g.loop && next.loopRoutes.has(g.station.id) ? g.loop.lineId : main,
    );
  }

  /** A starter stays at danger until its train has finished dwelling and is not being held. */
  private workStarters(g: StationSignals, movers: readonly Mover[], timeS: number): void {
    for (const starter of g.starters) {
      const line = signalLine(starter);
      const onLoop = g.loop?.lineId === line;
      let train: Mover | undefined;
      for (const m of movers) {
        if (m.dir !== g.dir) continue;
        const d = aheadOf(m, starter.chainageM);
        if (d < 0 || d > ROUTE_SETTING_M + 1500) continue;
        if (onLoop !== m.loopRoutes.has(g.station.id)) continue;
        if (!train || d < aheadOf(train, starter.chainageM)) train = m;
      }
      if (!train) {
        this.holds.set(starter.id, true);
        continue;
      }
      let held = false;
      const stop = train.stops.get(g.station.id);
      if (stop && !stop.done) {
        held = true;
        const mark = stopMarkFor(g.station, g.dir);
        if (stop.arrivedAtS !== undefined) {
          this.reason(train, {
            kind: 'dwell',
            stationId: g.station.id,
            leftS: Math.max(0, stop.dwellS - (timeS - stop.arrivedAtS)),
          });
        } else if (train.speedMs <= 0.01 && aheadOf(train, mark) > STOP_WINDOW_M) {
          this.reason(train, { kind: 'not-at-mark', stationId: g.station.id });
        }
      }
      const waitKey = `${train.id}:${g.station.id}`;
      const waitFor = this.overtakeFor.get(waitKey);
      if (waitFor) {
        const other = movers.find((o) => o.id === waitFor);
        // Released once the overtaking train's rear is clear beyond the loop's exit points.
        const exitS = g.loop?.toM ?? starter.chainageM;
        const cleared = !other || g.dir * (rearS(other) - exitS) > 50;
        if (cleared) this.overtakeFor.delete(waitKey);
        else {
          held = true;
          this.reason(train, { kind: 'overtake', stationId: g.station.id, byTrain: other!.label });
        }
      }
      this.holds.set(starter.id, held);
    }
  }

  private reason(m: Mover, r: HoldReason): void {
    if (!this.holdReasons.has(m.id) || r.kind === 'overtake') this.holdReasons.set(m.id, r);
  }
}
