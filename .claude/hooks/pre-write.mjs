// PreToolUse(Write|Edit): block secrets and asset files without a licence entry.
import { existsSync, readFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import { ROOT, block, readInput } from './lib.mjs';

const SECRET_PATTERNS = [
  [/AKIA[0-9A-Z]{16}/, 'AWS access key'],
  [/-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/, 'private key'],
  [/gh[pousr]_[A-Za-z0-9]{30,}/, 'GitHub token'],
  [/sk-[A-Za-z0-9_-]{32,}/, 'API secret key'],
  [/AIza[0-9A-Za-z_-]{35}/, 'Google API key'],
  [/(api[_-]?key|secret|password|token)\s*[:=]\s*['"][^'"\s]{16,}['"]/i, 'hard-coded credential'],
];

const input = await readInput();
const ti = input.tool_input ?? {};
const file = String(ti.file_path ?? '');
const text = String(ti.content ?? ti.new_string ?? '');
const rel = relative(ROOT, file).replace(/\\/g, '/');

if (/(^|\/)\.env($|\.)/.test(rel) && !rel.endsWith('.env.example')) {
  block(`Blocked: do not write ${rel}. Keep secrets out of the repo; use .env.example placeholders.`);
}
for (const [re, what] of SECRET_PATTERNS) {
  if (re.test(text)) block(`Blocked: content for ${rel} looks like a ${what}. Never commit secrets.`);
}
// Any asset file (image, audio, model, font) anywhere in the repo needs a licence row first.
const ASSET_EXT = /\.(png|jpe?g|webp|gif|ktx2|glb|gltf|fbx|obj|mp3|ogg|wav|flac|ttf|otf|woff2?)$/i;
if (!rel.startsWith('test-results/') && (rel.startsWith('public/assets/') || ASSET_EXT.test(rel))) {
  const licences = join(ROOT, 'docs/ASSET_LICENSES.md');
  const listed = existsSync(licences) && readFileSync(licences, 'utf8').includes(basename(rel));
  if (!listed) {
    block(`Blocked: ${rel} has no row in docs/ASSET_LICENSES.md. Add its source and licence first.`);
  }
}
