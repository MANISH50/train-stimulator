import type { Dir, LineDef, LoopDef, RouteDef, SignalDef } from '../types';

/** Default lateral position of the UP and DN mains (double line, left-hand running). */
export const UP_OFFSET_M = -2.65;
export const DN_OFFSET_M = 2.65;

/** Main line used by trains in each direction. */
export function mainLine(dir: Dir): string {
  return dir === 1 ? 'UP' : 'DN';
}

/**
 * The route's running lines and loops. Every line shares the route chainage, so train
 * physics stays one-dimensional; lines differ only in lateral offset and extent.
 */
export class RailNetwork {
  readonly lines: LineDef[];
  readonly loops: LoopDef[];
  private readonly byId = new Map<string, LineDef>();

  constructor(
    route: RouteDef,
    readonly length: number,
  ) {
    this.lines = route.lines?.length
      ? route.lines
      : [{ id: 'UP', name: 'Main', fromM: 0, toM: length, offsets: [{ atM: 0, offsetM: 0 }] }];
    this.loops = route.loops ?? [];
    for (const l of this.lines) this.byId.set(l.id, l);
  }

  line(id: string): LineDef | undefined {
    return this.byId.get(id);
  }

  has(id: string): boolean {
    return this.byId.has(id);
  }

  /** Lateral offset of a line at chainage s (smoothstep between keyframes). */
  offsetAt(lineId: string, s: number): number {
    const line = this.byId.get(lineId);
    if (!line) return 0;
    const k = line.offsets;
    if (k.length === 1 || s <= k[0]!.atM) return k[0]!.offsetM;
    for (let i = 1; i < k.length; i++) {
      const b = k[i]!;
      if (s <= b.atM) {
        const a = k[i - 1]!;
        const t = (s - a.atM) / Math.max(1e-6, b.atM - a.atM);
        const e = t * t * (3 - 2 * t);
        return a.offsetM + (b.offsetM - a.offsetM) * e;
      }
    }
    return k[k.length - 1]!.offsetM;
  }

  loopAt(stationId: string, dir: Dir): LoopDef | undefined {
    return this.loops.find((l) => l.stationId === stationId && l.dir === dir);
  }

  /** Every loop / platform line at a station for one direction. */
  loopsAt(stationId: string, dir: Dir): LoopDef[] {
    return this.loops.filter((l) => l.stationId === stationId && l.dir === dir);
  }

  /** Line a train with these loop routes (station id -> line id) is on at chainage s. */
  lineFor(dir: Dir, loopRoutes: ReadonlyMap<string, string>, s: number): string {
    for (const loop of this.loops) {
      if (
        loop.dir === dir &&
        loopRoutes.get(loop.stationId) === loop.lineId &&
        s >= loop.fromM &&
        s <= loop.toM
      ) {
        return loop.lineId;
      }
    }
    const main = mainLine(dir);
    return this.byId.has(main) ? main : this.lines[0]!.id;
  }

  speedLimitKmh(lineId: string): number | undefined {
    return this.byId.get(lineId)?.speedLimitKmh;
  }
}

export function signalLine(sig: SignalDef): string {
  return sig.line ?? 'UP';
}

export function signalDir(sig: SignalDef): Dir {
  return sig.dir ?? 1;
}
