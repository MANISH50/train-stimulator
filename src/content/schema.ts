import { z } from 'zod';
import type { LevelDef, LocoParams, RakeParams, RouteDef, TrainType } from '../sim/types';
import type { ZoneDef } from '../sim/world/zones';

const aspect = z.enum(['RED', 'YELLOW', 'DOUBLE_YELLOW', 'GREEN']);
const dirSchema = z.union([z.literal(1), z.literal(-1)]);
const positive = z.number().positive();
const davis = z.object({
  a: z.number().min(0),
  b: z.number().min(0),
  c: z.number().min(0),
  starting: z.number().min(0),
});

/** Optional provenance note kept in content files; ignored by the sim. */
const source = z.object({ source: z.string().optional(), note: z.string().optional() });

export const LocoSchema = source.extend({
  id: z.string().min(1),
  name: z.string().min(1),
  traction: z.enum(['electric', 'diesel']),
  massT: positive,
  lengthM: positive,
  powerKW: positive,
  maxTractiveEffortKN: positive,
  maxSpeedKmh: positive,
  notches: z.number().int().min(1).max(32),
  adhesionDry: z.number().min(0.05).max(0.5),
  independentBrakeRatio: z.number().min(0).max(0.5),
  resistance: davis,
  rotatingMassFraction: z.number().min(0).max(0.5),
  gameTractionBoost: z.number().min(1).max(2).optional(),
});

export const RakeSchema = source.extend({
  id: z.string().min(1),
  name: z.string().min(1),
  vehicles: z.number().int().min(1).max(100),
  vehicleMassT: positive,
  vehicleLengthM: positive,
  resistance: davis,
  rotatingMassFraction: z.number().min(0).max(0.5),
  brakeForceRatio: z.number().min(0.01).max(0.3),
  bcMax: z.number().min(1).max(6),
  bcApplyTauS: positive,
  bcReleaseTauS: positive,
  style: z.enum(['coach', 'emu', 'wagon']).optional(),
  brakeSignalSpeedMps: z.number().min(10).max(400),
});

const hexColour = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const ZoneSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  biome: z.enum([
    'city',
    'suburb',
    'industrial',
    'farmland',
    'forest',
    'plantation',
    'river',
    'ghat',
    'hill-station',
    'desert',
    'wetland',
    'mining',
  ]),
  relief: z.object({ heightM: z.number(), atM: positive, roughnessM: z.number().min(0) }),
  vegetation: z.object({
    kinds: z.array(z.enum(['broadleaf', 'palm', 'bamboo', 'conifer', 'shrub', 'crop'])),
    perKm: z.number().min(0),
    crop: hexColour.optional(),
  }),
  buildings: z.object({
    style: z.enum(['highrise', 'slum', 'village', 'industrial', 'hill', 'none']),
    perKm: z.number().min(0),
  }),
  grade: z.object({ ground: hexColour, foliage: hexColour, fog: hexColour }),
  ambient: z.enum(['city', 'farm', 'forest', 'river', 'hills']),
  population: z.number().min(0).max(1),
  hazards: z.array(z.string()),
});

export const ZonesFileSchema = z.object({ zones: z.array(ZoneSchema).min(1) });

const sceneScript = z.object({
  zones: z
    .array(z.object({ zoneId: z.string(), fromM: z.number().min(0), toM: z.number().min(0) }))
    .min(1),
  landmarks: z.array(
    z.object({
      kind: z.enum(['river-bridge', 'tunnel', 'viaduct', 'level-crossing']),
      fromM: z.number().min(0),
      toM: z.number().min(0),
      name: z.string().optional(),
    }),
  ),
  blendM: positive.optional(),
});

const segment = z.discriminatedUnion('type', [
  z.object({ type: z.literal('straight'), lengthM: positive }),
  z.object({
    type: z.literal('curve'),
    lengthM: positive,
    radiusM: z.number().min(100),
    turn: z.enum(['left', 'right']),
  }),
]);

export const RouteSchema = source
  .extend({
    id: z.string().min(1),
    name: z.string().min(1),
    fictional: z.boolean(),
    startChainageM: z.number().min(0),
    segments: z.array(segment).min(1),
    gradients: z.array(
      z.object({ fromM: z.number().min(0), grade: z.number().min(-0.05).max(0.05) }),
    ),
    speedLimits: z.array(
      z.object({
        fromM: z.number().min(0),
        toM: z.number().min(0),
        kmh: positive,
        kind: z.enum(['permanent', 'temporary']),
      }),
    ),
    stations: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        localName: z.string().optional(),
        stopMarkM: z.number(),
        platformLengthM: positive,
        platforms: z.array(z.object({ offsetM: z.number(), widthM: positive })).optional(),
        mainPlatform: z.number().int().min(1).optional(),
        crowd: z
          .object({
            size: z.enum(['halt', 'town', 'junction', 'terminus']),
            rush: positive.optional(),
          })
          .optional(),
      }),
    ),
    signals: z.array(
      z.object({
        id: z.string(),
        label: z.string(),
        kind: z.enum([
          'distant',
          'home',
          'starter',
          'advanced-starter',
          'intermediate-block',
          'automatic',
        ]),
        chainageM: z.number().min(0),
        line: z.string().optional(),
        dir: dirSchema.optional(),
        stationId: z.string().optional(),
        holdUntilS: z.number().min(0).optional(),
        timeline: z
          .array(z.object({ atS: z.number().min(0), aspect }))
          .min(1)
          .optional(),
      }),
    ),
    lines: z
      .array(
        z.object({
          id: z.string().min(1),
          name: z.string(),
          fromM: z.number().min(0),
          toM: z.number().min(0),
          offsets: z.array(z.object({ atM: z.number(), offsetM: z.number() })).min(1),
          speedLimitKmh: positive.optional(),
        }),
      )
      .optional(),
    bufferStopM: z.number().min(0).optional(),
    scene: sceneScript.optional(),
    inspiredBy: z.string().optional(),
    loops: z
      .array(
        z.object({
          stationId: z.string(),
          lineId: z.string(),
          mainLineId: z.string(),
          dir: dirSchema,
          fromM: z.number().min(0),
          toM: z.number().min(0),
          platform: z.number().int().min(1).optional(),
        }),
      )
      .optional(),
  })
  .superRefine((r, ctx) => {
    const length = r.segments.reduce((sum, s) => sum + s.lengthM, 0);
    const sorted = (xs: number[]) => xs.every((x, i) => i === 0 || x >= xs[i - 1]!);
    if (!sorted(r.gradients.map((g) => g.fromM)))
      ctx.addIssue({ code: 'custom', message: 'gradients must be sorted by fromM' });
    for (const lim of r.speedLimits) {
      if (lim.toM <= lim.fromM)
        ctx.addIssue({ code: 'custom', message: `speed limit ${lim.fromM}-${lim.toM} is empty` });
    }
    for (const sig of r.signals) {
      if (sig.chainageM > length)
        ctx.addIssue({ code: 'custom', message: `signal ${sig.id} beyond end of track` });
      if (sig.timeline && !sorted(sig.timeline.map((t) => t.atS)))
        ctx.addIssue({ code: 'custom', message: `signal ${sig.id} timeline not sorted` });
    }
    for (const st of r.stations) {
      if (st.stopMarkM > length)
        ctx.addIssue({ code: 'custom', message: `station ${st.id} beyond end of track` });
    }
    const lineIds = new Set((r.lines ?? [{ id: 'UP' }]).map((l) => l.id));
    const stationIds = new Set(r.stations.map((st) => st.id));
    for (const sig of r.signals) {
      if (!lineIds.has(sig.line ?? 'UP'))
        ctx.addIssue({
          code: 'custom',
          message: `signal ${sig.id} is on unknown line ${sig.line}`,
        });
      if (sig.stationId && !stationIds.has(sig.stationId))
        ctx.addIssue({
          code: 'custom',
          message: `signal ${sig.id} has unknown station ${sig.stationId}`,
        });
    }
    if (r.scene) {
      const zs = r.scene.zones;
      zs.forEach((z, i) => {
        if (z.toM <= z.fromM)
          ctx.addIssue({ code: 'custom', message: `scene zone ${z.zoneId} is empty` });
        if (i > 0 && z.fromM !== zs[i - 1]!.toM)
          ctx.addIssue({ code: 'custom', message: `scene zone ${z.zoneId} does not follow on` });
      });
      if (zs[0]!.fromM > 0 || zs[zs.length - 1]!.toM < length)
        ctx.addIssue({ code: 'custom', message: 'scene zones must cover the whole route' });
    }
    for (const l of r.loops ?? []) {
      if (!lineIds.has(l.lineId) || !lineIds.has(l.mainLineId))
        ctx.addIssue({ code: 'custom', message: `loop at ${l.stationId} uses an unknown line` });
      if (!stationIds.has(l.stationId))
        ctx.addIssue({ code: 'custom', message: `loop has unknown station ${l.stationId}` });
      if (l.toM <= l.fromM)
        ctx.addIssue({ code: 'custom', message: `loop at ${l.stationId} is empty` });
    }
  });

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const livery = z.object({ body: hex, stripe: hex, roof: hex });
const stopSpec = z.object({
  stationId: z.string(),
  dueS: z.number().min(0).optional(),
  dwellS: z.number().min(0).optional(),
  platform: z.number().int().min(1).optional(),
});

export const TrainTypeSchema = source.extend({
  id: z.string().min(1),
  name: z.string().min(1),
  class: z.enum(['superfast', 'express', 'passenger', 'suburban', 'goods']),
  priority: z.number().int().min(0).max(10),
  speciality: z.string(),
  locoId: z.string(),
  rakeId: z.string(),
  aiAccelMs2: z.number().min(0.05).max(2),
  aiDecelMs2: z.number().min(0.05).max(2),
  dwellS: z.number().min(0),
  livery,
  locoLivery: livery,
});

export const LevelSchema = source.extend({
  id: z.string().min(1),
  order: z.number().int(),
  title: z.string(),
  subtitle: z.string(),
  detail: z.string(),
  routeId: z.string(),
  player: z.object({
    trainTypeId: z.string(),
    startS: z.number().min(0),
    stops: z.array(stopSpec),
  }),
  traffic: z.array(
    z.object({
      id: z.string(),
      trainTypeId: z.string(),
      dir: dirSchema,
      spawnAtS: z.number().min(0),
      spawnS: z.number().min(0),
      stops: z.array(stopSpec),
    }),
  ),
  incidents: z
    .array(
      z.object({
        kind: z.literal('acp'),
        stationId: z.string(),
        afterDepartM: positive,
      }),
    )
    .optional(),
  defaultWeather: z.enum(['clear', 'haze', 'rain', 'fog', 'night']),
});

export const FactsFileSchema = z.object({
  facts: z.array(
    z.object({
      id: z.string(),
      /** Zone biome, landmark kind or incident kind that shows this fact. */
      trigger: z.string(),
      text: z.string().min(10),
      source: z.string().url(),
    }),
  ),
});

export function parseZones(data: unknown): ZoneDef[] {
  return ZonesFileSchema.parse(data).zones;
}
export function parseLoco(data: unknown): LocoParams {
  return LocoSchema.parse(data);
}
export function parseRake(data: unknown): RakeParams {
  return RakeSchema.parse(data);
}
export function parseRoute(data: unknown): RouteDef {
  return RouteSchema.parse(data);
}
export function parseTrainType(data: unknown): TrainType {
  return TrainTypeSchema.parse(data);
}
export function parseLevel(data: unknown): LevelDef {
  return LevelSchema.parse(data);
}
