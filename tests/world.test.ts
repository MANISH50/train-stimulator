import { describe, expect, it } from 'vitest';
import { LEVELS, ROUTES, ZONES, levelById, levelSetup } from '../src/content/catalog';
import type { SimEvent } from '../src/sim/events';
import { Sim } from '../src/sim/sim';
import { QUEUE_BACK_M } from '../src/sim/station/crowd';
import { FOULING_M } from '../src/sim/traffic/mover';
import { RailNetwork } from '../src/sim/track/network';
import { blendAt, dominantZone, zoneWeightsAt } from '../src/sim/world/zones';
import { drive } from './autopilot';

const ghat = () => new Sim(levelSetup(levelById('ghat-express'), 'clear'));

describe('scene zones', () => {
  const route = ROUTES.get('ghat-express')!;
  const scene = route.scene!;

  it('every route has a scene script that covers it with known zones', () => {
    for (const r of ROUTES.values()) {
      expect(r.scene, r.id).toBeDefined();
      for (const z of r.scene!.zones) expect(ZONES.has(z.zoneId), z.zoneId).toBe(true);
    }
  });

  it('weights sum to 1 and change smoothly across every boundary', () => {
    let prev = blendAt(scene, ZONES, 0, (z) => z.relief.heightM);
    for (let s = 0; s <= 23700; s += 10) {
      const w = zoneWeightsAt(scene, s);
      expect(w.reduce((a, e) => a + e.w, 0)).toBeCloseTo(1, 6);
      const h = blendAt(scene, ZONES, s, (z) => z.relief.heightM);
      expect(Math.abs(h - prev)).toBeLessThan(2.5); // no hard cut in 10 m
      prev = h;
    }
  });

  it('runs city -> farmland -> forest -> ghat -> hill station in order', () => {
    const order = [500, 8000, 14000, 18000, 23000].map((s) => dominantZone(scene, s));
    expect(order).toEqual(['city', 'farmland', 'forest', 'ghat', 'hill-station']);
  });

  it('the journey log names zones and landmarks as the train passes them', () => {
    const sim = ghat();
    const events = drive(sim, 2400);
    const zones = events.flatMap((e) => (e.type === 'ZONE_ENTERED' ? [e.zoneId] : []));
    expect(zones).toEqual([
      'city',
      'suburb',
      'industrial',
      'farmland',
      'river',
      'forest',
      'ghat',
      'hill-station',
    ]);
    const marks = events.flatMap((e) => (e.type === 'LANDMARK' ? [e.kind] : []));
    expect(marks).toEqual(['level-crossing', 'river-bridge', 'tunnel', 'viaduct', 'tunnel']);
    expect(sim.status, sim.failReason).toBe('finished');
  }, 60_000);
});

describe('junction yard', () => {
  const route = ROUTES.get('ghat-express')!;
  const net = new RailNetwork(route, 23715);
  const loops = net.loopsAt('NJN', 1);

  it('every numbered platform line leaves and rejoins the main line', () => {
    expect(loops.map((l) => l.platform).sort()).toEqual([1, 2]);
    for (const l of loops) {
      expect(net.offsetAt(l.lineId, l.fromM)).toBeCloseTo(net.offsetAt('UP', l.fromM));
      expect(net.offsetAt(l.lineId, l.toM)).toBeCloseTo(net.offsetAt('UP', l.toM));
      // And it stands clear of the main line through the platform.
      expect(Math.abs(net.offsetAt(l.lineId, 2800) - net.offsetAt('UP', 2800))).toBeGreaterThan(
        FOULING_M,
      );
    }
  });

  it('routes the player to the booked platform with a lit route indicator', () => {
    const sim = ghat();
    const home = sim.setup.route.signals.find((s) => s.id === 'NJN-H')!;
    const shown = new Set<number>();
    drive(sim, 400, () => {
      const n = sim.routeIndicator(home);
      // Only while the player's train is the one approaching the home signal.
      if (
        n !== null &&
        sim.movers.every((m) => m === sim.player || m.dir === -1 || m.frontS > home.chainageM)
      )
        shown.add(n);
      return sim.player.stops.get('NJN')!.arrivedAtS !== undefined;
    });
    expect(sim.player.loopRoutes.get('NJN')).toBe('PF1-NJN');
    expect([...shown]).toEqual([1]);
    expect(sim.aspectOf(home)).toBe('RED'); // back at danger behind the train
  });

  it('never clears two trains onto conflicting routes', () => {
    // P1 and P2 exits share the crossover ladder: when one starter is off, the other is on.
    const sim = ghat();
    const p1 = sim.setup.route.signals.find((s) => s.id === 'NJN-S1')!;
    const p2 = sim.setup.route.signals.find((s) => s.id === 'NJN-S2')!;
    for (let i = 0; i < 60 * 500 && sim.status === 'running'; i++) {
      drive(sim, 1 / 60);
      const a = sim.aspectOf(p1) !== 'RED';
      const b = sim.aspectOf(p2) !== 'RED';
      const p1Train = sim.movers.some(
        (m) => m.loopRoutes.get('NJN') === 'PF1-NJN' && Math.abs(m.frontS - 2800) < 60,
      );
      const p2Train = sim.movers.some(
        (m) => m.loopRoutes.get('NJN') === 'PF2-NJN' && Math.abs(m.frontS - 2800) < 60,
      );
      if (p1Train && p2Train) expect(a && b).toBe(false);
    }
  });

  it('running over the points too fast is recorded as a violation', () => {
    const sim = ghat();
    const events = drive(sim, 300, () => sim.train.s > 2400, { speedKmh: 45 });
    const v = events.find((e) => e.type === 'VIOLATION');
    expect(v && v.type === 'VIOLATION' && v.kind).toBe('turnout-speed');
  });
});

describe('station crowd', () => {
  it('is deterministic', () => {
    const a = ghat();
    const b = ghat();
    drive(a, 200);
    drive(b, 200);
    const pose = (s: Sim) =>
      s.crowds.stations[0]!.agents.map((x) => `${x.s.toFixed(3)},${x.y.toFixed(3)},${x.state}`);
    expect(pose(a)).toEqual(pose(b));
  });

  it('passengers queue behind the safety line, then board and alight', () => {
    const sim = ghat();
    const njn = sim.crowds.stations.find((c) => c.station.id === 'NJN')!;
    expect(njn.agents.length).toBeGreaterThan(200);
    drive(sim, 400, () => sim.train.s > 2300);
    const queued = njn.agents.filter((a) => a.state === 'queue');
    expect(queued.length).toBeGreaterThan(10);
    // Every queue target is at least the safety distance back from the platform edge.
    for (const a of queued) {
      expect(Math.abs(a.ty - a.edgeY)).toBeGreaterThanOrEqual(QUEUE_BACK_M - 1e-6);
    }
    drive(sim, 300, () => sim.player.stops.get('NJN')!.done);
    expect(njn.boarded).toBeGreaterThan(0);
    expect(njn.alighted).toBeGreaterThan(0);
  });
});

describe('ACP incident', () => {
  it('vents the brakes, stops the train, resets, then gives a debrief', () => {
    const sim = ghat();
    const events: SimEvent[] = drive(sim, 900, () => sim.incidents[0]!.phase === 'done');
    const said = events.filter((e) => e.type === 'INCIDENT_SAY');
    expect(said.length).toBeGreaterThanOrEqual(4);
    const debrief = events.find((e) => e.type === 'INCIDENT_DEBRIEF');
    expect(debrief).toBeDefined();
    if (debrief?.type === 'INCIDENT_DEBRIEF') expect(debrief.debrief.rule).toContain('Section 141');
    expect(sim.incidents[0]!.stoppedAtS).toBeGreaterThan(sim.incidents[0]!.pulledAtS);
  });

  it('every level still loads', () => {
    for (const l of LEVELS) expect(() => new Sim(levelSetup(l, 'clear'))).not.toThrow();
  });
});
