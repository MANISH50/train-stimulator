import { z } from 'zod';
import type { LocoParams, RakeParams, RouteDef } from '../sim/types';

const aspect = z.enum(['RED', 'YELLOW', 'DOUBLE_YELLOW', 'GREEN']);
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
  brakeSignalSpeedMps: z.number().min(10).max(400),
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
        timeline: z.array(z.object({ atS: z.number().min(0), aspect })).min(1),
      }),
    ),
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
      if (!sorted(sig.timeline.map((t) => t.atS)))
        ctx.addIssue({ code: 'custom', message: `signal ${sig.id} timeline not sorted` });
    }
    for (const st of r.stations) {
      if (st.stopMarkM > length)
        ctx.addIssue({ code: 'custom', message: `station ${st.id} beyond end of track` });
    }
  });

export function parseLoco(data: unknown): LocoParams {
  return LocoSchema.parse(data);
}
export function parseRake(data: unknown): RakeParams {
  return RakeSchema.parse(data);
}
export function parseRoute(data: unknown): RouteDef {
  return RouteSchema.parse(data);
}
