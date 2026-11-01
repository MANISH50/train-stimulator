export const SIM_HZ = 60;
export const SIM_DT = 1 / SIM_HZ;
const MAX_STEPS_PER_FRAME = 10;

/**
 * Fixed-timestep accumulator. Call `advance(realDt)` once per rendered frame;
 * it returns how many sim steps to run and the interpolation alpha for rendering.
 */
export class FixedClock {
  private acc = 0;

  advance(realDtS: number): { steps: number; alpha: number } {
    // Clamp long pauses (tab hidden, breakpoints) so the sim never spirals.
    this.acc += Math.min(realDtS, MAX_STEPS_PER_FRAME * SIM_DT);
    let steps = 0;
    while (this.acc >= SIM_DT && steps < MAX_STEPS_PER_FRAME) {
      this.acc -= SIM_DT;
      steps++;
    }
    return { steps, alpha: this.acc / SIM_DT };
  }
}
