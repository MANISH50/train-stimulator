// Scene zones: the landscape a route passes through, as data. A route's scene script is an
// ordered list of zones along the chainage; neighbouring zones blend over a transition band
// so terrain, vegetation, buildings, colour grading and ambient sound change gradually.
// Pure data maths (no Three.js) so it is shared by rendering, audio, HUD and tests.

export type Biome =
  | 'city'
  | 'suburb'
  | 'industrial'
  | 'farmland'
  | 'forest'
  | 'plantation'
  | 'river'
  | 'ghat'
  | 'hill-station'
  | 'desert'
  | 'wetland'
  | 'mining';

export type VegetationKind = 'broadleaf' | 'palm' | 'bamboo' | 'conifer' | 'shrub' | 'crop';
export type BuildingStyle = 'highrise' | 'slum' | 'village' | 'industrial' | 'hill' | 'none';
export type AmbientSet = 'city' | 'farm' | 'forest' | 'river' | 'hills';

export interface ZoneDef {
  id: string;
  name: string;
  biome: Biome;
  /** Terrain beside the line: height of the land at `atM` from the track (m, + up). */
  relief: { heightM: number; atM: number; roughnessM: number };
  vegetation: { kinds: VegetationKind[]; perKm: number; crop?: string };
  buildings: { style: BuildingStyle; perKm: number };
  /** Colour grading: ground tint, foliage tint and fog/haze colour (#rrggbb). */
  grade: { ground: string; foliage: string; fog: string };
  ambient: AmbientSet;
  /** 0..1 lineside population (people, level-crossing traffic). */
  population: number;
  hazards: string[];
}

export type LandmarkKind = 'river-bridge' | 'tunnel' | 'viaduct' | 'level-crossing';

export interface Landmark {
  kind: LandmarkKind;
  fromM: number;
  toM: number;
  name?: string;
}

export interface SceneEntry {
  zoneId: string;
  fromM: number;
  toM: number;
}

export interface SceneScript {
  zones: SceneEntry[];
  landmarks: Landmark[];
  /** Width of the blend band at each zone boundary (m). */
  blendM?: number;
}

export const DEFAULT_BLEND_M = 400;

export interface ZoneWeight {
  zoneId: string;
  w: number;
}

function ramp(s: number, a: number, b: number): number {
  if (s <= a) return 0;
  if (s >= b) return 1;
  const t = (s - a) / (b - a);
  return t * t * (3 - 2 * t);
}

/**
 * Blend weights of every zone at chainage s; they sum to 1. Adjacent zones crossfade with a
 * smoothstep over the blend band centred on their shared boundary.
 */
export function zoneWeightsAt(
  script: SceneScript,
  s: number,
  out: ZoneWeight[] = [],
): ZoneWeight[] {
  out.length = 0;
  const zones = script.zones;
  if (!zones.length) return out;
  const h = (script.blendM ?? DEFAULT_BLEND_M) / 2;
  let sum = 0;
  zones.forEach((z, i) => {
    const up = i === 0 ? 1 : ramp(s, z.fromM - h, z.fromM + h);
    const down = i === zones.length - 1 ? 1 : 1 - ramp(s, z.toM - h, z.toM + h);
    const w = up * down;
    if (w > 1e-4) {
      out.push({ zoneId: z.zoneId, w });
      sum += w;
    }
  });
  for (const e of out) e.w /= sum;
  return out;
}

/** The zone with the largest weight at s (for the HUD and journey log). No allocation. */
export function dominantZone(script: SceneScript, s: number): string | undefined {
  const zones = script.zones;
  const h = (script.blendM ?? DEFAULT_BLEND_M) / 2;
  let best: string | undefined;
  let bestW = -1;
  for (let i = 0; i < zones.length; i++) {
    const z = zones[i]!;
    const up = i === 0 ? 1 : ramp(s, z.fromM - h, z.fromM + h);
    const down = i === zones.length - 1 ? 1 : 1 - ramp(s, z.toM - h, z.toM + h);
    if (up * down > bestW) {
      bestW = up * down;
      best = z.zoneId;
    }
  }
  return best;
}

/** Landmark the chainage is inside, if any. */
export function landmarkAt(script: SceneScript, s: number): Landmark | undefined {
  return script.landmarks.find((l) => s >= l.fromM && s <= l.toM);
}

/** Blend a numeric zone property at s. */
export function blendAt(
  script: SceneScript,
  zones: ReadonlyMap<string, ZoneDef>,
  s: number,
  pick: (z: ZoneDef) => number,
): number {
  let v = 0;
  for (const e of zoneWeightsAt(script, s)) {
    const z = zones.get(e.zoneId);
    if (z) v += pick(z) * e.w;
  }
  return v;
}
