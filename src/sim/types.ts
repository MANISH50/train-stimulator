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
  /** Body style for rendering. */
  style?: 'coach' | 'emu' | 'wagon';
  /** Speed of a service brake-pipe signal along the train (m/s); emergency is ~4x faster in the model. */
  brakeSignalSpeedMps: number;
}

export type Aspect = 'RED' | 'YELLOW' | 'DOUBLE_YELLOW' | 'GREEN';

/** Direction of travel along the chainage: 1 = increasing (UP), -1 = decreasing (DN). */
export type Dir = 1 | -1;

export type SignalKind =
  'distant' | 'home' | 'starter' | 'advanced-starter' | 'intermediate-block' | 'automatic';

export interface SignalDef {
  id: string;
  label: string;
  kind: SignalKind;
  chainageM: number;
  /** Line the signal stands beside (default "UP") and the direction it faces (default 1). */
  line?: string;
  dir?: Dir;
  /** Station this home/starter signal belongs to (worked by the dispatcher). */
  stationId?: string;
  /** Scripted "line not clear": keep this signal at danger until this sim time (s). */
  holdUntilS?: number;
  /**
   * Scripted aspect timeline in sim seconds; the last entry whose atS <= time applies.
   * When absent the signal is worked by the interlocking (block occupancy and routes).
   */
  timeline?: { atS: number; aspect: Aspect }[];
}

/**
 * A running line. All lines share the route's chainage; a line differs only by its lateral
 * offset from the alignment (+ = right of increasing chainage), smoothly interpolated
 * between keyframes. Loops diverge from and rejoin a main line through these offsets.
 */
export interface LineDef {
  id: string;
  name: string;
  fromM: number;
  toM: number;
  offsets: { atM: number; offsetM: number }[];
  /** Line speed limit, e.g. a station loop. */
  speedLimitKmh?: number;
}

/** A station loop: trains routed into it leave `mainLineId` at fromM and rejoin at toM. */
export interface LoopDef {
  stationId: string;
  lineId: string;
  mainLineId: string;
  dir: Dir;
  fromM: number;
  toM: number;
}

export type WeatherId = 'clear' | 'haze' | 'rain' | 'fog' | 'night';

export type TrainClass = 'superfast' | 'express' | 'passenger' | 'suburban' | 'goods';

export interface Livery {
  body: string;
  stripe: string;
  roof: string;
}

/** A train type: loco + rake + operating character (priority, AI driving, looks). */
export interface TrainType {
  id: string;
  name: string;
  class: TrainClass;
  /** Higher runs first: superfast > express > passenger/suburban > goods. */
  priority: number;
  speciality: string;
  locoId: string;
  rakeId: string;
  /** AI driver: gentle acceleration and service deceleration (m/s²). */
  aiAccelMs2: number;
  aiDecelMs2: number;
  /** Default dwell at stops (s). */
  dwellS: number;
  livery: Livery;
  locoLivery: Livery;
}

export interface StopSpec {
  stationId: string;
  /** Timetabled arrival, seconds after the level starts. */
  dueS?: number;
  dwellS?: number;
}

export interface TrafficSpec {
  id: string;
  trainTypeId: string;
  dir: Dir;
  /** Sim time at which the train enters, and the chainage of its front when it does. */
  spawnAtS: number;
  spawnS: number;
  stops: StopSpec[];
}

export interface LevelDef {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  detail: string;
  routeId: string;
  player: { trainTypeId: string; startS: number; stops: StopSpec[] };
  traffic: TrafficSpec[];
  defaultWeather: WeatherId;
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
  /** Chainage of the platform's stopping mark for the front of an UP train. */
  stopMarkM: number;
  platformLengthM: number;
  /** Platform slabs as lateral centre offset + width; defaults to one platform left of UP. */
  platforms?: { offsetM: number; widthM: number }[];
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
  /** Running lines; defaults to a single "UP" line on the alignment. */
  lines?: LineDef[];
  loops?: LoopDef[];
  /** Buffer stop face on every line, for a route ending at a dead-end terminus (m). */
  bufferStopM?: number;
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
