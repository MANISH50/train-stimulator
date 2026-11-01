// Force model. Equations and coefficients: docs/research/02-train-physics.md
// ("Recommended model for the game"). Resistances use the IR convention of kg/t.
import type { Davis, LocoParams, RakeParams } from '../types';

export const G = 9.81;
/** Wheel-slip: while slipping only this share of the adhesion limit reaches the rail. */
const SLIP_TRANSMITTED = 0.7;
/** Below this speed running resistance blends toward the starting resistance. */
const STARTING_BLEND_KMH = 8;

export interface Consist {
  loco: LocoParams;
  rake: RakeParams;
  massKg: number;
  locoMassKg: number;
  rakeMassKg: number;
  /** Mass including rotating-mass allowance, used for acceleration. */
  effectiveMassKg: number;
  lengthM: number;
}

export function makeConsist(loco: LocoParams, rake: RakeParams): Consist {
  const locoMassKg = loco.massT * 1000;
  const rakeMassKg = rake.vehicles * rake.vehicleMassT * 1000;
  return {
    loco,
    rake,
    locoMassKg,
    rakeMassKg,
    massKg: locoMassKg + rakeMassKg,
    effectiveMassKg:
      locoMassKg * (1 + loco.rotatingMassFraction) + rakeMassKg * (1 + rake.rotatingMassFraction),
    lengthM: loco.lengthM + rake.vehicles * rake.vehicleLengthM,
  };
}

/** Tractive effort demanded by the notch, before the adhesion limit (N, >= 0). */
export function tractiveEffortDemand(c: Consist, notch: number, speedMs: number): number {
  const { loco } = c;
  if (notch <= 0) return 0;
  const frac = Math.min(notch, loco.notches) / loco.notches;
  const v = Math.abs(speedMs);
  if (v >= loco.maxSpeedKmh / 3.6) return 0;
  const boost = loco.gameTractionBoost ?? 1;
  const teCap = loco.maxTractiveEffortKN * 1000 * frac * boost;
  // Constant-power region: TE = P / v (guard v near zero).
  const powerLimited = (loco.powerKW * 1000 * frac * boost) / Math.max(v, 0.5);
  return Math.min(teCap, powerLimited);
}

export function adhesionLimit(c: Consist, adhesionCoeff: number): number {
  return adhesionCoeff * (c.loco.gameTractionBoost ?? 1) * c.locoMassKg * G;
}

/** Tractive effort reaching the rail, and whether the wheels are slipping. */
export function railTractiveEffort(
  c: Consist,
  demandN: number,
  adhesionCoeff: number,
): { te: number; slip: boolean } {
  const limit = adhesionLimit(c, adhesionCoeff);
  if (demandN <= limit) return { te: demandN, slip: false };
  return { te: limit * SLIP_TRANSMITTED, slip: true };
}

function davisKgPerT(d: Davis, vKmh: number): number {
  const running = d.a + d.b * vKmh + d.c * vKmh * vKmh;
  if (vKmh >= STARTING_BLEND_KMH) return running;
  const t = vKmh / STARTING_BLEND_KMH;
  return d.starting + (running - d.starting) * t;
}

/** Loco + rake Davis resistance plus curve resistance, magnitude in N. */
export function runningResistance(c: Consist, speedMs: number, curveRadiusM: number): number {
  const vKmh = Math.abs(speedMs) * 3.6;
  const kgf =
    (c.locoMassKg / 1000) * davisKgPerT(c.loco.resistance, vKmh) +
    (c.rakeMassKg / 1000) * davisKgPerT(c.rake.resistance, vKmh);
  return kgf * G + curveResistance(c, curveRadiusM);
}

/** Broad-gauge curve resistance: 0.4 kg/t per degree of curvature, D = 1750 / R. */
export function curveResistance(c: Consist, radiusM: number): number {
  if (!Number.isFinite(radiusM) || radiusM <= 0) return 0;
  const degrees = 1750 / radiusM;
  return (c.massKg / 1000) * 0.4 * degrees * G;
}

/** Gravity component along +chainage (N). Uphill (grade > 0) gives a negative force. */
export function gradeForce(c: Consist, grade: number): number {
  return -c.massKg * G * grade;
}
