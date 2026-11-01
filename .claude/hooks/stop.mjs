// Stop / SubagentStop: tests (incl. signal-rule scenarios), lint, typecheck, content and sim perf.
// Blocks completion with a reason when any check fails.
import { execSync } from 'node:child_process';
import { ROOT, failureText, hasDeps, readInput } from './lib.mjs';

const input = await readInput();
if (input.stop_hook_active || !hasDeps()) process.exit(0);

const CHECKS = [
  'npm test --silent',
  'npm run lint --silent',
  'npm run typecheck --silent',
  'npm run validate:content --silent',
  'npm run perf:sim --silent',
];
for (const cmd of CHECKS) {
  try {
    execSync(cmd, { cwd: ROOT, stdio: 'pipe', timeout: 300_000 });
  } catch (e) {
    const reason = `"${cmd}" failed. Fix it before finishing:\n${failureText(e, 2500)}`;
    process.stdout.write(JSON.stringify({ decision: 'block', reason }));
    process.exit(0);
  }
}
