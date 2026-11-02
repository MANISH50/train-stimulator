import type { CrashKind } from './crash/crashSim';
import type { AcpDebrief, AcpNarration } from './station/acp';
import type { LandmarkKind } from './world/zones';
import type { Aspect } from './types';

export type SimEvent =
  | {
      type: 'SPAD';
      timeS: number;
      signalId: string;
      label: string;
      speedKmh: number;
      /** True when the run ends at once (accidents off); otherwise the train runs on. */
      fatal: boolean;
    }
  | { type: 'SPAD_STOPPED'; timeS: number; label: string; beyondM: number }
  | {
      type: 'COLLISION';
      timeS: number;
      kind: CrashKind;
      otherLabel?: string;
      speedKmh: number;
      closingKmh: number;
    }
  | {
      type: 'DERAILMENT';
      timeS: number;
      cause: 'points' | 'curve';
      speedKmh: number;
      limitKmh: number;
    }
  | { type: 'BUFFER_BUMP'; timeS: number; speedKmh: number }
  | { type: 'BUFFER_OVERRUN'; timeS: number; speedKmh: number }
  | { type: 'CRASH_SETTLED'; timeS: number }
  | { type: 'ZONE_ENTERED'; timeS: number; zoneId: string }
  | { type: 'LANDMARK'; timeS: number; kind: LandmarkKind; name?: string }
  | { type: 'INCIDENT_SAY'; timeS: number; line: AcpNarration }
  | { type: 'INCIDENT_DEBRIEF'; timeS: number; debrief: AcpDebrief }
  | { type: 'VIOLATION'; timeS: number; kind: 'turnout-speed' | 'acp-traction'; text: string }
  | {
      type: 'ANNOUNCE';
      timeS: number;
      stationId: string;
      kind: 'arriving' | 'delayed';
      platform?: number;
      lateMin?: number;
    }
  | { type: 'SIGNAL_PASSED'; timeS: number; signalId: string; aspect: Aspect }
  | {
      type: 'SIGNAL_CLEARED';
      timeS: number;
      signalId: string;
      label: string;
      aspect: Aspect;
      /** True when the player's train was standing at the time. */
      stopped: boolean;
    }
  | {
      type: 'ROUTED_LOOP';
      timeS: number;
      stationId: string;
      stationName: string;
      forTrain?: string;
    }
  | { type: 'TRAIN_HELD_FOR_YOU'; timeS: number; trainLabel: string; stationName: string }
  | { type: 'TRAIN_PASSING'; timeS: number; trainLabel: string; sameDirection: boolean }
  | { type: 'OVERSPEED'; timeS: number; speedKmh: number; limitKmh: number }
  | { type: 'OVERSPEED_CLEARED'; timeS: number }
  | { type: 'STATION_STOP'; timeS: number; stationId: string; offsetM: number; lateS?: number }
  | { type: 'END_OF_TRACK'; timeS: number };

export type SimEventType = SimEvent['type'];
