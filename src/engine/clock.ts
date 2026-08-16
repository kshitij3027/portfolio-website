/**
 * Single pausable time source. Everything — shader time, morphs, camera tweens,
 * terminal typing, the director's waits — reads this clock, so pausing freezes
 * the entire piece coherently.
 */

interface PendingWait {
  at: number;
  resolve: () => void;
}

export class Clock {
  private time = 0;
  private paused = false;
  private ffActive = false;
  private waits: PendingWait[] = [];

  /** Advance by a real-time delta (called once per rAF). */
  tick(deltaMs: number): void {
    if (this.paused || this.ffActive) return;
    // clamp huge deltas (background tab gaps) so nothing teleports
    this.time += Math.min(deltaMs, 100);
    this.resolveDue();
  }

  private resolveDue(): void {
    if (!this.waits.length) return;
    const due = this.waits.filter((w) => w.at <= this.time);
    if (due.length) {
      this.waits = this.waits.filter((w) => w.at > this.time);
      for (const w of due) w.resolve();
    }
  }

  now(): number {
    return this.time;
  }

  wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      this.waits.push({ at: this.time + ms, resolve });
    });
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }

  isPaused(): boolean {
    return this.paused;
  }

  /**
   * Dev seek: race the clock to `target` in tiny steps, yielding microtasks
   * between steps so every await in the running timeline chain settles before
   * time moves again. DOM/CSS transitions snap; particle uniforms follow.
   */
  async fastForwardTo(targetMs: number): Promise<void> {
    this.ffActive = true;
    const step = 40;
    let i = 0;
    while (this.time < targetMs) {
      this.time += step;
      this.resolveDue();
      // let resolved continuations run and register their next wait
      await Promise.resolve();
      await Promise.resolve();
      if (++i % 250 === 0) await new Promise((r) => setTimeout(r));
    }
    this.ffActive = false;
  }

  /** Drop all pending waits (used when the director resets). */
  clearWaits(): void {
    for (const w of this.waits) w.resolve();
    this.waits = [];
  }
}

export const clock = new Clock();
