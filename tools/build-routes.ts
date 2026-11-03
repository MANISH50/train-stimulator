// Generates content/routes/*.json from compact route descriptions, laying out a double line
// (UP/DN), optional station loops, island platforms and a consistent signal plan per station:
// Distant -> Home -> Starter (main and loop) -> Advanced Starter, plus automatic signals
// between stations on both lines. Run: npx tsx tools/build-routes.ts
import { writeFileSync } from 'node:fs';
import type { Landmark, SceneEntry } from '../src/sim/world/zones';
import type {
  CrowdProfile,
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
  /** Dead-end terminus: no starters; the line ends at a buffer stop beyond the platform. */
  terminus?: boolean;
  /** How busy it is (default: town). */
  crowd?: CrowdProfile;
  /** Per-station override of the home/distant distances (big junction approaches). */
  homeM?: number;
  distantM?: number;
  /**
   * Junction with numbered platform lines: each line leaves the UP main through a ladder of
   * crossovers (lateral offset keyframes relative to the stop mark) and rejoins beyond.
   */
  junction?: {
    mainPlatform: number;
    turnoutKmh: number;
    lines: { platform: number; keys: [number, number][] }[];
    platforms: { offsetM: number; widthM: number }[];
  };
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
  /** Distance from the loop points to the stop mark (m); long enough to clear the longest train. */
  loopApproachM?: number;
  /** Buffer stop face (m), for a route ending at a terminus. */
  bufferStopM?: number;
  /** Permanent speed restrictions (e.g. ghat sections, terminal approach). */
  psr?: { fromM: number; toM: number; kmh: number }[];
  scene: { zones: SceneEntry[]; landmarks: Landmark[] };
  inspiredBy?: string;
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
  const approach = spec.loopApproachM ?? 650;

  for (const st of spec.stations) {
    const x = st.stopMarkM;
    const code = st.id;
    const platforms = st.junction
      ? st.junction.platforms
      : st.loop
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
      crowd: st.crowd ?? { size: st.terminus ? 'terminus' : 'town' },
      ...(st.junction ? { mainPlatform: st.junction.mainPlatform } : {}),
    });
    for (const jl of st.junction?.lines ?? []) {
      const lineId = `PF${jl.platform}-${code}`;
      const fromM = x + jl.keys[0]![0];
      const toM = x + jl.keys[jl.keys.length - 1]![0];
      lines.push({
        id: lineId,
        name: `${st.name} platform ${jl.platform}`,
        fromM,
        toM,
        offsets: jl.keys.map(([rel, offsetM]) => ({ atM: x + rel, offsetM })),
        speedLimitKmh: st.junction!.turnoutKmh,
      });
      loops.push({
        stationId: st.id,
        lineId,
        mainLineId: 'UP',
        dir: 1,
        fromM,
        toM,
        platform: jl.platform,
      });
      signals.push({
        id: `${code}-S${jl.platform}`,
        label: `Starter P${jl.platform} ${code}`,
        kind: 'starter',
        chainageM: x + 50,
        line: lineId,
        stationId: st.id,
      });
    }
    if (st.loop) {
      const loopId = `LOOP-${code}`;
      lines.push({
        id: loopId,
        name: `${st.name} loop`,
        fromM: x - approach,
        toM: x + 200,
        offsets: [
          { atM: x - approach, offsetM: UP },
          { atM: x - approach + 120, offsetM: LOOP },
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
        fromM: x - approach,
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
      {
        id: `${code}-D`,
        label: `Distant ${code}`,
        kind: 'distant',
        chainageM: x - (st.distantM ?? distantM),
      },
      {
        id: `${code}-H`,
        label: `Home ${code}`,
        kind: 'home',
        chainageM: x - (st.homeM ?? homeM),
        stationId: st.id,
        ...(st.homeHoldUntilS ? { holdUntilS: st.homeHoldUntilS } : {}),
      },
    );
    if (!st.terminus) {
      signals.push(
        {
          id: `${code}-S`,
          label: st.junction ? `Starter P${st.junction.mainPlatform} ${code}` : `Starter ${code}`,
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
    }
    reserved.push([x - (st.distantM ?? distantM) - 400, x + advancedM + 400]);
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
    ...(spec.psr ?? []).map((t) => ({ ...t, kind: 'permanent' as const })),
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
    ...(spec.bufferStopM !== undefined ? { bufferStopM: spec.bufferStopM } : {}),
    scene: spec.scene,
    ...(spec.inspiredBy ? { inspiredBy: spec.inspiredBy } : {}),
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
    scene: {
      zones: [
        { zoneId: 'suburb', fromM: 0, toM: 1600 },
        { zoneId: 'farmland', fromM: 1600, toM: 6000 },
      ],
      landmarks: [],
    },
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
        homeHoldUntilS: 200,
      },
    ],
    autoSpacingM: 1300,
  },
  {
    id: 'intercity',
    scene: {
      zones: [
        { zoneId: 'city', fromM: 0, toM: 2000 },
        { zoneId: 'farmland', fromM: 2000, toM: 8000 },
        { zoneId: 'river', fromM: 8000, toM: 9200 },
        { zoneId: 'farmland', fromM: 9200, toM: 13500 },
        { zoneId: 'forest', fromM: 13500, toM: 15000 },
      ],
      landmarks: [{ kind: 'river-bridge', fromM: 8400, toM: 8800 }],
    },
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
    scene: {
      zones: [
        { zoneId: 'city', fromM: 0, toM: 1400 },
        { zoneId: 'suburb', fromM: 1400, toM: 2700 },
        { zoneId: 'industrial', fromM: 2700, toM: 3250 },
        { zoneId: 'river', fromM: 3250, toM: 4150 },
        { zoneId: 'city', fromM: 4150, toM: 6085 },
      ],
      landmarks: [{ kind: 'river-bridge', fromM: 3500, toM: 3700, name: 'Canal bridge' }],
    },
    name: 'Suburban line',
    note: 'Original fictional 6 km suburban double line, four stations ~1.5 km apart, ending at a terminus with buffer stops.',
    segments: [
      straight(2000),
      curve(700, 900, 'left'),
      straight(1800),
      curve(600, 1100, 'right'),
      straight(985),
    ],
    bufferStopM: 6070,
    gradients: [{ fromM: 0, grade: 0 }],
    lineSpeedKmh: 100,
    distantM: 800,
    homeM: 520,
    advancedM: 450,
    stations: [
      { id: 'NGR', name: 'Nagar Road', localName: 'नगर रोड', stopMarkM: 1500 },
      { id: 'KLN', name: 'Kalina', localName: 'कलीना', stopMarkM: 3000 },
      { id: 'BGH', name: 'Bagh', localName: 'बाग', stopMarkM: 4500 },
      {
        id: 'SGM',
        name: 'Sangam',
        localName: 'संगम',
        stopMarkM: 6000,
        terminus: true,
        crowd: { size: 'terminus', rush: 1.5 },
      },
    ],
    autoSpacingM: 700,
  },
  {
    id: 'mail',
    scene: {
      zones: [
        { zoneId: 'suburb', fromM: 0, toM: 1500 },
        { zoneId: 'farmland', fromM: 1500, toM: 4200 },
        { zoneId: 'river', fromM: 4200, toM: 5300 },
        { zoneId: 'forest', fromM: 5300, toM: 6400 },
        { zoneId: 'farmland', fromM: 6400, toM: 10000 },
      ],
      landmarks: [{ kind: 'river-bridge', fromM: 4500, toM: 4780, name: 'Sarju river' }],
    },
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
    scene: {
      zones: [
        { zoneId: 'industrial', fromM: 0, toM: 1800 },
        { zoneId: 'farmland', fromM: 1800, toM: 3200 },
        { zoneId: 'forest', fromM: 3200, toM: 7000 },
        { zoneId: 'mining', fromM: 7000, toM: 10000 },
      ],
      landmarks: [],
    },
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
    // A 58-wagon rake is ~640 m: the points sit far enough back for it to clear the main line.
    loopApproachM: 900,
    distantM: 2300,
    homeM: 1050,
    stations: [{ id: 'GHT', name: 'Ghatpur', localName: 'घाटपुर', stopMarkM: 5000, loop: true }],
    autoSpacingM: 1400,
  },
  {
    // Pilot route for the living world: a fictional ghat line "inspired by" Western Ghats
    // crossings (docs/research/05). Every name is fictional. Gradients and limits are
    // approximate game values, gentler than the steepest real ghats.
    id: 'ghat-express',
    name: 'Ghat line',
    note: 'Original fictional 24 km line: city junction, farmland, river bridge, forest, ghat with tunnels and a viaduct, hill-station terminus.',
    inspiredBy: 'Western Ghats ghat crossings',
    segments: [
      straight(3800),
      curve(800, 1200, 'left'),
      straight(3200),
      curve(600, 1500, 'right'),
      straight(3400),
      curve(700, 1000, 'left'),
      straight(2500),
      curve(900, 650, 'right'),
      straight(700),
      curve(1000, 600, 'left'),
      straight(800),
      curve(900, 650, 'right'),
      straight(1200),
      curve(800, 700, 'left'),
      straight(2415),
    ],
    gradients: [
      { fromM: 0, grade: 0 },
      { fromM: 14000, grade: 0.004 },
      { fromM: 15600, grade: 0.0167 },
      { fromM: 21600, grade: 0.004 },
      { fromM: 22600, grade: 0 },
    ],
    lineSpeedKmh: 100,
    psr: [
      { fromM: 15600, toM: 21800, kmh: 50 },
      { fromM: 22800, toM: 23715, kmh: 30 },
    ],
    bufferStopM: 23700,
    stations: [
      {
        id: 'NJN',
        name: 'Nagarpur Junction',
        localName: 'नगरपुर जंक्शन',
        stopMarkM: 2800,
        homeM: 1000,
        distantM: 2200,
        crowd: { size: 'junction', rush: 1.4 },
        junction: {
          mainPlatform: 3,
          turnoutKmh: 30,
          lines: [
            {
              platform: 1,
              keys: [
                [-900, UP],
                [-780, LOOP],
                [-660, -16],
                [150, -16],
                [270, LOOP],
                [390, UP],
              ],
            },
            {
              platform: 2,
              keys: [
                [-650, UP],
                [-530, LOOP],
                [80, LOOP],
                [200, UP],
              ],
            },
          ],
          platforms: [
            { offsetM: -19.6, widthM: 3.6 },
            { offsetM: -5.8, widthM: 2.9 },
            { offsetM: 6.0, widthM: 3.5 },
          ],
        },
      },
      {
        id: 'KHP',
        name: 'Khetpura',
        localName: 'खेतपुरा',
        stopMarkM: 8800,
        crowd: { size: 'halt' },
      },
      {
        id: 'MGH',
        name: 'Meghgarh',
        localName: 'मेघगढ़',
        stopMarkM: 23620,
        terminus: true,
        crowd: { size: 'terminus' },
      },
    ],
    autoSpacingM: 1500,
    scene: {
      zones: [
        { zoneId: 'city', fromM: 0, toM: 3600 },
        { zoneId: 'suburb', fromM: 3600, toM: 5200 },
        { zoneId: 'industrial', fromM: 5200, toM: 6400 },
        { zoneId: 'farmland', fromM: 6400, toM: 10800 },
        { zoneId: 'river', fromM: 10800, toM: 12400 },
        { zoneId: 'forest', fromM: 12400, toM: 15600 },
        { zoneId: 'ghat', fromM: 15600, toM: 21800 },
        { zoneId: 'hill-station', fromM: 21800, toM: 23715 },
      ],
      landmarks: [
        { kind: 'level-crossing', fromM: 7400, toM: 7412 },
        { kind: 'river-bridge', fromM: 11300, toM: 11800, name: 'Ratna river' },
        { kind: 'tunnel', fromM: 16900, toM: 17500, name: 'Tunnel 1' },
        { kind: 'viaduct', fromM: 18600, toM: 18900, name: 'Kalda viaduct' },
        { kind: 'tunnel', fromM: 19800, toM: 20700, name: 'Tunnel 2' },
      ],
    },
  },
];

for (const spec of ROUTES) {
  const route = build(spec);
  writeFileSync(`content/routes/${spec.id}.json`, JSON.stringify(route, null, 2) + '\n');
  console.log(`wrote content/routes/${spec.id}.json (${route.signals.length} signals)`);
}
