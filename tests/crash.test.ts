import { describe, expect, it } from 'vitest';
import { levelById, levelSetup } from '../src/content/catalog';
import { CrashSim } from '../src/sim/crash/crashSim';
import type { SimEvent } from '../src/sim/events';
import { Sim } from '../src/sim/sim';
import type { RouteDef } from '../src/sim/types';
import { drive, type DriverOptions } from './autopilot';
import { LOCO, RAKE, flatRoute } from './helpers';

function level(id: string, accidents = true): Sim {
  return new Sim(levelSetup(levelById(id), 'clear', accidents));
}

const reckless: DriverOptions = { ignoreRed: true, ignoreStops: true };

/** Step a crashed sim until the wreck settles; returns the events seen meanwhile. */
function settle(sim: Sim): SimEvent[] {
  const events: SimEvent[] = [];
  for (let i = 0; i < 35 * 60 && !sim.crash?.settled; i++) {
    sim.step();
    events.push(...sim.drainEvents());
  }
  sim.step();
  events.push(...sim.drainEvents());
  return events;
}

/** Mail level: draw up in the Sitapur loop, then leave against the red loop starter. */
function mailLoopDeparture(superfastDistM: number): { sim: Sim; events: SimEvent[] } {
  const sim = level('mail');
  const superfast = () => sim.ai.find((a) => a.id === 'up-superfast');
  const events = drive(sim, 900, () => sim.train.v === 0 && sim.train.s > 6900);
  events.push(...drive(sim, 600, () => (superfast()?.frontS ?? -1e9) > 7080 - superfastDistM));
  events.push(...drive(sim, 200, undefined, { ...reckless, speedKmh: 25 }));
  return { sim, events };
}

function bufferRoute(): RouteDef {
  return { ...flatRoute(), segments: [{ type: 'straight', lengthM: 3100 }], bufferStopM: 3000 };
}

function bufferRun(kmh: number): { sim: Sim; events: SimEvent[] } {
  const sim = new Sim({
    route: bufferRoute(),
    loco: LOCO,
    rake: RAKE,
    startS: 2500,
    accidents: true,
  });
  const events = drive(sim, 300, () => sim.status !== 'running' || sim.train.s > 2999, {
    speedKmh: kmh,
  });
  events.push(...drive(sim, 5, undefined, { speedKmh: kmh }));
  return { sim, events };
}

describe('SPAD with accidents on', () => {
  it('runs on after a SPAD and fails as a near miss when the train stops in clear track', () => {
    const sim = level('training');
    const events = drive(sim, 900, () => sim.spad !== null, reckless);
    const spad = events.find((e) => e.type === 'SPAD');
    expect(spad && spad.type === 'SPAD' && spad.fatal).toBe(false);
    expect(sim.status).toBe('running');
    sim.controls.notch = 0;
    sim.controls.emergency = true;
    const more = drive(sim, 120, undefined, { ...reckless, speedKmh: 0 });
    expect(sim.status).toBe('failed');
    expect(more.some((e) => e.type === 'SPAD_STOPPED')).toBe(true);
    expect(sim.crash).toBeNull();
  });

  it('with accidents off a SPAD still ends the run at once', () => {
    const sim = level('training', false);
    const events = drive(sim, 900, undefined, reckless);
    const spad = events.find((e) => e.type === 'SPAD');
    expect(spad && spad.type === 'SPAD' && spad.fatal).toBe(true);
    expect(sim.status).toBe('failed');
  });
});

describe('collisions', () => {
  it('rear-end: running through red into the EMU ahead', () => {
    const sim = level('suburban');
    const events = drive(sim, 900, undefined, reckless);
    const hit = events.find((e) => e.type === 'COLLISION');
    expect(hit && hit.type === 'COLLISION' && hit.kind).toBe('rear-end');
    expect(sim.status).toBe('crashed');
    expect(sim.accident?.spad).toBeDefined();
    settle(sim);
    expect(sim.crash!.derailedCount()).toBeGreaterThan(0);
  });

  it('side: leaving the loop against the red loop starter as the Superfast passes', () => {
    const { sim, events } = mailLoopDeparture(800);
    const hit = events.find((e) => e.type === 'COLLISION');
    expect(hit && hit.type === 'COLLISION' && hit.kind).toBe('side');
    expect(hit && hit.type === 'COLLISION' && hit.otherLabel).toBe('Superfast Express');
    expect(sim.accident?.spad?.label).toContain('Loop Starter');
  });

  it('an AI driver who sights the fouling train in time brakes and stops short', () => {
    const { sim, events } = mailLoopDeparture(1500);
    expect(events.some((e) => e.type === 'COLLISION')).toBe(false);
    expect(sim.ai.find((a) => a.id === 'up-superfast')?.emergency).toBe(true);
  });

  it('every signal goes to danger after an accident', () => {
    const sim = level('suburban');
    drive(sim, 900, undefined, reckless);
    expect(sim.status).toBe('crashed');
    expect(sim.setup.route.signals.every((s) => sim.aspectOf(s) === 'RED')).toBe(true);
  });
});

describe('derailment', () => {
  it('derails on the loop points well above their limit', () => {
    const sim = level('mail');
    const events = drive(sim, 900, undefined, { ignoreStops: true, speedKmh: 55 });
    const d = events.find((e) => e.type === 'DERAILMENT');
    expect(d && d.type === 'DERAILMENT' && d.cause).toBe('points');
    expect(sim.status).toBe('crashed');
  });

  it('does not derail at a modest overspeed on the points', () => {
    const sim = level('mail');
    const events = drive(sim, 900, () => sim.train.s > 6700, { ignoreStops: true, speedKmh: 36 });
    expect(events.some((e) => e.type === 'DERAILMENT')).toBe(false);
    expect(events.some((e) => e.type === 'OVERSPEED')).toBe(true);
  });
});

describe('buffer stops', () => {
  it('a gentle touch is only a bump', () => {
    const { sim, events } = bufferRun(5);
    expect(events.some((e) => e.type === 'BUFFER_BUMP')).toBe(true);
    expect(sim.crash).toBeNull();
    expect(sim.train.s).toBeLessThan(3000);
  });

  it('hitting them at speed is a crash', () => {
    const { sim, events } = bufferRun(30);
    const hit = events.find((e) => e.type === 'COLLISION');
    expect(hit && hit.type === 'COLLISION' && hit.kind).toBe('buffer');
    settle(sim);
    expect(sim.crash!.bufferBody!.anchored).toBe(false);
  });

  it('with accidents off an overrun fails the run without a crash', () => {
    const sim = new Sim({ route: bufferRoute(), loco: LOCO, rake: RAKE, startS: 2500 });
    const events = drive(sim, 300, undefined, { speedKmh: 30 });
    expect(events.some((e) => e.type === 'BUFFER_OVERRUN')).toBe(true);
    expect(sim.status).toBe('failed');
  });

  it('the suburban journey ends at the terminus platform', () => {
    const sim = level('suburban');
    drive(sim, 1800);
    expect(sim.status, sim.failReason).toBe('finished');
    expect(sim.train.s).toBeLessThan(sim.setup.route.bufferStopM!);
  });
});

describe('crash simulation', () => {
  it('settles within 30 s with finite poses and the energy gone', () => {
    const sim = level('suburban');
    drive(sim, 900, undefined, reckless);
    const crash = sim.crash!;
    const e0 = crash.kineticEnergy();
    settle(sim);
    expect(crash.settled).toBe(true);
    expect(crash.timeS).toBeLessThanOrEqual(30.01);
    expect(crash.kineticEnergy()).toBeLessThan(e0 * 0.01);
    for (const b of crash.bodies) {
      expect(Number.isFinite(b.s + b.y + b.z + b.yaw + b.pitch + b.roll)).toBe(true);
    }
  });

  it('energy only drains after the impact', () => {
    const { sim } = mailLoopDeparture(800);
    const crash = sim.crash!;
    let prev = crash.kineticEnergy();
    for (let i = 0; i < 6 * 60; i++) {
      sim.step();
      const e = crash.kineticEnergy();
      // Small rises are allowed for falls (gravity) and solver noise.
      expect(e).toBeLessThan(prev * 1.05 + 5e4);
      prev = Math.min(prev, e);
    }
  });

  it('a replay from the same setup gives the same wreck', () => {
    const sim = level('suburban');
    drive(sim, 900, undefined, reckless);
    settle(sim);
    const replay = new CrashSim(sim.crashSetup!, sim.track, sim.net);
    for (let i = 0; i < 35 * 60 && !replay.settled; i++) replay.step(1 / 60);
    const pose = (c: CrashSim) => c.bodies.map((b) => [b.s, b.y, b.z, b.yaw, b.roll].join(','));
    expect(pose(replay)).toEqual(pose(sim.crash!));
  });
});
