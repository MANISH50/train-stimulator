// Station crowds: deterministic agents on platform slabs. Passengers mill about, queue behind
// the platform safety line as a stopping train approaches, board and alight at the doors, wave
// it off, and the odd latecomer runs for it (stopping at the line: nobody boards a moving
// train). Vendors stay at their stalls, porters bustle, staff and police stand or patrol.
// Updated at 10 Hz, and only for stations near the player. No Three.js, no Math.random().
import { mulberry32 } from '../rng';
import type { RailNetwork } from '../track/network';
import { stopMarkFor, type Mover } from '../traffic/mover';
import type { Station } from '../types';

export const CROWD_HZ = 10;
/** Agents per station by size (before the rush multiplier). Tuning values, not counts. */
export const CROWD_SIZE = { halt: 14, town: 40, junction: 220, terminus: 110 } as const;
/** Queue this far back from the platform edge (behind the safety line), m. Design value. */
export const QUEUE_BACK_M = 1.6;
/** Crowds beyond this distance from the player are frozen (m). */
const ACTIVE_M = 3000;
/** A train this close to its stop makes waiting passengers move up to the edge (m). */
const QUEUE_TRIGGER_M = 900;

export type AgentKind = 'passenger' | 'vendor' | 'porter' | 'staff' | 'police';
export type AgentState =
  'mill' | 'pause' | 'queue' | 'board' | 'alight' | 'leave' | 'wave' | 'run' | 'gone';

export interface Agent {
  kind: AgentKind;
  state: AgentState;
  s: number;
  y: number;
  ts: number;
  ty: number;
  speed: number;
  timer: number;
  /** Index into the station's slabs. */
  slab: number;
  /** 0..1 appearance seed (clothing colour, height). */
  look: number;
  /** Walk-cycle phase (s), for animation. */
  phase: number;
  /** Platform edge this agent is queuing at (lateral m). */
  edgeY: number;
}

interface Slab {
  y0: number;
  y1: number;
  s0: number;
  s1: number;
}

export interface StationCrowd {
  station: Station;
  slabs: Slab[];
  agents: Agent[];
  /** Movers currently standing at this station (for boarding), by id. */
  standing: Set<string>;
  /** Trains boarded / alighted, for the HUD and tests. */
  boarded: number;
  alighted: number;
}

const KIND_MIX: [AgentKind, number][] = [
  ['passenger', 0.82],
  ['vendor', 0.06],
  ['porter', 0.06],
  ['staff', 0.03],
  ['police', 0.03],
];

export class Crowds {
  readonly stations: StationCrowd[] = [];
  private readonly rng: () => number;
  private acc = 0;

  constructor(
    stations: readonly Station[],
    private readonly net: RailNetwork,
    seed: number,
  ) {
    this.rng = mulberry32(seed);
    for (const st of stations) {
      const start = st.stopMarkM - st.platformLengthM + 40;
      const slabs = (st.platforms ?? [{ offsetM: -5.6, widthM: 4.5 }]).map((p) => ({
        y0: p.offsetM - p.widthM / 2 + 0.35,
        y1: p.offsetM + p.widthM / 2 - 0.35,
        s0: start + 5,
        s1: start + st.platformLengthM - 5,
      }));
      const size = st.crowd?.size ?? 'town';
      const n = Math.round(CROWD_SIZE[size] * (st.crowd?.rush ?? 1));
      const agents: Agent[] = [];
      for (let i = 0; i < n; i++) agents.push(this.spawn(slabs, this.pickKind()));
      this.stations.push({
        station: st,
        slabs,
        agents,
        standing: new Set(),
        boarded: 0,
        alighted: 0,
      });
    }
  }

  /** Call every sim step; the crowd itself updates at CROWD_HZ. */
  step(dt: number, movers: readonly Mover[], playerS: number): void {
    this.acc += dt;
    const h = 1 / CROWD_HZ;
    while (this.acc >= h - 1e-9) {
      this.acc -= h;
      for (const c of this.stations) {
        if (Math.abs(c.station.stopMarkM - playerS) > ACTIVE_M) continue;
        this.update(c, movers, h);
      }
    }
  }

  private update(c: StationCrowd, movers: readonly Mover[], h: number): void {
    const st = c.station;
    for (const m of movers) {
      const stop = m.stops.get(st.id);
      if (!stop) continue;
      const mark = stopMarkFor(st, m.dir);
      const toMark = m.dir * (mark - m.frontS);
      const atPlatform = Math.abs(toMark) <= 30 && m.speedMs < 0.05;
      const line = this.net.lineFor(m.dir, m.loopRoutes, mark);
      const edge = this.edgeFor(c, line, mark);
      if (edge === null) continue;
      const rearS = m.frontS - m.dir * m.lengthM;
      const lo = Math.max(Math.min(mark, mark - m.dir * m.lengthM), c.slabs[edge.slab]!.s0);
      const hi = Math.min(Math.max(mark, mark - m.dir * m.lengthM), c.slabs[edge.slab]!.s1);
      if (!stop.done && !atPlatform && toMark > 0 && toMark < QUEUE_TRIGGER_M) {
        this.queueUp(c, edge, lo, hi);
      }
      if (atPlatform && !stop.done && !c.standing.has(m.id)) {
        c.standing.add(m.id);
        this.alight(c, edge, lo, hi);
      }
      if (atPlatform && !stop.done) this.board(c, edge);
      if (c.standing.has(m.id) && (stop.done || m.speedMs > 0.3) && Math.abs(toMark) > 1) {
        c.standing.delete(m.id);
        this.waveOff(c, edge, Math.min(lo, rearS), hi);
      }
    }
    for (const a of c.agents) this.move(c, a, h);
  }

  /** The slab edge serving a line at chainage s, if a platform is beside it. */
  private edgeFor(
    c: StationCrowd,
    line: string,
    s: number,
  ): { slab: number; edgeY: number; inward: number } | null {
    const y = this.net.offsetAt(line, s);
    let best: { slab: number; edgeY: number; inward: number } | null = null;
    let bestD = 2.6;
    c.slabs.forEach((sl, i) => {
      const dl = Math.abs(sl.y0 - 0.35 - y);
      const dr = Math.abs(sl.y1 + 0.35 - y);
      if (dl < bestD) {
        bestD = dl;
        best = { slab: i, edgeY: sl.y0, inward: 1 };
      }
      if (dr < bestD) {
        bestD = dr;
        best = { slab: i, edgeY: sl.y1, inward: -1 };
      }
    });
    return best;
  }

  private queueUp(
    c: StationCrowd,
    e: { slab: number; edgeY: number; inward: number },
    lo: number,
    hi: number,
  ): void {
    for (const a of c.agents) {
      if (a.kind !== 'passenger' || a.slab !== e.slab) continue;
      if (a.state !== 'mill' && a.state !== 'pause') continue;
      // About half of those waiting are for this train.
      if (a.look > 0.55) continue;
      a.state = 'queue';
      a.ts = lo + this.rng() * Math.max(1, hi - lo);
      const sl = c.slabs[e.slab]!;
      const room = Math.max(QUEUE_BACK_M, sl.y1 - sl.y0 - 0.2);
      a.edgeY = e.edgeY;
      a.ty = e.edgeY + e.inward * Math.min(room, QUEUE_BACK_M + this.rng() * 1.2);
      a.speed = 0.9 + this.rng() * 0.5;
    }
  }

  private board(c: StationCrowd, e: { slab: number; edgeY: number; inward: number }): void {
    for (const a of c.agents) {
      if (a.state !== 'queue' || a.slab !== e.slab) continue;
      if (Math.abs(a.s - a.ts) > 0.5 || Math.abs(a.y - a.ty) > 0.5) continue;
      a.state = 'board';
      a.ty = e.edgeY + e.inward * 0.3;
      a.speed = 1.1;
    }
  }

  private alight(
    c: StationCrowd,
    e: { slab: number; edgeY: number; inward: number },
    lo: number,
    hi: number,
  ): void {
    // Passengers step off at the doors and head for the exits.
    const n = Math.min(24, 6 + Math.round(this.rng() * 12));
    for (let k = 0; k < n; k++) {
      const a = this.reuseGone(c) ?? this.spawn(c.slabs, 'passenger');
      if (!c.agents.includes(a)) c.agents.push(a);
      a.kind = 'passenger';
      a.slab = e.slab;
      a.s = lo + this.rng() * Math.max(1, hi - lo);
      a.y = e.edgeY + e.inward * 0.3;
      a.state = 'alight';
      a.ty = e.edgeY + e.inward * (2.5 + this.rng() * 1.5);
      a.ts = a.s;
      a.speed = 1.0 + this.rng() * 0.4;
      a.look = 0.6 + this.rng() * 0.4; // not waiting for a train
      c.alighted++;
    }
  }

  private waveOff(
    c: StationCrowd,
    e: { slab: number; edgeY: number; inward: number },
    lo: number,
    hi: number,
  ): void {
    for (const a of c.agents) {
      if (a.slab !== e.slab || a.kind !== 'passenger') continue;
      if (a.state === 'queue') a.state = 'mill'; // missed it or seeing someone off
      if (Math.abs(a.y - e.edgeY) < 5 && (a.state === 'mill' || a.state === 'pause')) {
        a.state = 'wave';
        a.timer = 4 + this.rng() * 4;
      }
    }
    // A latecomer runs for it, and stops at the safety line.
    const runner = this.reuseGone(c);
    if (runner) {
      runner.kind = 'passenger';
      runner.slab = e.slab;
      const sl = c.slabs[e.slab]!;
      runner.s = this.rng() < 0.5 ? sl.s0 : sl.s1;
      runner.y = (sl.y0 + sl.y1) / 2;
      runner.ts = lo + (hi - lo) * this.rng();
      runner.ty = e.edgeY + e.inward * QUEUE_BACK_M;
      runner.state = 'run';
      runner.speed = 4.2;
    }
  }

  private move(c: StationCrowd, a: Agent, h: number): void {
    if (a.state === 'gone') {
      a.timer -= h;
      if (a.timer <= 0) this.respawnAtExit(c, a);
      return;
    }
    if (a.state === 'wave' || a.state === 'pause') {
      a.timer -= h;
      if (a.timer <= 0) this.newWander(c, a);
      return;
    }
    const dx = a.ts - a.s;
    const dy = a.ty - a.y;
    const d = Math.hypot(dx, dy);
    const step = a.speed * h;
    if (d > step) {
      a.s += (dx / d) * step;
      a.y += (dy / d) * step;
      a.phase += h * a.speed * 1.8;
      return;
    }
    a.s = a.ts;
    a.y = a.ty;
    switch (a.state) {
      case 'board':
        c.boarded++;
        this.vanish(a, 30 + this.rng() * 60);
        break;
      case 'alight':
        a.state = 'leave';
        a.ts = this.rng() < 0.5 ? c.slabs[a.slab]!.s0 : c.slabs[a.slab]!.s1;
        a.speed = 1.1;
        break;
      case 'leave':
        this.vanish(a, 20 + this.rng() * 40);
        break;
      case 'run':
        a.state = 'pause';
        a.timer = 6;
        break;
      case 'queue':
        break; // wait for the train
      default:
        a.state = 'pause';
        a.timer =
          a.kind === 'vendor' || a.kind === 'staff' ? 20 + this.rng() * 30 : 2 + this.rng() * 6;
    }
  }

  private newWander(c: StationCrowd, a: Agent): void {
    const sl = c.slabs[a.slab]!;
    a.state = 'mill';
    const range = a.kind === 'vendor' ? 4 : a.kind === 'police' ? 60 : a.kind === 'staff' ? 10 : 40;
    a.ts = clamp(a.s + (this.rng() - 0.5) * 2 * range, sl.s0, sl.s1);
    a.ty = sl.y0 + 0.6 + this.rng() * Math.max(0.1, sl.y1 - sl.y0 - 1.2);
    a.speed = a.kind === 'porter' ? 1.4 : a.kind === 'police' ? 0.7 : 0.6 + this.rng() * 0.6;
  }

  private vanish(a: Agent, respawnS: number): void {
    a.state = 'gone';
    a.timer = respawnS;
  }

  private respawnAtExit(c: StationCrowd, a: Agent): void {
    const sl = c.slabs[a.slab]!;
    a.s = this.rng() < 0.5 ? sl.s0 : sl.s1;
    a.y = (sl.y0 + sl.y1) / 2;
    a.look = this.rng();
    this.newWander(c, a);
  }

  private reuseGone(c: StationCrowd): Agent | undefined {
    return c.agents.find((a) => a.state === 'gone');
  }

  private pickKind(): AgentKind {
    let r = this.rng();
    for (const [k, p] of KIND_MIX) {
      if (r < p) return k;
      r -= p;
    }
    return 'passenger';
  }

  private spawn(slabs: readonly Slab[], kind: AgentKind): Agent {
    const slab = Math.floor(this.rng() * slabs.length);
    const sl = slabs[slab]!;
    const s = sl.s0 + this.rng() * (sl.s1 - sl.s0);
    const y = sl.y0 + 0.6 + this.rng() * Math.max(0.1, sl.y1 - sl.y0 - 1.2);
    return {
      kind,
      state: 'pause',
      s,
      y,
      ts: s,
      ty: y,
      speed: 0.8,
      timer: this.rng() * 5,
      slab,
      look: this.rng(),
      phase: this.rng() * 10,
      edgeY: y,
    };
  }
}

function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}
