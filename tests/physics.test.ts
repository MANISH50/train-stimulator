import { describe, expect, it } from 'vitest';
import { FixedClock, SIM_DT } from '../src/sim/clock';
import { flatRoute, makeSim, run } from './helpers';
import type { Sim } from '../src/sim/sim';

function release(sim: Sim) {
  sim.controls.indepBrake = 0;
  sim.controls.autoBrake = 0;
}

function hash(sim: Sim): string {
  const t = sim.train;
  return [t.s, t.v, t.brakes.bp, t.brakes.bc].map((x) => x.toFixed(9)).join('|');
}

/** Accelerate to target km/h, then apply full service brake; return stopping distance in m. */
function stoppingDistance(sim: Sim, targetKmh: number): number {
  release(sim);
  sim.controls.notch = sim.consist.loco.notches;
  while (sim.train.v * 3.6 < targetKmh) sim.step();
  sim.controls.notch = 0;
  sim.controls.autoBrake = 1;
  const start = sim.train.s;
  while (sim.train.v > 0) sim.step();
  return sim.train.s - start;
}

describe('fixed clock', () => {
  it('runs whole steps and carries the remainder', () => {
    const clock = new FixedClock();
    const r = clock.advance(SIM_DT * 2.5);
    expect(r.steps).toBe(2);
    expect(r.alpha).toBeCloseTo(0.5, 5);
  });

  it('clamps long pauses', () => {
    expect(new FixedClock().advance(5).steps).toBe(10);
  });
});

describe('train physics', () => {
  it('is deterministic for identical inputs', () => {
    const a = makeSim();
    const b = makeSim();
    for (const sim of [a, b]) {
      release(sim);
      sim.controls.notch = 5;
      run(sim, 60);
      sim.controls.notch = 0;
      sim.controls.autoBrake = 0.6;
      run(sim, 30);
    }
    expect(hash(a)).toBe(hash(b));
  });

  it('stays still on level track with brakes applied and no power', () => {
    const sim = makeSim();
    run(sim, 30);
    expect(sim.train.v).toBe(0);
    expect(sim.train.s).toBe(1000);
  });

  it('accelerates under power and respects max speed', () => {
    const sim = makeSim();
    release(sim);
    sim.controls.notch = 8;
    run(sim, 30);
    expect(sim.train.v).toBeGreaterThan(5);
    run(sim, 900);
    expect(sim.train.v * 3.6).toBeLessThanOrEqual(sim.consist.loco.maxSpeedKmh + 0.5);
  });

  it('does not move with the reverser in neutral', () => {
    const sim = makeSim();
    release(sim);
    sim.controls.reverser = 0;
    sim.controls.notch = 8;
    run(sim, 20);
    expect(sim.train.v).toBe(0);
  });

  it('a coasting train rolls downhill and is held by brakes', () => {
    const down = makeSim({ route: flatRoute(-0.01) });
    release(down);
    run(down, 30);
    expect(down.train.v).toBeGreaterThan(0.5);

    const held = makeSim({ route: flatRoute(-0.01) });
    held.controls.indepBrake = 0;
    held.controls.autoBrake = 1;
    run(held, 30);
    expect(held.train.v).toBe(0);
  });

  it('an uphill grade slows a coasting train more than level track', () => {
    const level = makeSim();
    const up = makeSim({ route: flatRoute(0.005) });
    for (const sim of [level, up]) {
      release(sim);
      sim.controls.notch = 8;
      while (sim.train.v * 3.6 < 60) sim.step();
      sim.controls.notch = 0;
      run(sim, 20);
    }
    expect(up.train.v).toBeLessThan(level.train.v);
  });

  it('heavier rakes need longer stopping distance', () => {
    const light = stoppingDistance(makeSim({ rake: { vehicles: 6 } }), 80);
    const heavy = stoppingDistance(makeSim({ rake: { vehicles: 24 } }), 80);
    expect(heavy).toBeGreaterThan(light);
  });

  it('full service mean deceleration from 100 km/h matches the research target', () => {
    const d = stoppingDistance(makeSim(), 100);
    const v = 100 / 3.6;
    const meanDecel = (v * v) / (2 * d);
    // docs/research/02-train-physics.md: LHB passenger 0.5-1.0 m/s² (service-emergency).
    expect(meanDecel).toBeGreaterThan(0.5);
    expect(meanDecel).toBeLessThan(1.0);
  });

  it('starts a 12-coach train and reaches 100 km/h in a plausible time', () => {
    const sim = makeSim();
    release(sim);
    sim.controls.notch = 8;
    while (sim.train.v * 3.6 < 100 && sim.timeS < 600) sim.step();
    // Single-loco 600 t passenger train: well over a minute, under ~4 minutes (approximate).
    expect(sim.timeS).toBeGreaterThan(60);
    expect(sim.timeS).toBeLessThan(240);
  });

  it('emergency brake stops shorter than full service', () => {
    const service = stoppingDistance(makeSim(), 100);
    const sim = makeSim();
    release(sim);
    sim.controls.notch = 8;
    while (sim.train.v * 3.6 < 100) sim.step();
    sim.controls.notch = 0;
    sim.controls.emergency = true;
    const start = sim.train.s;
    while (sim.train.v > 0) sim.step();
    expect(sim.train.s - start).toBeLessThan(service);
  });

  it('flags wheel slip when demand exceeds adhesion', () => {
    const sim = makeSim();
    release(sim);
    sim.consist.loco.adhesionDry = 0.1;
    sim.controls.notch = 8;
    sim.step();
    expect(sim.train.wheelSlip).toBe(true);
    sim.consist.loco.adhesionDry = 0.3;
  });
});
