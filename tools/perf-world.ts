// Headless living-world performance smoke test. For every route and quality preset, streams
// the scene-zone dressing at points every 250 m and checks the instances and triangles in view
// against per-preset budgets, reported per zone type. Also times the crowd simulation at the
// busiest station. Fails (exit 1) on any budget breach.
import * as THREE from 'three';
import { ROUTES, ZONES, levelById, levelSetup } from '../src/content/catalog';
import { PRESETS, QUALITY_ORDER } from '../src/render/quality';
import { ZoneWorld } from '../src/render/scene/zoneWorld';
import { Sim } from '../src/sim/sim';
import { Track } from '../src/sim/track/track';
import { dominantZone } from '../src/sim/world/zones';

/** Budgets for streamed dressing in view (instances, triangles) per preset. */
const BUDGET = {
  low: { instances: 2500, triangles: 120_000 },
  medium: { instances: 5000, triangles: 250_000 },
  high: { instances: 9000, triangles: 450_000 },
} as const;
/** Average crowd update at the busiest station, per sim step (ms). */
const CROWD_BUDGET_MS = 0.05;

let failed = false;
for (const route of ROUTES.values()) {
  const track = new Track(route);
  for (const q of QUALITY_ORDER) {
    const zw = new ZoneWorld(track, route, ZONES, PRESETS[q]);
    const perZone = new Map<string, { inst: number; tris: number }>();
    for (let s = 0; s < track.length; s += 250) {
      zw.update(s);
      let tris = 0;
      zw.root.traverse((o) => {
        const m = o as THREE.InstancedMesh;
        if (!m.isInstancedMesh) return;
        const g = m.geometry;
        const t = (g.index ? g.index.count : g.attributes['position']!.count) / 3;
        tris += t * m.count;
      });
      const zone = dominantZone(route.scene!, s) ?? '?';
      const cur = perZone.get(zone) ?? { inst: 0, tris: 0 };
      perZone.set(zone, {
        inst: Math.max(cur.inst, zw.instanceCount()),
        tris: Math.max(cur.tris, tris),
      });
    }
    const b = BUDGET[q];
    for (const [zone, v] of perZone) {
      const ok = v.inst <= b.instances && v.tris <= b.triangles;
      failed ||= !ok;
      if (!ok || q === 'medium') {
        console.log(
          `${ok ? 'ok  ' : 'OVER'} ${route.id.padEnd(13)} ${q.padEnd(6)} ${zone.padEnd(13)} ` +
            `${String(v.inst).padStart(5)} instances, ${(v.tris / 1000).toFixed(0).padStart(4)}k tris ` +
            `(budget ${b.instances} / ${b.triangles / 1000}k)`,
        );
      }
    }
  }
}

// Crowd simulation cost at the busiest station (Nagarpur Junction).
{
  const sim = new Sim(levelSetup(levelById('ghat-express'), 'clear'));
  sim.train.s = 2700;
  sim.player.frontS = 2700;
  const steps = 6000;
  const t0 = performance.now();
  for (let i = 0; i < steps; i++) sim.crowds.step(1 / 60, sim.movers, 2700);
  const ms = (performance.now() - t0) / steps;
  const agents = sim.crowds.stations.reduce((n, c) => n + c.agents.length, 0);
  const ok = ms <= CROWD_BUDGET_MS;
  failed ||= !ok;
  console.log(
    `${ok ? 'ok  ' : 'SLOW'} crowd sim: ${agents} agents, ${(ms * 1000).toFixed(1)} µs/step (budget ${CROWD_BUDGET_MS * 1000} µs)`,
  );
}
process.exit(failed ? 1 : 0);
