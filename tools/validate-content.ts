import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  LevelSchema,
  LocoSchema,
  RakeSchema,
  RouteSchema,
  TrainTypeSchema,
  ZonesFileSchema,
  FactsFileSchema,
} from '../src/content/schema';

const dirs = [
  ['content/locos', LocoSchema],
  ['content/rakes', RakeSchema],
  ['content/routes', RouteSchema],
  ['content/trains', TrainTypeSchema],
  ['content/levels', LevelSchema],
  ['content/zones', ZonesFileSchema],
] as const;

let failed = 0;
{
  const r = FactsFileSchema.safeParse(JSON.parse(readFileSync('content/facts.json', 'utf8')));
  if (r.success) console.log('ok   content/facts.json');
  else {
    failed++;
    console.error(`FAIL content/facts.json\n${r.error.message}`);
  }
}
for (const [dir, schema] of dirs) {
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const path = join(dir, file);
    const result = schema.safeParse(JSON.parse(readFileSync(path, 'utf8')));
    if (result.success) console.log(`ok   ${path}`);
    else {
      failed++;
      console.error(`FAIL ${path}\n${result.error.message}`);
    }
  }
}

// Cross-references: every level's route, trains and stations must exist.
try {
  const { LEVELS, ROUTES, ZONES, levelSetup } = await import('../src/content/catalog');
  // Every route has a scene script whose zones exist, and every station a crowd profile.
  for (const route of ROUTES.values()) {
    if (!route.scene) throw new Error(`route ${route.id} has no scene script`);
    for (const z of route.scene.zones) {
      if (!ZONES.has(z.zoneId)) throw new Error(`route ${route.id}: unknown zone ${z.zoneId}`);
    }
    for (const st of route.stations) {
      if (!st.crowd) throw new Error(`route ${route.id}: station ${st.id} has no crowd profile`);
    }
    console.log(`ok   route ${route.id} scene (${route.scene.zones.length} zones)`);
  }
  for (const level of LEVELS) {
    const setup = levelSetup(level, 'clear');
    const stations = new Set(ROUTES.get(level.routeId)!.stations.map((s) => s.id));
    for (const stop of [...level.player.stops, ...level.traffic.flatMap((t) => t.stops)]) {
      if (!stations.has(stop.stationId))
        throw new Error(`${level.id}: unknown station ${stop.stationId}`);
    }
    console.log(`ok   level ${level.id} (${setup.traffic?.length ?? 0} AI trains)`);
  }
} catch (e) {
  failed++;
  console.error(`FAIL cross-references: ${(e as Error).message}`);
}
process.exit(failed ? 1 : 0);
