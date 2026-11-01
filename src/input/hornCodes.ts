// Horn (whistle) code recognition. Codes and meanings: docs/research/01-signalling-rules.md §10
// (IRFCA whistle codes). Press-length thresholds are game choices (UNVERIFIED).

export type Blast = 'short' | 'long' | 'veryLong';

export const SHORT_MAX_S = 0.6;
export const LONG_MAX_S = 2.5;
/** Silence that ends a code sequence. */
export const SEQUENCE_GAP_S = 1.2;

export interface HornCode {
  pattern: Blast[];
  name: string;
  meaning: string;
}

export const HORN_CODES: HornCode[] = [
  { pattern: ['long'], name: 'one long', meaning: 'normal departure' },
  { pattern: ['short', 'short'], name: 'two short', meaning: "calling for the Guard's signal" },
  { pattern: ['short', 'short', 'short'], name: 'three short', meaning: 'Guard to apply brakes' },
  {
    pattern: ['short', 'short', 'long'],
    name: 'two short, one long',
    meaning: 'sudden loss of brake pressure',
  },
  {
    pattern: ['short', 'short', 'short', 'short'],
    name: 'four short',
    meaning: 'train cannot proceed — protect the rear',
  },
  { pattern: ['long', 'long'], name: 'two long', meaning: 'raise pantograph' },
  { pattern: ['long', 'short', 'long'], name: 'long, short, long', meaning: 'lower pantograph' },
  { pattern: ['veryLong'], name: 'very long', meaning: 'approaching a level crossing or tunnel' },
];

export function classifyBlast(durationS: number): Blast {
  if (durationS < SHORT_MAX_S) return 'short';
  if (durationS <= LONG_MAX_S) return 'long';
  return 'veryLong';
}

export function matchCode(blasts: readonly Blast[]): HornCode | null {
  return (
    HORN_CODES.find(
      (c) => c.pattern.length === blasts.length && c.pattern.every((b, i) => b === blasts[i]),
    ) ?? null
  );
}

/**
 * Feed horn on/off state each frame; returns a finished sequence once the horn has been
 * silent for SEQUENCE_GAP_S. `code` is null when the sequence is not a known code.
 */
export class HornCodeDetector {
  private pressStart: number | null = null;
  private lastRelease = 0;
  private blasts: Blast[] = [];

  update(hornOn: boolean, timeS: number): { blasts: Blast[]; code: HornCode | null } | null {
    if (hornOn && this.pressStart === null) {
      this.pressStart = timeS;
    } else if (!hornOn && this.pressStart !== null) {
      this.blasts.push(classifyBlast(timeS - this.pressStart));
      this.pressStart = null;
      this.lastRelease = timeS;
    } else if (!hornOn && this.blasts.length && timeS - this.lastRelease >= SEQUENCE_GAP_S) {
      const blasts = this.blasts;
      this.blasts = [];
      return { blasts, code: matchCode(blasts) };
    }
    return null;
  }
}
