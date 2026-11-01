// All bundled game content, parsed and validated once. Add a JSON file here to add content.
import dClass from '../../content/locos/d-class.json';
import eClass from '../../content/locos/e-class.json';
import emuMotor from '../../content/locos/emu-motor.json';
import gClass from '../../content/locos/g-class.json';
import boxn58 from '../../content/rakes/boxn-58.json';
import coach12 from '../../content/rakes/coach-12.json';
import coach18 from '../../content/rakes/coach-18.json';
import emu11 from '../../content/rakes/emu-11.json';
import lhb22 from '../../content/rakes/lhb-22.json';
import goodsRoute from '../../content/routes/goods.json';
import intercityRoute from '../../content/routes/intercity.json';
import mailRoute from '../../content/routes/mail.json';
import suburbanRoute from '../../content/routes/suburban.json';
import testRoute from '../../content/routes/test-section.json';
import goodsType from '../../content/trains/goods.json';
import mailType from '../../content/trains/mail-express.json';
import passengerType from '../../content/trains/passenger.json';
import emuType from '../../content/trains/suburban-emu.json';
import superfastType from '../../content/trains/superfast.json';
import goodsLevel from '../../content/levels/goods.json';
import intercityLevel from '../../content/levels/intercity.json';
import mailLevel from '../../content/levels/mail.json';
import suburbanLevel from '../../content/levels/suburban.json';
import trainingLevel from '../../content/levels/training.json';
import type { SimSetup } from '../sim/sim';
import type {
  LevelDef,
  LocoParams,
  RakeParams,
  RouteDef,
  TrainType,
  WeatherId,
} from '../sim/types';
import { parseLevel, parseLoco, parseRake, parseRoute, parseTrainType } from './schema';

const byId = <T extends { id: string }>(items: T[]): Map<string, T> =>
  new Map(items.map((i) => [i.id, i]));

export const LOCOS = byId<LocoParams>([eClass, gClass, dClass, emuMotor].map(parseLoco));
export const RAKES = byId<RakeParams>([coach12, coach18, lhb22, emu11, boxn58].map(parseRake));
export const ROUTES = byId<RouteDef>(
  [testRoute, intercityRoute, suburbanRoute, mailRoute, goodsRoute].map(parseRoute),
);
export const TRAIN_TYPES = byId<TrainType>(
  [superfastType, mailType, passengerType, emuType, goodsType].map(parseTrainType),
);
export const LEVELS: LevelDef[] = [
  trainingLevel,
  intercityLevel,
  suburbanLevel,
  mailLevel,
  goodsLevel,
]
  .map(parseLevel)
  .sort((a, b) => a.order - b.order);

function need<T>(map: Map<string, T>, id: string, what: string): T {
  const v = map.get(id);
  if (!v) throw new Error(`Unknown ${what} "${id}"`);
  return v;
}

export function trainType(id: string): TrainType {
  return need(TRAIN_TYPES, id, 'train type');
}

/** Everything the sim needs to run a level in the given weather. */
export function levelSetup(level: LevelDef, weather: WeatherId, accidents = false): SimSetup {
  const pt = trainType(level.player.trainTypeId);
  return {
    route: need(ROUTES, level.routeId, 'route'),
    loco: need(LOCOS, pt.locoId, 'loco'),
    rake: need(RAKES, pt.rakeId, 'rake'),
    startS: level.player.startS,
    playerType: pt,
    playerStops: level.player.stops,
    weather,
    accidents,
    seed: level.id,
    traffic: level.traffic.map((t) => {
      const type = trainType(t.trainTypeId);
      return {
        id: t.id,
        type,
        loco: need(LOCOS, type.locoId, 'loco'),
        rake: need(RAKES, type.rakeId, 'rake'),
        dir: t.dir,
        spawnAtS: t.spawnAtS,
        spawnS: t.spawnS,
        stops: t.stops,
      };
    }),
  };
}

export function levelById(id: string): LevelDef {
  return LEVELS.find((l) => l.id === id) ?? LEVELS[0]!;
}
