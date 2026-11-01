import type { Aspect, SignalDef } from '../types';

export function aspectAt(sig: SignalDef, timeS: number): Aspect {
  let aspect: Aspect = 'RED';
  for (const step of sig.timeline ?? []) {
    if (step.atS <= timeS) aspect = step.aspect;
    else break;
  }
  return aspect;
}

/** Plain-language meaning shown in the HUD next to the lamp (colour-blind aid). */
export const ASPECT_MEANING: Record<Aspect, string> = {
  RED: 'STOP',
  YELLOW: 'CAUTION – be prepared to stop at next signal',
  DOUBLE_YELLOW: 'ATTENTION – next signal at caution',
  GREEN: 'PROCEED',
};

/** First signal whose chainage is ahead of the train front, or null. */
export function nextSignal(signals: readonly SignalDef[], frontS: number): SignalDef | null {
  let best: SignalDef | null = null;
  for (const sig of signals) {
    if (sig.chainageM > frontS && (!best || sig.chainageM < best.chainageM)) best = sig;
  }
  return best;
}
