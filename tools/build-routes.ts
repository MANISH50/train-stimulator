// Generates content/routes/*.json from compact route descriptions, laying out a double line
// (UP/DN), optional station loops, island platforms and a consistent signal plan per station:
// Distant -> Home -> Starter (main and loop) -> Advanced Starter, plus automatic signals
// between stations on both lines. Run: npx tsx tools/build-routes.ts
import { writeFileSync } from 'node:fs';
import type {
  LineDef,
  LoopDef,
  RouteDef,
  SignalDef,
  SpeedLimit,
  Station,
  TrackSegment,
} from '../src/sim/types';

const UP = -2.65;
const DN = 2.65;
const LOOP = -9.0;
const PLATFORM_M = 500;

interface StationSpec {
  id: string;
  name: string;
  localName: string;
  stopMarkM: number;
  loop?: boolean;
  /** Scripted "line not clear" hold on the home signal until this sim time (s). */
  homeHoldUntilS?: number;
}

interface RouteSpec {
  id: string;
  name: string;
  note: string;
  segments: TrackSegment[];
  gradients: { fromM: number; grade: number }[];
  lineSpeedKmh: number;
  tsr?: { fromM: number; toM: number; kmh: number }[];
  stations: StationSpec[];
  autoSpacingM: number;
  /** Distances of distant/home before, and advanced starter after, the stop mark (m). */
  distantM?: number;
  homeM?: number;
  advancedM?: number;
}

function build(spec: RouteSpec): RouteDef & { note: string } {
  const length = spec.segments.reduce((s, x) => s + x.lengthM, 0);
  const lines: LineDef[] = [
    { id: 'UP', name: 'Up main', fromM: 0, toM: length, offsets: [{ atM: 0, offsetM: UP }] },
    { id: 'DN', name: 'Down main', fromM: 0, toM: length, offsets: [{ atM: 0, offsetM: DN }] },
  ];
  const loops: LoopDef[] = [];
  const stations: Station[] = [];
  const signals: SignalDef[] = [];
  const reserved: [number, number][] = [];
  const distantM = spec.distantM ?? 2000;
  const homeM = spec.homeM ?? 800;
  const advancedM = spec.advancedM ?? 600;

  for (const st of spec.stations) {
    const x = st.stopMarkM;
    const code = st.id;
    const platforms = st.loop
      ? [
          { offsetM: -5.8, widthM: 2.9 },
          { offsetM: 6.0, widthM: 3.5 },
        ]
      : [
          { offsetM: -6.6, widthM: 4.5 },
          { offsetM: 6.0, widthM: 3.5 },
        ];
    stations.push({
      id: st.id,
      name: st.name,
      localName: st.localName,
      stopMarkM: x,
      platformLengthM: PLATFORM_M,
      platforms,
    });
    if (st.loop) {
      const loopId = `LOOP-${code}`;
      lines.push({
        id: loopId,
        name: `${st.name} loop`,
        fromM: x - 650,
        toM: x + 200,
        offsets: [
          { atM: x - 650, offsetM: UP },
          { atM: x - 530, offsetM: LOOP },
          { atM: x + 80, offsetM: LOOP },
          { atM: x + 200, offsetM: UP },
        ],
        speedLimitKmh: 30,
      });
      loops.push({
        stationId: st.id,
        lineId: loopId,
        mainLineId: 'UP',
        dir: 1,
        fromM: x - 650,
        toM: x + 200,
      });
      signals.push({
        id: `${code}-LS`,
        label: `Loop Starter ${code}`,
        kind: 'starter',
        chainageM: x + 50,
        line: loopId,
        stationId: st.id,
      });
    }
    signals.push(
      { id: `${code}-D`, label: `Distant ${code}`, kind: 'distant', chainageM: x - distantM },
      {
        id: `${code}-H`,
        label: `Home ${code}`,
        kind: 'home',
        chainageM: x - homeM,
        stationId: st.id,
        ...(st.homeHoldUntilS ? { holdUntilS: st.homeHoldUntilS } : {}),
      },
      {
        id: `${code}-S`,
        label: `Starter ${code}`,
        kind: 'starter',
        chainageM: x + 50,
        stationId: st.id,
      },
      {
        id: `${code}-AS`,
        label: `Advanced Starter ${code}`,
        kind: 'advanced-starter',
        chainageM: x + advancedM,
      },
    );
    reserved.push([x - distantM - 400, x + advancedM + 400]);
  }

  // Automatic signals on the UP line outside station areas.
  let n = 1;
  for (let s = 900; s < length - 300; s += spec.autoSpacingM) {
    if (reserved.some(([a, b]) => s > a && s < b)) continue;
    signals.push({ id: `A${n}`, label: `Automatic A${n}`, kind: 'automatic', chainageM: s });
    n++;
  }
  // Automatic signals on the DN line (DN trains run through without stopping).
  n = 1;
  for (let s = length - 900; s > 300; s -= spec.autoSpacingM) {
    signals.push({
      id: `DA${n}`,
      label: `Automatic DA${n}`,
      kind: 'automatic',
      chainageM: s,
      line: 'DN',
      dir: -1,
    });
    n++;
  }
  signals.sort((a, b) => a.chainageM - b.chainageM);

  const speedLimits: SpeedLimit[] = [
    { fromM: 0, toM: length, kmh: spec.lineSpeedKmh, kind: 'permanent' },
    ...(spec.tsr ?? []).map((t) => ({ ...t, kind: 'temporary' as const })),
  ];
  return {
    id: spec.id,
    name: spec.name,
    note: spec.note,
    fictional: true,
    startChainageM: 0,
    segments: spec.segments,
    gradients: spec.gradients,
    speedLimits,
    stations,
    signals,
    lines,
    loops,
  };
}

const straight = (lengthM: number): TrackSegment => ({ type: 'straight', lengthM });
const curve = (lengthM: number, radiusM: number, turn: 'left' | 'right'): TrackSegment => ({
  type: 'curve',
  lengthM,
  radiusM,
  turn,
});

const ROUTES: RouteSpec[] = [
  {
    id: 'test-section',
    name: 'Training Ground test section',
    note: 'Original fictional training section, double line, ~6 km.',
    segments: [
      straight(1200),
      curve(600, 1000, 'left'),
      straight(1000),
      curve(400, 1500, 'right'),
      straight(2800),
    ],
    gradients: [
      { fromM: 0, grade: 0 },
      { fromM: 1400, grade: 0.005 },
      { fromM: 2400, grade: 0 },
      { fromM: 3000, grade: -0.004 },
      { fromM: 3500, grade: 0 },
    ],
    lineSpeedKmh: 110,
    tsr: [{ fromM: 1500, toM: 1900, kmh: 50 }],
    stations: [
      {
        id: 'PRS',
        name: 'Prashikshan Nagar',
        localName: 'प्रशिक्षण नगर',
        stopMarkM: 3900,
        homeHoldUntilS: 150,
      },
    ],
    autoSpacingM: 1300,
  },
  {
    id: 'intercity',
    name: 'Intercity corridor',
    note: 'Original fictional 15 km double line with two loop stations.',
    segments: [
      straight(3000),
      curve(1200, 2000, 'right'),
      straight(3800),
      curve(1000, 1800, 'left'),
      straight(6000),
    ],
    gradients: [
      { fromM: 0, grade: 0 },
      { fromM: 7600, grade: 0.003 },
      { fromM: 9600, grade: 0 },
    ],
    lineSpeedKmh: 130,
    stations: [
      { id: 'RMP', name: 'Rampur', localName: 'रामपुर', stopMarkM: 5200, loop: true },
      { id: 'DVG', name: 'Devgarh', localName: 'देवगढ़', stopMarkM: 12000, loop: true },
    ],
    autoSpacingM: 1500,
  },
  {
    id: 'suburban',
    name: 'Suburban line',
    note: 'Original fictional 7.5 km suburban double line, four stations ~1.5 km apart.',
    segments: [
      straight(2000),
      curve(700, 900, 'left'),
      straight(1800),
      curve(600, 1100, 'right'),
      straight(2400),
    ],
    gradients: [{ fromM: 0, grade: 0 }],
    lineSpeedKmh: 100,
    distantM: 800,
    homeM: 520,
    advancedM: 450,
    stations: [
      { id: 'NGR', name: 'Nagar Road', localName: 'नगर रोड', stopMarkM: 1500 },
      { id: 'KLN', name: 'Kalina', localName: 'कलीना', stopMarkM: 3000 },
      { id: 'BGH', name: 'Bagh', localName: 'बाग', stopMarkM: 4500 },
      { id: 'SGM', name: 'Sangam', localName: 'संगम', stopMarkM: 6000 },
    ],
    autoSpacingM: 700,
  },
  {
    id: 'mail',
    name: 'Mail line',
    note: 'Original fictional 10 km double line; loop at Sitapur Junction for overtakes.',
    segments: [
      straight(2500),
      curve(900, 1600, 'left'),
      straight(2600),
      curve(800, 1400, 'right'),
      straight(3200),
    ],
    gradients: [
      { fromM: 0, grade: 0 },
      { fromM: 3000, grade: -0.003 },
      { fromM: 4400, grade: 0 },
    ],
    lineSpeedKmh: 110,
    stations: [
      { id: 'KPR', name: 'Kalyanpur', localName: 'कल्याणपुर', stopMarkM: 3200 },
      {
        id: 'STP',
        name: 'Sitapur Junction',
        localName: 'सीतापुर जंक्शन',
        stopMarkM: 7000,
        loop: true,
      },
    ],
    autoSpacingM: 1300,
  },
  {
    id: 'goods',
    name: 'Ghat goods line',
    note: 'Original fictional 10 km goods line with a 1 in 150 rise and fall and a crossing loop.',
    segments: [
      straight(2800),
      curve(1000, 1200, 'right'),
      straight(2200),
      curve(900, 1000, 'left'),
      straight(3100),
    ],
    gradients: [
      { fromM: 0, grade: 0 },
      { fromM: 1500, grade: 0.0067 },
      { fromM: 3800, grade: 0 },
      { fromM: 5800, grade: -0.0067 },
      { fromM: 7600, grade: 0 },
    ],
    lineSpeedKmh: 100,
    stations: [{ id: 'GHT', name: 'Ghatpur', localName: 'घाटपुर', stopMarkM: 5000, loop: true }],
    autoSpacingM: 1400,
  },
];

for (const spec of ROUTES) {
  const route = build(spec);
  writeFileSync(`content/routes/${spec.id}.json`, JSON.stringify(route, null, 2) + '\n');
  console.log(`wrote content/routes/${spec.id}.json (${route.signals.length} signals)`);
}
