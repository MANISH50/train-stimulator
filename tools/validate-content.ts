import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { LocoSchema, RakeSchema, RouteSchema } from '../src/content/schema';

const dirs = [
  ['content/locos', LocoSchema],
  ['content/rakes', RakeSchema],
  ['content/routes', RouteSchema],
] as const;

let failed = 0;
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
process.exit(failed ? 1 : 0);
