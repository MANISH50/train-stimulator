// PostToolUse(Bash|PowerShell): run npm audit after dependency changes.
import { execFileSync } from 'node:child_process';
import { ROOT, failureText, hasDeps, readInput } from './lib.mjs';

const input = await readInput();
const cmd = String(input.tool_input?.command ?? '');
if (!hasDeps() || !/\bnpm\s+(i|install|add|update|uninstall)\b/.test(cmd)) process.exit(0);
try {
  execFileSync('npm', ['audit', '--omit=dev', '--audit-level=high'], {
    cwd: ROOT,
    stdio: 'pipe',
    shell: true,
    timeout: 120_000,
  });
} catch (e) {
  process.stderr.write(`npm audit found high/critical issues in runtime dependencies:\n${failureText(e)}\n`);
  process.exit(2);
}
