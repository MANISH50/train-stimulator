import { describe, expect, it } from 'vitest';
import { levelById, levelSetup } from '../src/content/catalog';
import type { SimEvent } from '../src/sim/events';
import { Sim } from '../src/sim/sim';
import { autopilot, drive } from './autopilot';

const level = (id: string) => new Sim(levelSetup(levelById(id), 'clear'));
const debriefs = (events: SimEvent[]) =>
  events.flatMap((e) => (e.type === 'INCIDENT_DEBRIEF' ? [e.debrief] : []));
const violations = (events: SimEvent[]) =>
  events.flatMap((e) => (e.type === 'VIOLATION' ? [e.kind] : []));

describe('medical emergency (intercity)', () => {
  it('an unscheduled stop at Rampur is made, medical help waits, then a debrief', () => {
    const sim = level('intercity');
    expect(sim.player.stops.has('RMP')).toBe(false);
    const events = drive(sim, 900, () => sim.incidents[0]!.done);
    expect(sim.player.stops.has('RMP')).toBe(true);
    const d = debriefs(events).find((x) => x.title.includes('medical'))!;
    expect(d).toBeDefined();
    expect(d.violations).toEqual([]);
    expect(d.rule).toContain('Rail Madad 139');
    expect(events.some((e) => e.type === 'STATION_STOP' && e.stationId === 'RMP')).toBe(true);
  });

  it('running through without stopping is a violation', () => {
    const sim = level('intercity');
    sim.train.s = 2500;
    sim.player.frontS = 2500;
    sim.step(); // the guard's request
    expect(sim.incidents[0]!.phase).toBe('requested');
    sim.train.s = 5150;
    sim.player.frontS = 5150;
    sim.train.v = 30;
    Object.assign(sim.controls, { indepBrake: 0, autoBrake: 0, notch: 0, reverser: 1 });
    const events: SimEvent[] = [];
    for (let i = 0; i < 60 * 20 && !sim.incidents[0]!.done; i++) {
      sim.step();
      events.push(...sim.drainEvents());
    }
    expect(violations(events)).toContain('unscheduled-stop');
    expect(debriefs(events)[0]!.yourResponse).toContain('did not stop');
  });
});

describe('animals near the line (ghat express)', () => {
  const approach = (careful: boolean) => {
    const sim = level('ghat-express');
    sim.player.stops.get('NJN')!.done = true;
    sim.player.stops.get('KHP')!.done = true;
    sim.train.s = 6000;
    sim.player.frontS = 6000;
    const events: SimEvent[] = [];
    for (let i = 0; i < 60 * 240 && sim.status === 'running' && !sim.incidents[1]!.done; i++) {
      autopilot(sim, careful ? {} : { speedKmh: 95, ignoreStops: true });
      if (careful) {
        // A careful driver: sound the horn on warning and slow for the crossing.
        const warned = sim.incidents[1]!.phase === 'warning';
        sim.controls.horn = warned;
        if (warned) {
          const target = 35;
          const v = sim.train.v * 3.6;
          sim.controls.notch = v < target - 3 ? 2 : 0;
          sim.controls.autoBrake = v > target + 2 ? 0.5 : 0;
        }
      }
      sim.step();
      events.push(...sim.drainEvents());
    }
    return { sim, events };
  };

  it('slowing and sounding the horn passes cleanly', () => {
    const { sim, events } = approach(true);
    expect(sim.incidents[1]!.done).toBe(true);
    const d = debriefs(events).find((x) => x.title.includes('animals'))!;
    expect(d.violations).toEqual([]);
    expect(d.yourResponse).toContain('You sounded the horn');
    expect(d.rule).toContain('s.147');
  });

  it('passing at line speed is a violation with a near-miss narration', () => {
    const { events } = approach(false);
    expect(violations(events)).toContain('wildlife-speed');
    const lines = events.flatMap((e) => (e.type === 'INCIDENT_SAY' ? [e.line.text] : []));
    expect(lines.some((t) => t.includes('too fast'))).toBe(true);
  });
});

describe('rail fracture (intercity)', () => {
  it('control orders a caution speed; obeying it is clean', () => {
    const sim = level('intercity');
    const events = drive(sim, 900, () => sim.incidents[1]!.done);
    expect(sim.incidents[1]!.done).toBe(true);
    const d = debriefs(events).find((x) => x.title.includes('rail fracture'))!;
    expect(d.violations).toEqual([]);
    expect(d.rule).toContain('6.07');
    expect(events.some((e) => e.type === 'INCIDENT_SAY' && e.line.speaker === 'control')).toBe(
      true,
    );
  });

  it('the ordered limit shows as the current limit in the section', () => {
    const sim = level('intercity');
    sim.train.s = 7700;
    sim.player.frontS = 7700;
    sim.player.stops.set('RMP', { dwellS: 0, done: true });
    sim.step(); // control's order is given once the train passes the report point
    sim.train.s = 10350;
    sim.player.frontS = 10350;
    expect(sim.currentLimitKmh()).toBe(30);
  });

  it('ignoring the order is a violation', () => {
    const sim = level('intercity');
    sim.train.s = 7000;
    sim.player.frontS = 7000;
    sim.player.stops.set('RMP', { dwellS: 0, done: true });
    const events: SimEvent[] = [];
    for (let i = 0; i < 60 * 240 && sim.status === 'running' && !sim.incidents[1]!.done; i++) {
      autopilot(sim, { speedKmh: 100, ignoreStops: true, ignoreRed: true });
      sim.step();
      events.push(...sim.drainEvents());
    }
    expect(violations(events)).toContain('fracture-speed');
  });
});

describe('signal at danger with a crowd building (training)', () => {
  it('waiting at the home signal narrates the delay, surges the crowd, and debriefs', () => {
    const sim = level('training');
    const before = sim.crowds.stations[0]!.agents.length;
    const events = drive(sim, 600, () => sim.incidents[0]!.done);
    expect(sim.incidents[0]!.done).toBe(true);
    expect(sim.crowds.stations[0]!.agents.length).toBeGreaterThan(before);
    const d = debriefs(events).find((x) => x.title.includes('signal at danger'))!;
    expect(d.violations).toEqual([]);
    expect(d.rule).toContain('5.01');
    const speakers = events.flatMap((e) => (e.type === 'INCIDENT_SAY' ? [e.line.speaker] : []));
    expect(speakers).toContain('station');
  });
});

describe('missing child (ghat express halt)', () => {
  it('is announced in Hindi and English; the train keeps to the timetable', () => {
    const sim = level('ghat-express');
    sim.player.stops.get('NJN')!.done = true;
    sim.train.s = 8000;
    sim.player.frontS = 8000;
    const events = drive(sim, 400, () => sim.incidents[2]!.done);
    expect(sim.incidents[2]!.done).toBe(true);
    const langs = events.flatMap((e) =>
      e.type === 'INCIDENT_SAY' && e.line.speaker === 'station' ? [e.line.lang ?? 'en-IN'] : [],
    );
    expect(langs).toEqual(expect.arrayContaining(['en-IN', 'hi-IN']));
    const d = debriefs(events).find((x) => x.title.includes('missing child'))!;
    expect(d.rule).toContain('139');
    expect(d.rule).toContain('runs to the timetable');
  });
});

describe('signal call-outs', () => {
  it('the assistant calls out each signal as it comes into view, once per aspect', () => {
    const sim = level('intercity');
    const events = drive(sim, 120);
    const calls = events.flatMap((e) =>
      e.type === 'CALLOUT' ? [`${e.signalId}:${e.aspect}`] : [],
    );
    expect(calls.length).toBeGreaterThan(2);
    expect(new Set(calls).size).toBe(calls.length);
  });
});

describe('all six scenarios are present across the levels', () => {
  it('has acp, medical, wildlife, fracture, signal-hold and missing-child', () => {
    const kinds = new Set(
      ['training', 'intercity', 'ghat-express'].flatMap((id) =>
        (levelById(id).incidents ?? []).map((i) => i.kind),
      ),
    );
    expect([...kinds].sort()).toEqual(
      ['acp', 'fracture', 'medical', 'missing-child', 'signal-hold', 'wildlife'].sort(),
    );
  });
});
