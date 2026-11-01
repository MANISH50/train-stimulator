import { describe, expect, it } from 'vitest';
import { aspectAt, nextSignal } from '../src/sim/signalling/signal';
import type { RouteDef, SignalDef } from '../src/sim/types';
import { ROUTE, flatRoute, makeSim, run } from './helpers';

function routeWithSignal(timeline: SignalDef['timeline'], extra: Partial<RouteDef> = {}): RouteDef {
  return {
    ...flatRoute(),
    signals: [{ id: 'S1', label: 'Home S1', kind: 'home', chainageM: 1500, timeline }],
    ...extra,
  };
}

describe('signal aspects', () => {
  it('follows its timeline', () => {
    const sig = ROUTE.signals.find((s) => s.id === 'H1')!;
    expect(aspectAt(sig, 0)).toBe('RED');
    expect(aspectAt(sig, 149.9)).toBe('RED');
    expect(aspectAt(sig, 150)).toBe('YELLOW');
  });

  it('finds the next signal ahead', () => {
    expect(nextSignal(ROUTE.signals, 0)?.id).toBe('D1');
    expect(nextSignal(ROUTE.signals, 2500)?.id).toBe('H1');
    expect(nextSignal(ROUTE.signals, 3500)).toBeNull();
  });
});

describe('SPAD and red-signal wait', () => {
  it('passing a red signal is a SPAD and fails the run', () => {
    const sim = makeSim({ route: routeWithSignal([{ atS: 0, aspect: 'RED' }]) });
    sim.controls.indepBrake = 0;
    sim.controls.notch = 8;
    run(sim, 120);
    expect(sim.status).toBe('failed');
    const events = sim.drainEvents();
    expect(events.some((e) => e.type === 'SPAD' && e.signalId === 'S1')).toBe(true);
  });

  it('waiting at red until it clears, then proceeding, is not a SPAD', () => {
    const sim = makeSim({
      route: routeWithSignal([
        { atS: 0, aspect: 'RED' },
        { atS: 200, aspect: 'GREEN' },
      ]),
    });
    sim.controls.indepBrake = 0;
    sim.controls.notch = 4;
    // Drive toward the signal and stop short of it.
    while (sim.train.s < 1300) sim.step();
    sim.controls.notch = 0;
    sim.controls.autoBrake = 1;
    while (sim.train.v > 0) sim.step();
    expect(sim.train.s).toBeLessThan(1500);
    while (sim.timeS < 200) sim.step();
    sim.controls.autoBrake = 0;
    sim.controls.notch = 4;
    run(sim, 120);
    const events = sim.drainEvents();
    expect(sim.status).toBe('running');
    expect(events.some((e) => e.type === 'SPAD')).toBe(false);
    expect(events.some((e) => e.type === 'SIGNAL_PASSED' && e.aspect === 'GREEN')).toBe(true);
  });
});

describe('speed restrictions', () => {
  it('reports overspeed through a temporary restriction', () => {
    const sim = makeSim({
      route: {
        ...flatRoute(),
        speedLimits: [{ fromM: 1600, toM: 2000, kmh: 30, kind: 'temporary' }],
      },
    });
    sim.controls.indepBrake = 0;
    sim.controls.notch = 8;
    while (sim.train.s < 1700) sim.step();
    expect(sim.drainEvents().some((e) => e.type === 'OVERSPEED')).toBe(true);
  });

  it('a restriction applies until the rear of the train clears it', () => {
    const sim = makeSim({
      route: {
        ...flatRoute(),
        speedLimits: [{ fromM: 900, toM: 1100, kmh: 30, kind: 'temporary' }],
      },
      startS: 1200,
    });
    // Front is past the restriction but the rear (train ~300 m long) is still inside it.
    expect(sim.currentLimitKmh()).toBe(30);
  });
});

describe('station stop', () => {
  it('records a stop within the platform window', () => {
    const sim = makeSim({
      route: {
        ...flatRoute(),
        stations: [{ id: 'X', name: 'X', stopMarkM: 1010, platformLengthM: 400 }],
      },
    });
    run(sim, 1);
    const stop = sim.drainEvents().find((e) => e.type === 'STATION_STOP');
    expect(stop).toBeDefined();
  });
});
