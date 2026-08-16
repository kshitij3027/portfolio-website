import type { Ctx } from '../kit';

/** Dissolve target: nothing at all. */
export function drawEmpty(_ctx: Ctx): void {
  // intentionally blank — the sampler emits zero targets and everything fades out
}
