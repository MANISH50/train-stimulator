import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LocoSchema, RakeSchema, RouteSchema } from '../src/content/schema';
import { Track, newSample } from '../src/sim/track/track';
import { ROUTE } from './helpers';

const cases = [
  ['content/locos', LocoSchema],
  ['content/rakes', RakeSchema],
  ['content/routes', RouteSchema],
] as const;

describe('content files', () => {
  for (const [dir, schema] of cases) {
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
      it(`${dir}/${file} matches its schema`, () => {
        const result = schema.safeParse(JSON.parse(readFileSync(join(dir, file), 'utf8')));
        expect(result.success, result.error?.message).toBe(true);
      });
    }
  }

  it('rejects a signal beyond the end of track', () => {
    const bad = { ...ROUTE, signals: [{ ...ROUTE.signals[0]!, chainageM: 99999 }] };
    expect(RouteSchema.safeParse(bad).success).toBe(false);
  });
});

describe('track geometry', () => {
  const track = new Track(ROUTE);

  it('has the summed segment length', () => {
    expect(track.length).toBe(4200);
  });

  it('turns left through the first curve by length/radius radians', () => {
    const out = newSample();
    expect(track.sample(1800, out).heading).toBeCloseTo(600 / 1000, 2);
  });

  it('climbs on the 1 in 200 grade', () => {
    const a = track.sample(1400, newSample()).y;
    const b = track.sample(2400, newSample()).y;
    expect(b - a).toBeCloseTo(5, 0);
  });
});
