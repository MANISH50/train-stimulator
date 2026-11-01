import type { Controls } from '../types';
import { DRY_ENV, type PhysicsEnv } from '../weather';
import type { Track } from '../track/track';
import { initialBrakes, stepBrakes, type BrakeState } from './brakes';
import {
  G,
  gradeForce,
  railTractiveEffort,
  runningResistance,
  tractiveEffortDemand,
  type Consist,
} from './forces';

const STANDSTILL_MS = 0.01;

export interface TrainState {
  /** Chainage of the train front (m). */
  s: number;
  /** Velocity along +chainage (m/s). */
  v: number;
  /** Acceleration last step (m/s²) and jerk (m/s³), used for comfort scoring. */
  accel: number;
  jerk: number;
  brakes: BrakeState;
  tractionN: number;
  brakeN: number;
  wheelSlip: boolean;
}

export function initialTrain(s: number): TrainState {
  return {
    s,
    v: 0,
    accel: 0,
    jerk: 0,
    brakes: initialBrakes(),
    tractionN: 0,
    brakeN: 0,
    wheelSlip: false,
  };
}

/**
 * Advance the train one fixed step (semi-implicit Euler). Active forces (traction, gravity)
 * may reverse the train; dissipative forces (resistance, brakes) can stop it but never
 * reverse it. Mutates `st` in place (no allocation).
 */
export function stepTrain(
  st: TrainState,
  c: Consist,
  ctl: Controls,
  track: Track,
  dt: number,
  env: PhysicsEnv = DRY_ENV,
): void {
  stepBrakes(st.brakes, c.rake, c.lengthM, ctl.autoBrake, ctl.indepBrake, ctl.emergency, dt);

  const demand = ctl.emergency || ctl.reverser === 0 ? 0 : tractiveEffortDemand(c, ctl.notch, st.v);
  const rail = railTractiveEffort(c, demand, c.loco.adhesionDry * env.adhesionFactor);
  st.wheelSlip = rail.slip;
  st.tractionN = rail.te * ctl.reverser;

  const trainBrake =
    c.massKg * G * c.rake.brakeForceRatio * env.brakeFactor * (st.brakes.bc / c.rake.bcMax);
  const locoBrake = c.locoMassKg * G * c.loco.independentBrakeRatio * st.brakes.indep;
  st.brakeN = trainBrake + locoBrake;

  // Grade/curve sampled at the train's mid-point.
  const mid = st.s - c.lengthM / 2;
  const drive = st.tractionN + gradeForce(c, track.gradeAt(mid));
  const dissipative = runningResistance(c, st.v, track.radiusAt(mid)) + st.brakeN;
  const m = c.effectiveMassKg;

  let vNew: number;
  if (Math.abs(st.v) <= STANDSTILL_MS) {
    // Held unless the active force beats static resistance + brakes (no creep).
    if (Math.abs(drive) <= dissipative) vNew = 0;
    else vNew = st.v + ((drive - Math.sign(drive) * dissipative) / m) * dt;
  } else {
    const vDrive = st.v + (drive / m) * dt;
    const dvDiss = Math.min((dissipative / m) * dt, Math.abs(vDrive));
    vNew = vDrive - Math.sign(vDrive) * dvDiss;
  }

  const accel = (vNew - st.v) / dt;
  st.jerk = (accel - st.accel) / dt;
  st.accel = accel;
  st.s += vNew * dt;
  st.v = vNew;
}
