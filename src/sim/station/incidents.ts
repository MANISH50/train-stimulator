// Narrated, non-graphic incident scenarios. Each is a small deterministic state machine that
// watches the player's train, narrates through crew/station/control lines, and ends with a
// factual debrief ("what went wrong, which rule applied"). Procedures and rules are in
// docs/IMMERSION_IDEAS.md (ACP) and docs/research/08-incidents.md; durations, distances and
// the animal/fracture speeds are game values, and the debriefs say so. Nobody is hurt or
// shown: the tone is procedure and consequence.
import type { IncidentSpec } from '../types';
import type { StopState } from '../traffic/mover';
import { AcpIncident } from './acp';

export type Speaker = 'cab' | 'guard' | 'alp' | 'control' | 'station';

export interface Narration {
  speaker: Speaker;
  text: string;
  /** Language of a station announcement (defaults to English). */
  lang?: 'hi-IN' | 'en-IN' | 'mr-IN';
}

export interface Debrief {
  title: string;
  what: string;
  yourResponse: string;
  rule: string;
  violations: string[];
}

export type ViolationKind =
  'turnout-speed' | 'acp-traction' | 'wildlife-speed' | 'fracture-speed' | 'unscheduled-stop';

/** What an incident can see and do. The sim implements this. */
export interface IncidentWorld {
  timeS: number;
  frontS: number;
  speedMs: number;
  notch: number;
  trainLengthM: number;
  /** Horn held this step. */
  horn: boolean;
  /** Metres the front is past a station's stop mark after its booked stop is done (-1 before). */
  departedM(stationId: string): number;
  stop(stationId: string): StopState | undefined;
  stationName(stationId: string): string;
  stopMarkM(stationId: string): number;
  /** Add an unscheduled stop for the player at a station. */
  addStop(stationId: string, dwellS: number): void;
  /** Temporary speed restriction over [fromM, toM] (applies until the train's rear clears). */
  addLimit(fromM: number, toM: number, kmh: number): void;
  surgeCrowd(stationId: string, n: number): void;
  /** Sim time until which a home/starter signal is scripted at danger, if any. */
  signalHoldUntilS(signalId: string): number | undefined;
  signalChainage(signalId: string): number | undefined;
  say(n: Narration): void;
  debrief(d: Debrief): void;
  violation(kind: ViolationKind, text: string): void;
}

export interface Incident {
  readonly spec: IncidentSpec;
  /** Current phase name (for tests and the HUD). */
  phase: string;
  readonly done: boolean;
  /** An open ACP valve vents the brake pipe. */
  readonly venting?: boolean;
  /** An animal hazard on the line, for the renderer. */
  readonly hazard?: { s: number; active: boolean } | null;
  update(w: IncidentWorld): void;
}

type Spec<K extends IncidentSpec['kind']> = Extract<IncidentSpec, { kind: K }>;

const kmh = (ms: number) => ms * 3.6;

// ---------------------------------------------------------------------------------------
/** A passenger is unwell: the guard asks for an unscheduled stop at the next station. */
export class MedicalIncident implements Incident {
  phase = 'armed';
  private arrivedAtS = 0;

  constructor(
    readonly spec: Spec<'medical'>,
    private readonly coach: number,
  ) {}

  get done(): boolean {
    return this.phase === 'done';
  }

  update(w: IncidentWorld): void {
    const st = this.spec.stationId;
    const name = w.stationName(st);
    const stop = w.stop(st);
    switch (this.phase) {
      case 'armed':
        if (w.frontS >= this.spec.atS) {
          this.phase = 'requested';
          w.addStop(st, this.spec.dwellS);
          w.say({
            speaker: 'guard',
            text: `Guard to driver: a passenger in coach ${this.coach} is unwell. Please make an unscheduled stop at ${name}.`,
          });
          w.say({
            speaker: 'control',
            text: `Section control: stop at ${name}. The Station Master will arrange medical help on the platform.`,
          });
        }
        break;
      case 'requested':
        if (stop?.arrivedAtS !== undefined) {
          this.phase = 'treating';
          this.arrivedAtS = w.timeS;
          w.say({
            speaker: 'station',
            text: `Medical team is on the platform and going to coach ${this.coach}. The train will wait.`,
          });
        } else if (w.frontS > w.stopMarkM(st) + 35) {
          this.phase = 'done';
          const miss = `Did not stop at ${name} for the medical request.`;
          w.violation('unscheduled-stop', miss);
          w.debrief({
            title: 'Incident debrief — medical emergency',
            what: `The guard reported an unwell passenger and asked for an unscheduled stop at ${name}.`,
            yourResponse: `You did not stop at ${name}. The passenger had to wait for the next scheduled halt.`,
            rule: this.rule,
            violations: [miss],
          });
        }
        break;
      case 'treating':
        if (stop?.done) {
          this.phase = 'done';
          w.say({
            speaker: 'station',
            text: 'The passenger has been attended to. The train may proceed.',
          });
          w.debrief({
            title: 'Incident debrief — medical emergency',
            what: `A passenger in coach ${this.coach} was unwell. The guard called for an unscheduled stop at ${name}.`,
            yourResponse: `You stopped at ${name} and waited ${Math.round(w.timeS - this.arrivedAtS)} s while medical help was given, then left on the starter.`,
            rule: this.rule,
            violations: [],
          });
        }
        break;
    }
  }

  private readonly rule =
    'A passenger who needs urgent medical help is reported by the train staff to the next Station Master, who arranges a doctor; passengers can also call Rail Madad 139. Whether a train may be stopped between stations is not settled in the sources found, so the stop is made at a station (docs/research/08-incidents.md).';
}

// ---------------------------------------------------------------------------------------
/** Cattle or people near the line at a crossing: whistle and slow down. */
export class WildlifeIncident implements Incident {
  phase = 'armed';
  hazard: { s: number; active: boolean } | null = null;
  private hornSounded = false;
  private speedAtPointKmh = -1;

  constructor(readonly spec: Spec<'wildlife'>) {}

  get done(): boolean {
    return this.phase === 'done';
  }

  update(w: IncidentWorld): void {
    const s = this.spec.atS;
    switch (this.phase) {
      case 'armed':
        if (w.frontS >= s - this.spec.warnM) {
          this.phase = 'warning';
          this.hazard = { s, active: true };
          w.say({
            speaker: 'alp',
            text: `ALP: cattle on the line near the level crossing ahead. Sound the horn and slow down to ${this.spec.slowKmh}.`,
          });
        }
        break;
      case 'warning':
        if (w.horn) this.hornSounded = true;
        if (this.speedAtPointKmh < 0 && w.frontS >= s - this.spec.checkM) {
          this.speedAtPointKmh = kmh(w.speedMs);
        }
        if (w.frontS >= s + 15) {
          this.phase = 'done';
          if (this.hazard) this.hazard.active = false;
          const slowed = this.speedAtPointKmh <= this.spec.slowKmh + 2;
          const violations: string[] = [];
          if (!slowed) {
            violations.push(
              `Approached at ${this.speedAtPointKmh.toFixed(0)} km/h with animals on the line; the target was ${this.spec.slowKmh} km/h or less.`,
            );
            w.violation('wildlife-speed', violations[0]!);
          }
          w.say({
            speaker: 'alp',
            text: slowed
              ? 'ALP: the animals have moved off the line. Crossing clear.'
              : 'ALP: the animals moved off at the last moment. That was too fast.',
          });
          w.debrief({
            title: 'Incident debrief — animals near the line',
            what: 'Cattle were standing on and beside the line near a level crossing in farmland.',
            yourResponse: `${this.hornSounded ? 'You sounded the horn. ' : 'You did not sound the horn. '}You passed the animals at ${this.speedAtPointKmh.toFixed(0)} km/h.`,
            rule: `A long whistle is sounded at level crossings and repeated short blasts warn of danger. Walking or standing on the line is trespass (Railways Act, s.147), and a reckless act that endangers safety is an offence under s.154. No official whistle code or speed for animals was found, so the ${this.spec.slowKmh} km/h target is a game value (docs/research/08-incidents.md).`,
            violations,
          });
        }
        break;
    }
  }
}

// ---------------------------------------------------------------------------------------
/** A rail fracture is reported ahead: control orders a caution speed over the section. */
export class FractureIncident implements Incident {
  phase = 'armed';
  private maxKmh = 0;

  constructor(readonly spec: Spec<'fracture'>) {}

  get done(): boolean {
    return this.phase === 'done';
  }

  update(w: IncidentWorld): void {
    const { fromM, toM } = this.spec;
    const rear = w.frontS - w.trainLengthM;
    switch (this.phase) {
      case 'armed':
        if (w.frontS >= this.spec.reportAtS) {
          this.phase = 'active';
          w.addLimit(fromM, toM, this.spec.kmh);
          w.say({
            speaker: 'control',
            text: `Section control to driver: a rail fracture has been reported ahead. Proceed at not more than ${this.spec.kmh} km/h through the section, and watch the track.`,
          });
        }
        break;
      case 'active':
        if (w.frontS + 1 >= fromM && rear <= toM) {
          this.maxKmh = Math.max(this.maxKmh, kmh(w.speedMs));
        }
        if (rear > toM) {
          this.phase = 'done';
          const ok = this.maxKmh <= this.spec.kmh + 2;
          const violations = ok
            ? []
            : [
                `Reached ${this.maxKmh.toFixed(0)} km/h in a ${this.spec.kmh} km/h caution section.`,
              ];
          for (const v of violations) w.violation('fracture-speed', v);
          w.say({
            speaker: 'control',
            text: 'Section control: you are clear of the section. Engineering staff are inspecting the rail.',
          });
          w.debrief({
            title: 'Incident debrief — rail fracture ahead',
            what: 'Control reported a suspected rail fracture and ordered a caution speed over the section.',
            yourResponse: `Your highest speed in the section was ${this.maxKmh.toFixed(0)} km/h against the ${this.spec.kmh} km/h order.`,
            rule: `Drivers report unusual track conditions to the Controller, who informs the maintenance staff (General Rule 6.07), and a defective section is protected until it is repaired (GR 6.03). A press report mentions a 10 km/h caution beside a repaired weld; the ${this.spec.kmh} km/h here is a game value (docs/research/08-incidents.md).`,
            violations,
          });
        }
        break;
    }
  }
}

// ---------------------------------------------------------------------------------------
/** A home signal held at danger with passengers building up on the platform. */
export class SignalHoldIncident implements Incident {
  phase = 'armed';
  /** Seconds the train stood at the signal while it was held. */
  private standS = 0;
  private lastS = 0;

  constructor(readonly spec: Spec<'signal-hold'>) {}

  get done(): boolean {
    return this.phase === 'done';
  }

  update(w: IncidentWorld): void {
    const until = w.signalHoldUntilS(this.spec.signalId) ?? 0;
    const at = w.signalChainage(this.spec.signalId) ?? 0;
    const name = w.stationName(this.spec.stationId);
    switch (this.phase) {
      case 'armed':
        // Armed as the train closes on the signal while it is still held at danger.
        if (at - w.frontS < 600 && at - w.frontS > 0 && w.timeS < until) {
          this.phase = 'held';
          this.lastS = w.timeS;
          w.surgeCrowd(this.spec.stationId, this.spec.surge);
          w.say({
            speaker: 'control',
            text: `Section control: the home signal at ${name} is at danger and the line ahead is not clear. Stand at the signal. Do not pass it at danger.`,
          });
          w.say({
            speaker: 'station',
            text: 'We regret the delay. Trains are running late because the line ahead is not clear. Please wait for further announcements.',
          });
          w.say({
            speaker: 'station',
            lang: 'hi-IN',
            text: 'कृपया ध्यान दें। आगे की लाइन खाली न होने के कारण गाड़ियाँ देरी से चल रही हैं। असुविधा के लिए खेद है।',
          });
        }
        break;
      case 'held':
        if (w.speedMs < 0.3 && at - w.frontS > 0) this.standS += w.timeS - this.lastS;
        this.lastS = w.timeS;
        if (w.timeS >= until) {
          this.phase = 'done';
          w.say({
            speaker: 'control',
            text: 'Section control: the line is clear. The home signal will clear shortly.',
          });
          w.debrief({
            title: 'Incident debrief — signal at danger',
            what: `The home signal at ${name} stayed at danger while the line ahead was not clear, and the platform filled with waiting passengers.`,
            yourResponse:
              this.standS > 1
                ? `You stood at the signal for ${Math.round(this.standS)} s and did not pass it at danger.`
                : 'The line cleared before you reached the signal; you approached it ready to stop and did not pass it at danger.',
            rule: 'Only the Station Master can give authority to pass a signal at danger (General Rule 5.01), and an automatic signal that stays at danger is passed only under General Rule 9.02 after waiting, at 15 or 10 km/h depending on visibility (sources disagree: docs/research/08-incidents.md).',
            violations: [],
          });
        }
        break;
    }
  }
}

// ---------------------------------------------------------------------------------------
/** A child is missing on the platform: the station searches; the train runs to timetable. */
export class MissingChildIncident implements Incident {
  phase = 'armed';
  private arrivedAtS = 0;

  constructor(readonly spec: Spec<'missing-child'>) {}

  get done(): boolean {
    return this.phase === 'done';
  }

  update(w: IncidentWorld): void {
    const st = this.spec.stationId;
    const name = w.stationName(st);
    const stop = w.stop(st);
    switch (this.phase) {
      case 'armed':
        if (stop?.arrivedAtS !== undefined) {
          this.phase = 'searching';
          this.arrivedAtS = w.timeS;
          w.say({
            speaker: 'station',
            text: `Attention please. A young child has been separated from the family on the platform at ${name}. Anyone who has seen the child, please inform the station staff or the railway police (RPF).`,
          });
          w.say({
            speaker: 'station',
            lang: 'hi-IN',
            text: `कृपया ध्यान दें। ${name} स्टेशन पर एक छोटा बच्चा परिवार से बिछड़ गया है। जिन्होंने बच्चे को देखा हो, वे कृपया स्टेशन कर्मचारी या रेलवे पुलिस को सूचित करें।`,
          });
        }
        break;
      case 'searching':
        if (w.timeS - this.arrivedAtS >= this.spec.foundAfterS) {
          this.phase = 'found';
          w.say({
            speaker: 'station',
            text: 'The child has been found and is with the family. Thank you for your help.',
          });
        }
        if (stop?.done && this.phase === 'searching') this.finish(w, name, false);
        break;
      case 'found':
        if (stop?.done) this.finish(w, name, true);
        break;
    }
  }

  private finish(w: IncidentWorld, name: string, found: boolean): void {
    this.phase = 'done';
    w.debrief({
      title: 'Incident debrief — missing child',
      what: `A child was separated from the family on the platform at ${name}. Station staff and the railway police searched.`,
      yourResponse: `You kept to the timetable: you waited for the starter and left when it cleared. ${found ? 'The child was found while you were at the platform.' : 'The search went on after you left; the railway police check the next stop if the child may have boarded.'}`,
      rule: "A person who finds a child alone should tell the railway police (RPF) or station staff; help lines are Rail Madad 139 and Childline 1098 (not every number is confirmed at every station). No source says a train is held for a missing child: that is the Station Master's and control's call, so the train runs to the timetable (docs/research/08-incidents.md).",
      violations: [],
    });
  }
}

// ---------------------------------------------------------------------------------------
export function createIncident(spec: IncidentSpec, coaches: number, seed: number): Incident {
  switch (spec.kind) {
    case 'acp':
      return new AcpIncident(spec, coaches, seed);
    case 'medical':
      return new MedicalIncident(spec, 1 + (seed % Math.max(1, coaches)));
    case 'wildlife':
      return new WildlifeIncident(spec);
    case 'fracture':
      return new FractureIncident(spec);
    case 'signal-hold':
      return new SignalHoldIncident(spec);
    case 'missing-child':
      return new MissingChildIncident(spec);
  }
}
