/** Critically-damped smoothing (Game Programming Gems 4 / "SmoothDamp"). */
export class SmoothDamp {
  value: number;
  velocity = 0;
  constructor(initial: number, public smoothTime = 0.38) {
    this.value = initial;
  }
  snap(v: number): void {
    this.value = v;
    this.velocity = 0;
  }
  step(target: number, dt: number): number {
    const omega = 2 / this.smoothTime;
    const x = omega * dt;
    const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
    const change = this.value - target;
    const temp = (this.velocity + omega * change) * dt;
    this.velocity = (this.velocity - omega * temp) * exp;
    this.value = target + (change + temp) * exp;
    return this.value;
  }
}
