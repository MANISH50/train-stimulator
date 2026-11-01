// PostToolUse(Write|Edit): format, lint, run related tests, validate content, check asset budget.
import { execFileSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { relative } from 'node:path';
import { ROOT, block, failureText, hasDeps, readInput } from './lib.mjs';

const ASSET_BUDGET_BYTES = 2 * 1024 * 1024;
const input = await readInput();
const file = String(input.tool_input?.file_path ?? '');
if (!file || !existsSync(file) || !hasDeps()) process.exit(0);
const rel = relative(ROOT, file).replace(/\\/g, '/');
if (rel.startsWith('..') || rel.startsWith('.claude/') || rel.startsWith('docs/research/')) process.exit(0);

/** Run an npx tool; returns '' on success or its output on failure. */
function npx(args) {
  try {
    execFileSync('npx', args, { cwd: ROOT, stdio: 'pipe', shell: true, timeout: 120_000 });
    return '';
  } catch (e) {
    return failureText(e);
  }
}

const quoted = `"${rel}"`;
const problems = [];
if (/\.(ts|js|mjs|json|css|html)$/.test(rel)) npx(['prettier', '--write', quoted]);
if (/\.(ts|js)$/.test(rel)) {
  const lint = npx(['eslint', quoted]);
  if (lint) problems.push(`ESLint:\n${lint}`);
}
if (/^(src|tests)\/.*\.ts$/.test(rel)) {
  const tests = npx(['vitest', 'related', '--run', '--passWithNoTests', quoted]);
  if (tests) problems.push(`Related tests failed:\n${tests}`);
}
if (rel.startsWith('content/') && rel.endsWith('.json')) {
  const v = npx(['tsx', 'tools/validate-content.ts']);
  if (v) problems.push(`Content validation failed:\n${v}`);
}
if (rel.startsWith('public/assets/')) {
  const size = statSync(file).size;
  if (size > ASSET_BUDGET_BYTES) {
    problems.push(`Asset ${rel} is ${(size / 1048576).toFixed(1)} MB; the budget is 2 MB per file.`);
  }
}
if (problems.length) block(problems.join('\n\n'));
