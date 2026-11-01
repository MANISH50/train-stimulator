// Shared helpers for Claude Code hooks. Hooks receive a JSON payload on stdin.
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export const ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
export const hasDeps = () => existsSync(join(ROOT, 'node_modules'));

export async function readInput() {
  let raw = '';
  for await (const chunk of process.stdin) raw += chunk;
  try {
    return JSON.parse(raw || '{}');
  } catch {
    return {};
  }
}

/** Exit code 2 blocks the tool call (Pre) or reports back to Claude (Post); stderr is the reason. */
export function block(reason) {
  process.stderr.write(reason + '\n');
  process.exit(2);
}

/** Output of a failed child process, trimmed for hook messages. */
export function failureText(e, max = 3000) {
  return `${(e.stdout ?? '').toString()}${(e.stderr ?? '').toString()}`.trim().slice(-max);
}
