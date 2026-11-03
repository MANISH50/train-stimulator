// ACP (alarm chain pulling) incident. Procedure from docs/IMMERSION_IDEAS.md "Station life":
// the chain opens a valve that vents the brake pipe, so the brakes apply and traction drops;
// the train stops; the ALP/guard finds the coach (flap out, hissing), asks why, resets the
// valve by hand; the brake pipe recharges and the train restarts. The real delay is quoted as
// 15-20 minutes; here it is compressed to CHECK_S (game value). Non-graphic by design.
import type { IncidentSpec } from '../types';
import type { Incident, IncidentWorld } from './incidents';

/** Time from standstill until the valve is reset (game value; real ~15-20 min). */
export const CHECK_S = 45;

export type AcpPhase = 'armed' | 'venting' | 'checking' | 'reset' | 'done';

export class AcpIncident implements Incident {
  phase: AcpPhase = 'armed';
  /** Coach in which the chain was pulled (1-based, counted from the loco). */
  readonly coach: number;
  pulledAtS = 0;
  stoppedAtS = 0;
  private tractionDuringVent = false;
  private stoppingDistM = 0;
  private startS = 0;
  private readonly afterDepartM: number;
  private readonly stationId: string;

  constructor(
    readonly spec: Extract<IncidentSpec, { kind: 'acp' }>,
    coaches: number,
    seed: number,
  ) {
    this.coach = 1 + (seed % Math.max(1, coaches));
    this.afterDepartM = spec.afterDepartM;
    this.stationId = spec.stationId;
  }

  get done(): boolean {
    return this.phase === 'done';
  }

  /** The chain valve is open: the brake pipe vents until it is reset. */
  get venting(): boolean {
    return this.phase === 'venting' || this.phase === 'checking';
  }

  update(w: IncidentWorld): void {
    switch (this.phase) {
      case 'armed':
        if (w.departedM(this.stationId) >= this.afterDepartM && w.speedMs > 1) {
          this.phase = 'venting';
          this.pulledAtS = w.timeS;
          this.startS = w.frontS;
          w.say({
            speaker: 'cab',
            text: 'ACP alarm — brake pipe pressure falling. Close the throttle.',
          });
          w.say({
            speaker: 'guard',
            text: `Guard to driver: alarm chain pulled in coach ${this.coach}. Bring the train to a stop.`,
          });
        }
        break;
      case 'venting':
        if (w.notch > 0) this.tractionDuringVent = true;
        if (w.speedMs < 0.01) {
          this.phase = 'checking';
          this.stoppedAtS = w.timeS;
          this.stoppingDistM = w.frontS - this.startS;
          w.say({
            speaker: 'alp',
            text: `Train stopped. Going back to coach ${this.coach} to find the open valve and reset it.`,
          });
        }
        break;
      case 'checking':
        if (w.notch > 0) this.tractionDuringVent = true;
        if (w.timeS - this.stoppedAtS >= CHECK_S) {
          this.phase = 'reset';
          w.say({
            speaker: 'alp',
            text: `ACP valve in coach ${this.coach} reset. A passenger pulled the chain because a family member was left on the platform. Railway police informed.`,
          });
          w.say({
            speaker: 'guard',
            text: 'Guard to driver: all clear behind. Release the brakes, recharge the brake pipe and proceed.',
          });
        }
        break;
      case 'reset':
        if (w.speedMs > 2) {
          this.phase = 'done';
          const violations = this.tractionDuringVent
            ? ['You kept the throttle open while the brakes were applying.']
            : [];
          for (const v of violations) w.violation('acp-traction', v);
          w.debrief({
            title: 'Incident debrief — alarm chain pulling',
            what: `A passenger pulled the alarm chain in coach ${this.coach} ${Math.round(this.afterDepartM)} m after departure. The valve vented the brake pipe and the brakes applied.`,
            yourResponse: `${violations.length ? 'Throttle not closed promptly. ' : 'Throttle closed. '}The train stopped in ${Math.round(this.stoppingDistM)} m; the valve was found and reset, and you restarted after the all-clear.`,
            rule: 'Pulling the chain without good reason is an offence under Section 141 of the Railways Act, 1989. The loco pilot must stop, let the crew find and reset the valve, and restart only when the brake pipe is recharged and the guard gives the all-clear.',
            violations,
          });
        }
        break;
      case 'done':
        break;
    }
  }
}
