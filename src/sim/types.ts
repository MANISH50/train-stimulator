// Plain data types shared by the simulation. SI units unless the name says otherwise.

export interface LocoParams {
  id: string;
  name: string;
  traction: 'electric' | 'diesel';
  massT: number;
  lengthM: number;
  powerKW: number;
  maxTractiveEffortKN: number;
  maxSpeedKmh: number;
  notches: number;
  /** Coefficient of adhesion on dry rail (approximate). */
  adhesionDry: number;
  /** Independent (loco-only) brake force as a fraction of loco weight at full application. */
  independentBrakeRatio: number;
  resistance: Davis;
  /** Extra effective mass from rotating parts, as a fraction of mass (e.g. 0.2). */
  rotatingMassFraction: number;
  /**
   * Gameplay pickup multiplier on tractive effort, power and adhesion (1 = researched
   * figures). Values above 1 make the train accelerate faster than the real loco would.
   */
  gameTractionBoost?: number;
}

/** Davis running-resistance coefficients in kg/t (IR convention), V in km/h: a + b*V + c*V². */
export interface Davis {
  a: number;
  b: number;
  c: number;
  /** Resistance at standstill in kg/t; blended in below 8 km/h. */
  starting: number;
}

export interface RakeParams {
  id: string;
  name: string;
  vehicles: number;
  vehicleMassT: number;
  vehicleLengthM: number;
  resistance: Davis;
  rotatingMassFraction: number;
  /** Train brake force as a fraction of total train weight at maximum brake-cylinder pressure. */
  brakeForceRatio: number;
  /** Maximum brake-cylinder pressure (kg/cm²): ~3.8 ICF/wagons, ~3.0 LHB. */
  bcMax: number;
  /** Brake-cylinder first-order time constants (s). */
  bcApplyTauS: number;
  bcReleaseTauS: number;
  /** Speed of a service brake-pipe signal along the train (m/s); emergency is ~4x faster in the model. */
  brakeSignalSpeedMps: number;
}

export type Aspect = 'RED' | 'YELLOW' | 'DOUBLE_YELLOW' | 'GREEN';

export interface SignalDef {
  id: string;
  label: string;
  kind: 'distant' | 'home' | 'starter' | 'advanced-starter' | 'intermediate-block' | 'automatic';
  chainageM: number;
  /** Aspect timeline in sim seconds; the last entry whose atS <= time applies. */
  timeline: { atS: number; aspect: Aspect }[];
}

export type TrackSegment =
  | { type: 'straight'; lengthM: number }
  | { type: 'curve'; lengthM: number; radiusM: number; turn: 'left' | 'right' };

export interface SpeedLimit {
  fromM: number;
  toM: number;
  kmh: number;
  kind: 'permanent' | 'temporary';
}

export interface Station {
  id: string;
  name: string;
  /** Name in a regional script (e.g. Devanagari) for station boards. */
  localName?: string;
  /** Chainage of the platform's stopping mark for the train front. */
  stopMarkM: number;
  platformLengthM: number;
}

export interface RouteDef {
  id: string;
  name: string;
  fictional: boolean;
  startChainageM: number;
  segments: TrackSegment[];
  /** Grade as rise/run, positive = uphill in the direction of increasing chainage. Applies from fromM until the next entry. */
  gradients: { fromM: number; grade: number }[];
  speedLimits: SpeedLimit[];
  stations: Station[];
  signals: SignalDef[];
}

export interface Controls {
  /** Reverser: 1 forward, 0 neutral, -1 reverse. */
  reverser: -1 | 0 | 1;
  /** Throttle notch, 0..loco.notches. */
  notch: number;
  /** Automatic (train) brake handle, 0 = release .. 1 = full service. */
  autoBrake: number;
  /** Independent (loco) brake handle, 0..1. */
  indepBrake: number;
  emergency: boolean;
}
