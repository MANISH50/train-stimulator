// A simple, rule-abiding test driver for the player's train: obeys signals, stops at booked
// stops, keeps to the speed limit. Used by scenario tests and tools/perf-sim.
import type { Sim } from '../src/sim/sim';
import { stopMarkFor } from '../src/sim/traffic/mover';

export function autopilot(sim: Sim): void {
  const c = sim.controls;
  c.indepBrake = 0;
  c.reverser = 1;
  const s = sim.train.s;
  const v = sim.train.v;
  let authority = Infinity;
  const sig = sim.nextSignalView();
  if (sig && sig.aspect === 'RED' && sig.def.kind !== 'distant') authority = sig.distM - 30;
  const stop = sim.playerNextStop();
  if (stop && !stop.stop.done) authority = Math.min(authority, stopMarkFor(stop.station, 1) - s);

  // Plan braking well inside what the rake can do (goods trains brake far less).
  const planDecel = Math.min(0.35, sim.consist.rake.brakeForceRatio * 9.81 * 0.5);
  // Anticipate the time the air brake takes to build up along the train.
  const lagS = 2 + sim.consist.rake.bcApplyTauS * 1.5;
  authority -= Math.max(0, v) * lagS * 0.5;
  const limit = (sim.currentLimitKmh() - 4) / 3.6;
  const curve =
    authority === Infinity ? Infinity : Math.sqrt(2 * planDecel * Math.max(0, authority));
  const target = Math.min(limit, curve);
  if (authority < 3) {
    c.notch = 0;
    c.autoBrake = 1;
  } else if (v < target - 1.5) {
    c.notch = target - v > 5 ? 8 : 4;
    c.autoBrake = 0;
  } else if (v > target + 0.5) {
    c.notch = 0;
    c.autoBrake = Math.min(1, 0.3 + (v - target) * 0.15);
  } else {
    c.notch = 2;
    c.autoBrake = 0;
  }
}

/** Run the sim with the autopilot for up to `seconds`, collecting events. */
export function drive(sim: Sim, seconds: number, until?: () => boolean) {
  const events: ReturnType<Sim['drainEvents']> = [];
  const steps = Math.round(seconds * 60);
  for (let i = 0; i < steps && sim.status === 'running'; i++) {
    autopilot(sim);
    sim.step();
    events.push(...sim.drainEvents());
    if (until?.()) break;
  }
  return events;
}
