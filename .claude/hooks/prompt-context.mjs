// UserPromptSubmit: attach current progress and roadmap scope as context (stdout).
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './lib.mjs';

const read = (p) => (existsSync(join(ROOT, p)) ? readFileSync(join(ROOT, p), 'utf8') : '');
const progress = read('docs/PROGRESS.md').split('\n## Log')[0].trim();
const roadmap = read('docs/ROADMAP.md').trim();
if (progress || roadmap) {
  process.stdout.write(
    `<project-status>\n${progress.slice(0, 3000)}\n\n${roadmap.slice(0, 3000)}\n</project-status>\n`,
  );
}
