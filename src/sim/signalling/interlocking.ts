// Colour-light signalling worked by track occupancy (automatic block) and station routes.
// Aspect sequence per docs/research/01-signalling-rules.md §1: a stop signal shows RED when
// its block (to the next stop signal plus overlap) is occupied; otherwise YELLOW if the next
// signal is RED, DOUBLE YELLOW if it is YELLOW, GREEN beyond that. A home signal routing into
// a loop shows at most YELLOW. Distant signals are permissive and never show RED.
import { RailNetwork, signalDir, signalLine } from '../track/network';
import { occupies, type Mover } from '../traffic/mover';
import type { Aspect, Dir, SignalDef } from '../types';
import { aspectAt } from './signal';

/** Overlap beyond the next stop signal that must also be clear (m, multi-aspect territory). */
export const OVERLAP_M = 180;

export interface RouteControl {
  /** True when the dispatcher keeps this (station) signal at danger. */
  isHeld(sig: SignalDef): boolean;
  /** Line the route set at this signal leads onto (a loop for a home signal routed into it). */
  lineBeyond(sig: SignalDef): string;
}

export class Interlocking {
  private readonly aspects = new Map<string, Aspect>();
  /** Emergency: every signal thrown to danger (after an accident). */
  allDanger = false;
  private readonly nextCache = new Map<SignalDef, Map<string, SignalDef | null>>();
  /** Signals per direction, ordered from the far end so each signal's successor is done first. */
  private readonly ordered: Record<string, SignalDef[]>;

  constructor(
    private readonly net: RailNetwork,
    readonly signals: readonly SignalDef[],
  ) {
    const by = (dir: Dir) =>
      signals.filter((s) => signalDir(s) === dir).sort((a, b) => dir * (b.chainageM - a.chainageM));
    this.ordered = { '1': by(1), '-1': by(-1) };
    for (const s of signals) this.aspects.set(s.id, s.timeline ? aspectAt(s, 0) : 'RED');
  }

  aspect(id: string): Aspect {
    return this.aspects.get(id) ?? 'RED';
  }

  /** Next stop signal ahead of `sig` on the line its route leads onto, if any. */
  nextSignal(sig: SignalDef, control: RouteControl): SignalDef | null {
    const beyond = control.lineBeyond(sig);
    // Depends only on the signal and the line its route leads onto: cached (static layout).
    let byLine = this.nextCache.get(sig);
    if (!byLine) {
      byLine = new Map();
      this.nextCache.set(sig, byLine);
    }
    let next = byLine.get(beyond);
    if (next === undefined) {
      next = this.findNext(sig, beyond);
      byLine.set(beyond, next);
    }
    return next;
  }

  private findNext(sig: SignalDef, beyond: string): SignalDef | null {
    const dir = signalDir(sig);
    let best: SignalDef | null = null;
    for (const s of this.ordered[String(dir)]!) {
      if (s === sig || s.kind === 'distant') continue;
      if (dir * (s.chainageM - sig.chainageM) <= 0) continue;
      if (signalLine(s) !== beyond && !this.rejoins(beyond, signalLine(s), dir, s.chainageM))
        continue;
      if (!best || dir * (s.chainageM - best.chainageM) < 0) best = s;
    }
    return best;
  }

  update(timeS: number, movers: readonly Mover[], control: RouteControl): void {
    for (const dirKey of ['1', '-1']) {
      for (const sig of this.ordered[dirKey]!) {
        const aspect = this.allDanger ? 'RED' : this.compute(sig, timeS, movers, control);
        this.aspects.set(sig.id, aspect);
      }
    }
  }

  private compute(
    sig: SignalDef,
    timeS: number,
    movers: readonly Mover[],
    control: RouteControl,
  ): Aspect {
    if (sig.timeline) return aspectAt(sig, timeS);
    const next = this.nextSignal(sig, control);
    const nextAspect = next ? this.aspect(next.id) : 'GREEN';
    const fromNext: Aspect =
      nextAspect === 'RED' ? 'YELLOW' : nextAspect === 'YELLOW' ? 'DOUBLE_YELLOW' : 'GREEN';
    if (sig.kind === 'distant') return fromNext;

    if (control.isHeld(sig)) return 'RED';
    if (sig.holdUntilS !== undefined && timeS < sig.holdUntilS) return 'RED';
    const dir = signalDir(sig);
    const end = next ? next.chainageM + dir * OVERLAP_M : dir === 1 ? this.net.length : 0;
    const own = signalLine(sig);
    const beyond = control.lineBeyond(sig);
    for (const m of movers) {
      if (m.dir !== dir) continue;
      if (occupies(m, this.net, own, sig.chainageM, end)) return 'RED';
      if (beyond !== own && occupies(m, this.net, beyond, sig.chainageM, end)) return 'RED';
    }
    if (beyond !== own && sig.kind === 'home') return 'YELLOW';
    return fromNext;
  }

  /** A loop line rejoins its main line beyond the loop's end. */
  private rejoins(fromLine: string, toLine: string, dir: Dir, atS: number): boolean {
    return this.net.loops.some(
      (l) =>
        l.lineId === fromLine &&
        l.mainLineId === toLine &&
        l.dir === dir &&
        dir * (atS - l.toM) >= 0,
    );
  }
}
