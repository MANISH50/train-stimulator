import { describe, expect, it } from 'vitest';
import { levelById, levelSetup } from '../src/content/catalog';
import { Interlocking, type RouteControl } from '../src/sim/signalling/interlocking';
import { Sim } from '../src/sim/sim';
import { RailNetwork, signalDir, signalLine } from '../src/sim/track/network';
import type { Mover } from '../src/sim/traffic/mover';
import type { RouteDef, SignalDef, WeatherId } from '../src/sim/types';
import { autopilot, drive } from './autopilot';
import { flatRoute, makeSim } from './helpers';

function level(id: string, weather: WeatherId = 'clear'): Sim {
  return new Sim(levelSetup(levelById(id), weather));
}

function standing(frontS: number, lengthM = 300): Mover {
  return {
    id: 'x',
    label: 'Standing train',
    dir: 1,
    priority: 1,
    lengthM,
    trainClass: 'goods',
    isPlayer: false,
    frontS,
    speedMs: 0,
    loopRoutes: new Map(),
    stops: new Map(),
  };
}

describe('automatic block signalling', () => {
  const route: RouteDef = {
    ...flatRoute(),
    signals: [1000, 2000, 3000, 4000].map((s, i) => ({
      id: `S${i + 1}`,
      label: `S${i + 1}`,
      kind: 'automatic' as const,
      chainageM: s,
    })),
  };
  const net = new RailNetwork(route, 20000);
  const control: RouteControl = { isHeld: () => false, lineBeyond: (s) => signalLine(s) };

  it('shows RED, YELLOW, DOUBLE YELLOW, GREEN behind an occupied block', () => {
    const il = new Interlocking(net, route.signals);
    il.update(0, [standing(4500)], control);
    expect(['S4', 'S3', 'S2', 'S1'].map((id) => il.aspect(id))).toEqual([
      'RED',
      'YELLOW',
      'DOUBLE_YELLOW',
      'GREEN',
    ]);
  });

  it('shows GREEN on every signal when the line is clear', () => {
    const il = new Interlocking(net, route.signals);
    il.update(0, [], control);
    expect(route.signals.every((s) => il.aspect(s.id) === 'GREEN')).toBe(true);
  });

  it('a train in the overlap beyond the next signal keeps the signal at danger', () => {
    const il = new Interlocking(net, route.signals);
    il.update(0, [standing(3100, 50)], control); // overlap of S3 extends to 3180
    expect(il.aspect('S2')).toBe('RED');
  });
});

describe('station starter', () => {
  it('stays RED during the dwell, then clears with a notification', () => {
    const sim = level('training');
    const events = drive(sim, 900, () => sim.player.stops.get('PRS')!.done);
    const stop = events.find((e) => e.type === 'STATION_STOP')!;
    expect(stop).toBeDefined();
    // Still red just as the dwell completes (aspect updates this step).
    const more = [...events, ...drive(sim, 60)];
    const cleared = more.find((e) => e.type === 'SIGNAL_CLEARED' && e.signalId === 'PRS-S');
    expect(cleared).toBeDefined();
    expect(cleared!.timeS - stop.timeS).toBeGreaterThan(20 - 2 / 60); // dwell, within a frame
  });
});

describe('AI traffic', () => {
  it('never passes a red signal and always runs on its own line', () => {
    const sim = level('suburban');
    for (let i = 0; i < 60 * 600 && sim.status === 'running'; i++) {
      const before = sim.ai.map((t) => ({ t, s: t.frontS }));
      const red = sim.setup.route.signals.filter(
        (s) => s.kind !== 'distant' && sim.aspectOf(s) === 'RED',
      );
      autopilot(sim);
      sim.step();
      for (const { t, s } of before) {
        for (const sig of red) {
          if (signalDir(sig) !== t.dir) continue;
          if (signalLine(sig) !== sim.net.lineFor(t.dir, t.loopRoutes, sig.chainageM)) continue;
          const crossed =
            t.dir * (sig.chainageM - s) > 0 && t.dir * (t.frontS - sig.chainageM) >= 0;
          expect(crossed, `${t.label} passed ${sig.label} at danger`).toBe(false);
        }
      }
    }
  });
});

describe('loop overtake (Mail level)', () => {
  it('holds the player in the loop until the Superfast has passed, then clears', () => {
    const sim = level('mail');
    const events = drive(sim, 1200, () =>
      sim.drainEvents().length < 0 ? true : sim.train.s > 7400,
    );
    const routed = events.find((e) => e.type === 'ROUTED_LOOP');
    expect(routed && routed.type === 'ROUTED_LOOP' && routed.forTrain).toBe('Superfast Express');
    expect(sim.player.loopRoutes.has('STP')).toBe(true);
    const cleared = events.find((e) => e.type === 'SIGNAL_CLEARED' && e.signalId === 'STP-LS');
    expect(cleared).toBeDefined();
    // By the time the loop starter cleared the Superfast was already beyond the loop exit.
    const passing = events.find((e) => e.type === 'TRAIN_PASSING' && e.sameDirection);
    expect(passing).toBeDefined();
    expect(passing!.timeS).toBeLessThan(cleared!.timeS);
    expect(sim.status).toBe('running');
  });
});

describe('weather', () => {
  function stoppingDistance(weather: WeatherId): number {
    const sim = makeSim({ weather });
    sim.controls.indepBrake = 0;
    sim.controls.notch = 8;
    while (sim.train.v * 3.6 < 70) sim.step();
    sim.controls.notch = 0;
    sim.controls.autoBrake = 1;
    const start = sim.train.s;
    while (sim.train.v > 0) sim.step();
    return sim.train.s - start;
  }

  it('wet rail in monsoon rain lengthens braking', () => {
    expect(stoppingDistance('rain')).toBeGreaterThan(stoppingDistance('clear'));
  });

  it('fog hides the signal aspect beyond the visibility distance', () => {
    const fog = level('training', 'fog');
    const clear = level('training', 'clear');
    expect(fog.nextSignalView()!.visible).toBe(false);
    expect(clear.nextSignalView()!.visible).toBe(true);
    expect(fog.currentLimitKmh()).toBeLessThanOrEqual(75);
  });
});

describe('determinism with traffic', () => {
  it('two identical runs end in the same state', () => {
    const hash = () => {
      const sim = level('intercity');
      drive(sim, 400);
      return [sim.train.s, sim.train.v, ...sim.ai.map((t) => t.frontS)]
        .map((x) => x.toFixed(6))
        .join('|');
    };
    expect(hash()).toBe(hash());
  });
});

describe('every level is drivable to the end by a rule-abiding driver', () => {
  for (const id of ['training', 'intercity', 'suburban', 'mail', 'goods']) {
    it(id, () => {
      const sim = level(id);
      drive(sim, 1800);
      expect(sim.status, sim.failReason).toBe('finished');
    });
  }
});

// Keep the SignalDef import used for readers of this file.
export type { SignalDef };
