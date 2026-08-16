import { POOL_CAP } from '../config';

export const enum Mode {
  Slide = 0,
  ExplodeIn = 1,
  FadeOut = 2,
}

/** Floats per particle in the interleaved GL buffer. */
export const STRIDE = 11;
// layout: fromX fromY toX toY fromB toB start dur mode seed size

export interface TargetList {
  x: Float32Array;
  y: Float32Array;
  b: Float32Array;
  count: number;
}

/**
 * Structure-of-arrays particle pool backed by one interleaved Float32Array
 * (uploaded directly as the GL vertex buffer). Matched particles keep their
 * slot & seed across morphs so wobble phase stays continuous.
 */
export class ParticlePool {
  data = new Float32Array(POOL_CAP * STRIDE);
  live = 0;
  dirty = true;

  get(i: number, field: number): number {
    return this.data[i * STRIDE + field];
  }

  set(i: number, field: number, v: number): void {
    this.data[i * STRIDE + field] = v;
  }

  /** Drop particles whose FadeOut completed before `now` (compact in place). */
  compact(now: number): void {
    let w = 0;
    const d = this.data;
    for (let r = 0; r < this.live; r++) {
      const base = r * STRIDE;
      const mode = d[base + 8];
      const end = d[base + 6] + d[base + 7];
      if (mode === Mode.FadeOut && end <= now) continue;
      if (w !== r) d.copyWithin(w * STRIDE, base, base + STRIDE);
      w++;
    }
    if (w !== this.live) {
      this.live = w;
      this.dirty = true;
    }
  }

  /** Append one particle; returns its index or -1 if full. */
  add(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    fromB: number,
    toB: number,
    start: number,
    dur: number,
    mode: Mode,
    seed: number,
    size: number,
  ): number {
    if (this.live >= POOL_CAP) return -1;
    const base = this.live * STRIDE;
    const d = this.data;
    d[base] = fromX;
    d[base + 1] = fromY;
    d[base + 2] = toX;
    d[base + 3] = toY;
    d[base + 4] = fromB;
    d[base + 5] = toB;
    d[base + 6] = start;
    d[base + 7] = dur;
    d[base + 8] = mode;
    d[base + 9] = seed;
    d[base + 10] = size;
    this.live++;
    this.dirty = true;
    return this.live - 1;
  }

  /** Rewrite an existing slot as a slide toward a new target (keeps seed/size). */
  retarget(
    i: number,
    fromX: number,
    fromY: number,
    fromB: number,
    toX: number,
    toY: number,
    toB: number,
    start: number,
    dur: number,
  ): void {
    const base = i * STRIDE;
    const d = this.data;
    d[base] = fromX;
    d[base + 1] = fromY;
    d[base + 2] = toX;
    d[base + 3] = toY;
    d[base + 4] = fromB;
    d[base + 5] = toB;
    d[base + 6] = start;
    d[base + 7] = dur;
    d[base + 8] = Mode.Slide;
    this.dirty = true;
  }

  /** Turn an existing slot into a fade-out from its current state. */
  kill(i: number, curX: number, curY: number, curB: number, start: number, dur: number, driftX: number, driftY: number): void {
    const base = i * STRIDE;
    const d = this.data;
    d[base] = curX;
    d[base + 1] = curY;
    d[base + 2] = curX + driftX;
    d[base + 3] = curY + driftY;
    d[base + 4] = curB;
    d[base + 5] = curB * 0.6;
    d[base + 6] = start;
    d[base + 7] = dur;
    d[base + 8] = Mode.FadeOut;
    this.dirty = true;
  }

  clear(): void {
    this.live = 0;
    this.dirty = true;
  }
}

/** Eased position/brightness of particle i at time `now` — must match the vertex shader. */
export function evalParticle(
  pool: ParticlePool,
  i: number,
  now: number,
): { x: number; y: number; b: number; mode: number } {
  const base = i * STRIDE;
  const d = pool.data;
  const t = Math.min(Math.max((now - d[base + 6]) / d[base + 7], 0), 1);
  const e = 1 - Math.pow(1 - t, 3);
  return {
    x: d[base] + (d[base + 2] - d[base]) * e,
    y: d[base + 1] + (d[base + 3] - d[base + 1]) * e,
    b: d[base + 4] + (d[base + 5] - d[base + 4]) * e,
    mode: d[base + 8],
  };
}

export const pool = new ParticlePool();
