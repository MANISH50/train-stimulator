import { describe, expect, it } from 'vitest';
import {
  HORN_CODES,
  HornCodeDetector,
  classifyBlast,
  matchCode,
  type Blast,
} from '../src/input/hornCodes';

const DURATION: Record<Blast, number> = { short: 0.3, long: 1.2, veryLong: 3.5 };

/** Play a pattern through the detector at 60 Hz and return the finished result. */
function play(pattern: Blast[]) {
  const det = new HornCodeDetector();
  let t = 0;
  const dt = 1 / 60;
  const hold = (on: boolean, seconds: number) => {
    let result = null;
    for (let i = 0; i < Math.round(seconds / dt); i++) {
      t += dt;
      result = det.update(on, t) ?? result;
    }
    return result;
  };
  let result = null;
  for (const b of pattern) {
    hold(true, DURATION[b]);
    result = hold(false, 0.4) ?? result;
  }
  return hold(false, 2) ?? result;
}

describe('horn codes', () => {
  it('classifies press lengths', () => {
    expect(classifyBlast(0.2)).toBe('short');
    expect(classifyBlast(1)).toBe('long');
    expect(classifyBlast(4)).toBe('veryLong');
  });

  for (const code of HORN_CODES) {
    it(`recognises ${code.name} (${code.meaning})`, () => {
      const result = play(code.pattern);
      expect(result?.code?.name).toBe(code.name);
    });
  }

  it('reports unknown sequences with no code', () => {
    const result = play(['short', 'long', 'short', 'short', 'short']);
    expect(result?.blasts).toHaveLength(5);
    expect(result?.code).toBeNull();
  });

  it('every pattern is unique', () => {
    const keys = HORN_CODES.map((c) => c.pattern.join(','));
    expect(new Set(keys).size).toBe(keys.length);
    expect(matchCode([])).toBeNull();
  });
});
