// PreToolUse(Bash|PowerShell): block dangerous shell commands.
import { block, readInput } from './lib.mjs';

const RULES = [
  [
    /\b(curl|wget|iwr|Invoke-WebRequest)\b[^|]*\|\s*(sh|bash|zsh|iex|Invoke-Expression|powershell)\b/i,
    'piping a download into a shell',
  ],
  [/\brm\s+-[a-z]*r[a-z]*\s+(\/|~|\$HOME|\*)(\s|$)/i, 'recursive delete of a root/home path'],
  [/\bgit\s+push\b.*(--force|\s-f\b)/, 'force push'],
  [/\bgit\s+(reset\s+--hard|clean\s+-[a-z]*f)/, 'destructive git reset/clean'],
  [/\b(cat|type|Get-Content|less|more|head|tail)\s+\S*\.env(\s|$)/i, 'reading .env secrets'],
];

const input = await readInput();
const cmd = String(input.tool_input?.command ?? '');
for (const [re, what] of RULES) {
  if (re.test(cmd)) block(`Blocked: ${what}. Ask the user to run it themselves if it is really needed.`);
}
