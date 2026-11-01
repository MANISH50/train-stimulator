// Simplified twin-pipe graduated-release air brake. Pressures in kg/cm² as on Indian
// loco gauges. Values from docs/research/02-train-physics.md (rates are tuning, UNVERIFIED).
import type { RakeParams } from '../types';

export const BP_CHARGED = 5.0;
export const BP_FULL_SERVICE = 3.5;
/** Distributor valve: brake-cylinder pressure is ~2.5x the brake-pipe reduction. */
const BC_PER_BP_DROP = 2.5;

const BP_APPLY_RATE = 0.5; // kg/cm² per s during service reduction
const BP_RELEASE_RATE = 0.25; // kg/cm² per s while recharging
const BP_EMERGENCY_RATE = 4.0;
const INDEP_TAU_S = 2.0;

export interface BrakeState {
  /** Brake pipe pressure at the loco. */
  bp: number;
  /** Rake-average brake pipe pressure (lags the loco by propagation time). */
  bpRake: number;
  /** Rake brake cylinder pressure. */
  bc: number;
  /** Independent (loco) brake application 0..1. */
  indep: number;
}

export function initialBrakes(): BrakeState {
  return { bp: BP_CHARGED, bpRake: BP_CHARGED, bc: 0, indep: 0 };
}

export function stepBrakes(
  b: BrakeState,
  rake: RakeParams,
  trainLengthM: number,
  autoHandle: number,
  indepHandle: number,
  emergency: boolean,
  dt: number,
): void {
  const target = emergency ? 0 : BP_CHARGED - clamp01(autoHandle) * (BP_CHARGED - BP_FULL_SERVICE);
  if (b.bp > target) {
    b.bp = Math.max(target, b.bp - (emergency ? BP_EMERGENCY_RATE : BP_APPLY_RATE) * dt);
  } else {
    b.bp = Math.min(target, b.bp + BP_RELEASE_RATE * dt);
  }

  // Rear of the train sees the change after length / signal speed; model the rake average.
  const propagationS = trainLengthM / rake.brakeSignalSpeedMps;
  const lagTau = Math.max(0.1, propagationS / (emergency ? 4 : 2));
  b.bpRake += (b.bp - b.bpRake) * Math.min(1, dt / lagTau);

  const bcTarget = Math.min(rake.bcMax, Math.max(0, (BP_CHARGED - b.bpRake) * BC_PER_BP_DROP));
  const tau = bcTarget > b.bc ? rake.bcApplyTauS : rake.bcReleaseTauS;
  b.bc += (bcTarget - b.bc) * Math.min(1, dt / tau);

  b.indep += (clamp01(indepHandle) - b.indep) * Math.min(1, dt / INDEP_TAU_S);
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}
