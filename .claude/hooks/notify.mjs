// Notification: append a timestamped line to the log section of docs/PROGRESS.md.
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, readInput } from './lib.mjs';

const input = await readInput();
const msg = String(input.message ?? '')
  .replace(/\s+/g, ' ')
  .trim();
if (!msg) process.exit(0);
const file = join(ROOT, 'docs/PROGRESS.md');
const hasLog = existsSync(file) && readFileSync(file, 'utf8').includes('\n## Log');
appendFileSync(file, `${hasLog ? '' : '\n## Log\n'}- ${new Date().toISOString()} — ${msg}\n`);
